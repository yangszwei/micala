import { createIndexIfNotExists, getIndexDocsCount } from '#lib/elasticsearch/utils.js';
import { fetchDicomJson, fetchDicomThumbnail, getMetadata } from '#lib/dicom-web/wado-rs.js';
import { getInstanceUids, getSeriesUids } from '#lib/dicom-web/qido-rs.js';
import fs from 'fs/promises';
import myImagingStudies from './indices/my-imaging-studies.js';
import { newSearchBody } from './services/search.js';
import radlexterm from './indices/radlexterm.js';
import radlextermPipeline from './indices/radlexterm-pipeline.js';
import tags from '#lib/dicom-web/tags.js';
import { toPublicUrl } from '#lib/utils/data.js';
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
		const thumbnail = await fetchDicomThumbnail(hit.uid);
		if (thumbnail.length > 1) {
			thumbnail.slice(1).forEach((path) => fs.rm(path));
		}

		studies.push({
			id: hit.uid,
			thumbnail: toPublicUrl(`thumbnails/${thumbnail[0]}`),
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
export const indexImagingStudy = async (client, studyUid) => {
	const document = {
		uid: studyUid,
		dicomJson: (await fetchDicomJson(studyUid))[0],
		series: [],
	};

	for (const seriesUid of await getSeriesUids(studyUid)) {
		const series = {
			uid: seriesUid,
			dicomJson: await fetchDicomJson(studyUid, seriesUid),
			instance: [],
		};

		for (const instanceUid of await getInstanceUids(studyUid, seriesUid)) {
			series.instance.push({
				uid: instanceUid,
				dicomJson: await fetchDicomJson(studyUid, seriesUid, instanceUid),
				metadata: await getMetadata(studyUid, seriesUid, instanceUid),
			});
		}

		document.series.push(series);
	}

	await client.index({
		index: myImagingStudies['index'],
		id: document.dicomJson[tags.STUDY_INSTANCE_UID].Value[0],
		document,
	});
};

/**
 * Uploads the given DICOM files to the server and indexes them.
 *
 * @param {import('@elastic/elasticsearch').Client} client - The Elasticsearch client.
 * @param {string[]} files - The paths to the DICOM files to upload.
 * @returns {string} A promise that resolves with the ID of the upload job.
 */
export const uploadImagingStudies = async (client, files) => {
	const job = await uploadQueue.add('upload', { files });

	return job.id;
};
