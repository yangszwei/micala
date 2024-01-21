import { indexImagingStudy } from '../index.js';

/**
 * @param {import('koa').Context} ctx
 * @returns {Promise<void>}
 */
export default async (ctx) => {
	if (!ctx.query.id) {
		ctx.status = 400;
		ctx.body = { message: 'No study ID specified' };
		return;
	}

	try {
		await indexImagingStudy(ctx.esclient, ctx.query.id);
	} catch (e) {
		ctx.status = 500;
		ctx.body = { ok: false, message: e.message };
		return;
	}

	ctx.body = { ok: true };
};
