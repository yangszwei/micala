import Router from '@koa/router';
import uploadReports from './controllers/upload.js';

const router = new Router();

router.post('/reports/upload', uploadReports);

export default router;
