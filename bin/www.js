#!/usr/bin/env node

import app from '../src/index.js';
import { koaSwagger } from 'koa2-swagger-ui';
import yamljs from 'yamljs';

const PORT = process.env.PORT ?? 3000;

// Log the environment.
if (app.env === 'development') {
	console.debug('Running in development mode.');
}

// Make `console.debug()` a no-op in production.
if (app.env !== 'development') {
	console.debug = () => {};
}

// Enable Swagger UI if the environment variable is set to true.
if (process.env.ENABLE_SWAGGER_UI === 'true') {
	// prettier-ignore
	app.use(koaSwagger({
		routePrefix: '/swagger-ui',
		swaggerOptions: {
			spec: yamljs.load('./docs/swagger.yaml'),
		},
	}));
}

// Handle exit signal gracefully.
const gracefulShutdown = () => {
	console.info('Exiting...');
	process.exit(0);
};

process.on('SIGINT', gracefulShutdown);

process.on('SIGTERM', gracefulShutdown);

process.on('uncaughtException', (err) => {
	console.error('Uncaught exception', err);
});

process.on('unhandledRejection', (reason, promise) => {
	console.error('Unhandled rejection at', promise, 'reason:', reason);
});

app.listen(PORT);
