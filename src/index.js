import { createMyTermsIndexAndPipeline, populateMyTermsIndex } from './terms/index.js';
import { createStudiesIndicesAndPipelines, populateRadLexTermIndex } from './studies/index.js';
import Koa from 'koa';
import db from '#lib/mongodb/client.js';
import esclient from '#lib/elasticsearch/client.js';
import { koaBody } from 'koa-body';
import studiesRouter from './studies/router.js';
import termsRouter from './terms/router.js';

const app = new Koa();

app.context.db = db;
app.context.esclient = esclient;

// Enable body parsing with multipart/form-data support.
app.use(koaBody({ multipart: true }));

// Register routes.
app.use(studiesRouter.routes()).use(studiesRouter.allowedMethods());
app.use(termsRouter.routes()).use(termsRouter.allowedMethods());

// Create Elasticsearch indices and pipelines.
try {
	await createStudiesIndicesAndPipelines(esclient);
	await populateRadLexTermIndex(esclient);
	await createMyTermsIndexAndPipeline(esclient);
	await populateMyTermsIndex(esclient);
	console.debug('Indices and pipelines created successfully.');
} catch (e) {
	console.error('Failed to create indices and pipelines:', e);
}

export default app;
