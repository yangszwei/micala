import Router from '@koa/router';
import suggestion from './controllers/suggestions.js';

const router = new Router();

router.get('/terms/suggestions', suggestion);

export default router;
