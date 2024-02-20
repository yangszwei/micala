import { createIndexIfNotExists, getIndexDocsCount } from '#lib/elasticsearch/utils.js';
import { fetchDicomJson, fetchDicomThumbnail, getMetadata } from '#lib/dicom-web/wado-rs.js';
import { getInstanceUids, getSeriesUids } from '#lib/dicom-web/qido-rs.js';
import { joinDataPath, toPublicUrl } from '#lib/utils/data.js';
import db from '#lib/mongodb/client.js';
import fs from 'fs/promises';
import myImagingStudies from './indices/my-imaging-studies.js';
import { newSearchBody } from './services/search.js';
import radlexterm from './indices/radlexterm.js';
import radlextermPipeline from './indices/radlexterm-pipeline.js';
import tags from '#lib/dicom-web/tags.js';
import { uploadQueue } from './services/upload.js';

/**
 * Creates indices and ingest pipelines for handling imaging studies.
 *
 * @param {import('@elastic/elasticsearch').Client} client - The Elasticsearch client.
 * @returns {Promise<void>} A promise that resolves when operations are complete.
 */
export const createStudiesIndicesAndPipelines = async (client) => {
	await createIndexIfNotExists(client, myImagingStudies);
	await createIndexIfNotExists(client, radlexterm);
	await client.ingest.putPipeline(radlextermPipeline);
};

/**
 * Populates the 'radlexterm' index with data from `radlexStem.csv` if the index is empty.
 *
 * @param {import('@elastic/elasticsearch').Client} client - The Elasticsearch client.
 * @returns {Promise<void>} A promise that resolves when the index is populated.
 */
export const populateRadLexTermIndex = async (client) => {
	if ((await getIndexDocsCount(client, radlexterm['index'])) > 0) {
		return;
	}

	const file = await fs.readFile('./data/terms/radlexStem.csv', 'utf8');
	const radlexStem = file.replace(/\r/g, '').split('\n').slice(1);

	console.debug(`Populating "${radlexterm['index']}" index...`);

	await client.bulk({
		index: radlexterm['index'],
		pipeline: radlexterm['id'],
		operations: radlexStem.flatMap((message) => [{ index: {} }, { message }]),
	});
};

/**
 * Search for imaging studies matching the given query.
 *
 * @param {import('@elastic/elasticsearch').Client} client - The Elasticsearch client.
 * @param {SearchStudiesQuery} query - The query.
 */
export const searchImagingStudies = async (client, query) => {
	const response = await client.search({
		index: myImagingStudies['index'],
		...newSearchBody(query),
	});

	// Convert the facets to API format.
	const facets = response.aggregations;
	for (const [field, { buckets }] of Object.entries(facets)) {
		facets[field] = buckets ?? [];
	}

	// Get the studies from the response.
	const studies = [];
	for (const { _source: hit } of response.hits.hits) {
		let thumbnail = null;

		const cache = await db().collection('thumbnails').findOne({ uid: hit.uid });
		if (cache) {
			thumbnail = cache.filename;
			try {
				await fs.access(joinDataPath('thumbnails', thumbnail));
			} catch (e) {
				thumbnail = null;
			}
		}

		if (!thumbnail) {
			const filename = await fetchDicomThumbnail(hit.uid);
			thumbnail = filename[0] ?? '';
		}

		// Cache the thumbnail filename.
		await db()
			.collection('thumbnails')
			.updateOne({ uid: hit.uid }, { $set: { filename: thumbnail } }, { upsert: true });

		studies.push({
			id: hit.uid,
			thumbnail: toPublicUrl(`thumbnails/${thumbnail}`),
			instanceUid: hit?.series?.[0]?.instance?.[0]?.uid ?? null,
			report: hit?.report?.Records?.FULLTEXT ?? '',
		});
	}

	// Get the total number of hits.
	const total = response.hits.total.value;

	return { facets, studies, total };
};

/**
 * Indexes the given study in Elasticsearch.
 *
 * @param {import('@elastic/elasticsearch').Client} client - The Elasticsearch client.
 * @param {string} studyUid - The UID of the study to index.
 * @returns {Promise<void>} A promise that resolves when the study has been indexed.
 */
export async function* indexImagingStudy(client, studyUid) {
	const document = {
		uid: studyUid,
		dicomJson: (await fetchDicomJson(studyUid))[0],
		series: [],
	};

	const seriesUids = await getSeriesUids(studyUid);

	let progress = 1 / (seriesUids.length + 1);
	yield progress;

	for (const seriesUid of seriesUids) {
		const series = {
			uid: seriesUid,
			dicomJson: await fetchDicomJson(studyUid, seriesUid),
			instance: [],
		};

		const instanceUids = await getInstanceUids(studyUid, seriesUid);
		for (const instanceUid of instanceUids) {
			series.instance.push({
				uid: instanceUid,
				dicomJson: await fetchDicomJson(studyUid, seriesUid, instanceUid),
				metadata: await getMetadata(studyUid, seriesUid, instanceUid),
			});
			progress += Math.min((1 / (seriesUids.length + 1)) * instanceUids.length, 1);
			yield progress;
		}

		document.series.push(series);

		yield 1;
	}

	await client.index({
		index: myImagingStudies['index'],
		id: document.dicomJson[tags.STUDY_INSTANCE_UID].Value[0],
		document,
	});
}

/**
 * Uploads the given DICOM files to the server and indexes them.
 *
 * @param {import('@elastic/elasticsearch').Client} client - The Elasticsearch client.
 * @param {string[]} files - The paths to the DICOM files to upload.
 * @returns {Promise<string>} A promise that resolves with the ID of the upload job.
 */
export const uploadImagingStudies = async (client, files) => {
	const job = await uploadQueue.add('upload', { files });

	return job.id;
};
