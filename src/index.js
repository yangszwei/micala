import { createMyTermsIndexAndPipeline, populateMyTermsIndex } from './terms/index.js';
import Koa from 'koa';
import esclient from '#lib/elasticsearch/client.js';
import termsRouter from './terms/router.js';

const app = new Koa();

app.context.esclient = esclient;

// Register routes.
app.use(termsRouter.routes()).use(termsRouter.allowedMethods());

// Create Elasticsearch indices and pipelines.
try {
	await createMyTermsIndexAndPipeline(esclient);
	await populateMyTermsIndex(esclient);
	console.debug('Indices and pipelines created successfully.');
} catch (e) {
	console.error('Failed to create indices and pipelines:', e);
}

export default app;
