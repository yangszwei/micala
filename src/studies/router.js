import { getInstancesController, getSeriesController, getStudiesController } from './controllers/manage.js';
import { getStudiesUploadProgress, uploadStudies } from './controllers/upload.js';
import Router from '@koa/router';
import indexImagingStudy from './controllers/index.js';
import path from 'path';
import searchImagingStudies from './controllers/search.js';
import send from 'koa-send';

const DATA_PATH = process.env.DATA_PATH ?? './data';

const router = new Router();

// Serve study thumbnails.
router.get('/thumbnails/:name', async (ctx) => {
	try {
		await send(ctx, path.join('thumbnails', ctx.params.name), { root: DATA_PATH });
	} catch (e) {
		ctx.status = 404;
	}
});

// Studies routes.
router.post('/studies/index', indexImagingStudy);
router.get('/studies', getStudiesController);
router.get('/studies/:studyUid/series', getSeriesController);
router.get('/studies/:studyUid/series/:seriesUid/instances', getInstancesController);
router.get('/studies/search', searchImagingStudies);
router.post('/studies/upload', uploadStudies);
router.get('/studies/upload', getStudiesUploadProgress);

export default router;
