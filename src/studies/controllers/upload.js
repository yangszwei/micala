import { PassThrough } from 'stream';
import { toPublicUrl } from '#lib/utils/data.js';
import { uploadImagingStudies } from '../index.js';
import uploadWorker from '../services/upload.js';

/**
 * @param {import('koa').Context} ctx
 * @returns {void}
 */
export const uploadStudies = (ctx) => {
	let files = ctx.request?.files?.file;
	if (!files || files.length === 0) {
		ctx.throw(400, 'No files uploaded');
	}

	// Make sure that `files` is an array.
	files = Array.isArray(files) ? files : [files];

	// Upload the studies to the PACS server.
	try {
		files = files.map((file) => file.filepath);
		const jobId = uploadImagingStudies(ctx.esclient, files);
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
			stream.write(`data: ${JSON.stringify({ done: true })}\n\n`);
			stream.end();
		}
	});

	uploadWorker.on('failed', (job, error) => {
		if (job.id === jobId) {
			stream.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
			stream.end();
		}
	});

	ctx.type = 'text/event-stream';
	ctx.body = stream;
};
