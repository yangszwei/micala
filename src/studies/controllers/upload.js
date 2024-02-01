import uploadWorker, { uploadQueue } from '../services/upload.js';
import { PassThrough } from 'stream';
import { toPublicUrl } from '#lib/utils/data.js';
import { uploadImagingStudies } from '../index.js';

/**
 * @param {import('koa').Context} ctx
 * @returns {void}
 */
export const uploadStudies = async (ctx) => {
	let files = ctx.request?.files?.file;
	if (!files || files.length === 0) {
		ctx.throw(400, 'No files uploaded');
	}

	// Make sure that `files` is an array.
	files = Array.isArray(files) ? files : [files];

	// Upload the studies to the PACS server.
	try {
		files = files.map((file) => file.filepath);
		const jobId = await uploadImagingStudies(ctx.esclient, files);
		ctx.body = { ok: true, progress: toPublicUrl(`/studies/upload?jobId=${jobId}`) };
	} catch (e) {
		ctx.status = 500;
		ctx.body = { ok: false, message: e.message };
	}
};

/**
 * @param {import('koa').Context} ctx
 * @returns {Promise<void>}
 */
export const getStudiesUploadProgress = async (ctx) => {
	const { jobId } = ctx.query;
	if (!jobId) {
		ctx.throw(400, 'No jobId provided');
	}

	const stream = new PassThrough();

	uploadWorker.on('progress', (job, progress) => {
		if (job.id === jobId) {
			stream.write(`data: ${JSON.stringify(progress)}\n\n`);
		}
	});

	uploadWorker.on('completed', (job) => {
		if (job.id === jobId) {
			stream.write(`data: ${JSON.stringify({ type: 'completed' })}\n\n`);
			stream.end();
		}
	});

	uploadWorker.on('failed', (job, error) => {
		if (job.id === jobId) {
			stream.write(`data: ${JSON.stringify({ type: 'failed', message: error.message })}\n\n`);
			stream.end();
		}
	});

	uploadQueue.getJob(jobId).then((job) => {
		if (job) {
			stream.write(`data: ${JSON.stringify(job.progress)}\n\n`);
		}
	});

	ctx.type = 'text/event-stream';
	ctx.body = stream;
};
