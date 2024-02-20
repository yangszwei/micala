import { Queue, Worker } from 'bullmq';
import { connection } from '#lib/bullmq/config.js';
import esclient from '#lib/elasticsearch/client.js';
import { indexImagingStudy } from '../index.js';
import { uploadDicomStudies } from '#lib/dicom-web/stow-rs.js';

export const uploadQueue = new Queue('upload', { connection });

const worker = new Worker(
	'upload',
	async (job) => {
		const status = { status: 'uploading', progress: 0 };

		await job.updateProgress(status);

		const uploadTask = uploadDicomStudies(job.data.files, async (progress) => {
			status.progress = Math.min(progress * 0.25, status.progress);
			await job.updateProgress(status);
		});

		await Promise.race([
			uploadTask,
			new Promise((resolve) => {
				let startProgress = status.progress;
				let i = 1;
				const delay = 500; // initial delay
				const increase = 50; // increase in delay per iteration

				const intervalFunc = async () => {
					status.progress = Math.max(startProgress + i * 0.01, status.progress);
					await job.updateProgress(status);
					if (++i > 25) {
						await uploadTask;
						resolve();
					} else {
						setTimeout(intervalFunc, delay + increase * i);
					}
				};

				setTimeout(intervalFunc, delay);
			}),
		]);

		const studyUids = await uploadTask;

		status.progress = 0.25;
		status.status = 'indexing';
		await job.updateProgress(status);

		// Index the studies.
		for (const studyUid of studyUids) {
			status.currentStudyUid = studyUid;
			const increment = 0.75 / studyUids.length / 20;
			let i = 1;
			await Promise.race([
				new Promise((resolve) => {
					const delay = 500; // initial delay
					const increase = 50; // increase in delay per iteration

					const intervalFunc = async () => {
						status.progress = Math.max(0.25 + i * increment, status.progress);
						await job.updateProgress(status);
						if (++i > 20) {
							resolve();
						} else {
							setTimeout(intervalFunc, delay + increase * i);
						}
					};

					setTimeout(intervalFunc, delay);
				}),
				(async () => {
					for await (const progress of indexImagingStudy(esclient, studyUid)) {
						status.progress = Math.max(0.25 + progress * (0.75 / studyUids.length), status.progress);
						await job.updateProgress(status);
					}
				})(),
			]);
		}

		status.status = 'done';
		status.progress = 1;
		await job.updateProgress(status);
	},
	{ connection },
);

if (!worker.isRunning()) {
	await worker.run();
}

export default worker;
