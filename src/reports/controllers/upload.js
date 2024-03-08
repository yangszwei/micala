import { saveReports } from '../services/upload.js';

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
		await saveReports({
			patientId: ctx.request.body.patientId,
			reportNumber: ctx.request.body.reportNumber,
			files: files.map((file) => file.filepath),
		});
		ctx.body = { ok: true };
	} catch (e) {
		ctx.status = 500;
		ctx.body = { ok: false, message: e.message };
	}
};
