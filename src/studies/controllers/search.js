import { searchImagingStudies } from '../index.js';

/**
 * @param {import('koa').Context} ctx
 * @returns {Promise<void>}
 */
export default async (ctx) => {
	/** @type {SearchStudiesQuery} */
	const query = ctx.query;

	if (!query.search) {
		ctx.status = 400;
		ctx.body = { message: 'No search query specified' };
		return;
	}

	try {
		const result = await searchImagingStudies(ctx.esclient, ctx.query);
		ctx.body = { ok: true, ...result };
	} catch (e) {
		ctx.status = 500;
		ctx.body = { ok: false, message: e.message };
	}
};
