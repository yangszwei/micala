import { getInstances, getSeries, queryStudies } from '#lib/dicom-web/qido-rs.js';

/**
 * @param {import('koa').Context} ctx
 * @returns {Promise<void>}
 */
export const getStudiesController = async (ctx) => {
	const query = {
		patientId: ctx.query['patientId'],
		patientName: ctx.query['patientName'],
		fromDate: ctx.query['fromDate'],
		toDate: ctx.query['toDate'],
		modality: ctx.query['modality'],
		identifier: ctx.query['identifier'],
	};

	try {
		const items = await queryStudies(query);
		ctx.status = 200;
		ctx.body = { ok: true, items };
	} catch (e) {
		ctx.status = 500;
		ctx.body = { ok: false, message: e.message };
	}
};

export const getSeriesController = async (ctx) => {
	const studyUid = ctx.params['studyUid'];

	try {
		const items = await getSeries(studyUid);
		ctx.status = 200;
		ctx.body = { ok: true, items };
	} catch (e) {
		ctx.status = 500;
		ctx.body = { ok: false, message: e.message };
	}
};

export const getInstancesController = async (ctx) => {
	const studyUid = ctx.params['studyUid'];
	const seriesUid = ctx.params['seriesUid'];

	try {
		const items = await getInstances(studyUid, seriesUid);
		ctx.status = 200;
		ctx.body = { ok: true, items };
	} catch (e) {
		ctx.status = 500;
		ctx.body = { ok: false, message: e.message };
	}
};
