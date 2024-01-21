import { uploadImagingStudies } from '../index.js';

/**
 * @param {import('koa').Context} ctx
 * @returns {Promise<void>}
 */
export default async (ctx) => {
	let files = ctx.request?.files?.file;
	if (!files || files.length === 0) {
		ctx.throw(400, 'No files uploaded');
	}

	// Make sure that `files` is an array.
	files = Array.isArray(files) ? files : [files];

	// Upload the studies to the PACS server.
	try {
		files = files.map((file) => file.filepath);
		await uploadImagingStudies(ctx.esclient, files);
	} catch (e) {
		ctx.status = 500;
		ctx.body = { ok: false, message: e.message };
		return;
	}

	ctx.body = { ok: true };
};
