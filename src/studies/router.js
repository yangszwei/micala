import Router from '@koa/router';
import indexImagingStudy from './controllers/index.js';
import path from 'path';
import searchImagingStudies from './controllers/search.js';
import send from 'koa-send';
import uploadImagingStudies from './controllers/upload.js';

const DATA_PATH = process.env.DATA_PATH ?? './data';

const router = new Router();

// Serve study thumbnails.
router.get('/thumbnails/:name', async (ctx) => {
	await send(ctx, path.join('thumbnails', ctx.params.name), { root: DATA_PATH });
});

// Studies routes.
router.post('/studies/index', indexImagingStudy);
router.get('/studies/search', searchImagingStudies);
router.post('/studies/upload', uploadImagingStudies);

export default router;
