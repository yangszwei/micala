import Router from '@koa/router';
import indexImagingStudy from './controllers/index.js';
import { joinDataPath } from '#lib/utils/data.js';
import searchImagingStudies from './controllers/search.js';
import send from 'koa-send';
import uploadImagingStudies from './controllers/upload.js';

const router = new Router();

// Serve study thumbnails.
router.get('/thumbnails/:name', async (ctx) => {
	await send(ctx, joinDataPath(`thumbnails/${ctx.params.name}`));
});

// Studies routes.
router.post('/studies/index', indexImagingStudy);
router.get('/studies/search', searchImagingStudies);
router.post('/studies/upload', uploadImagingStudies);

export default router;
