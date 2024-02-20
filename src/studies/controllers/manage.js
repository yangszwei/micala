import { queryStudies } from '#lib/dicom-web/qido-rs.js';

/**
 * @param {import('koa').Context} ctx
 * @returns {Promise<void>}
 */
export default async (ctx) => {
	const query = {
		patientId: ctx.query['patientId'],
		patientName: ctx.query['patientName'],
		fromDate: ctx.query['fromDate'],
		toDate: ctx.query['toDate'],
		modality: ctx.query['modality'],
		identifier: ctx.query['identifier'],
	};

	console.log('query', query);

	try {
		const items = await queryStudies(query);
		ctx.status = 200;
		ctx.body = { ok: true, items };
	} catch (e) {
		ctx.status = 500;
		ctx.body = { ok: false, message: e.message };
	}
};
