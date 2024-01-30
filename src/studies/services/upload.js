import { Queue, Worker } from 'bullmq';
import esclient from '#lib/elasticsearch/client.js';
import { indexImagingStudy } from '../index.js';
import { uploadDicomStudies } from '#lib/dicom-web/stow-rs.js';

export const uploadQueue = new Queue('upload');

const worker = new Worker(
	'upload',
	async (job) => {
		await job.updateProgress({ status: 'uploading' });

		const studyUids = await uploadDicomStudies(job.data.files);

		// Index the studies.
		for (const studyUid of studyUids) {
			await job.updateProgress({ status: 'indexing', studyUid });
			await job.updateProgress({ done: false, currentStudyUid: studyUid });
			await indexImagingStudy(esclient, studyUid);
		}

		await job.updateProgress({ status: 'done' });
	},
	{
		connection: {
			host: 'localhost',
			port: 6379,
		},
	},
);

if (!worker.isRunning()) {
	await worker.run();
}

export default worker;
