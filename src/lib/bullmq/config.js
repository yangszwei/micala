/** The Redis connection configuration for BullMQ */
export const connection = Object.freeze({
	host: process.env.REDIS_HOST || 'localhost',
	port: Number(process.env.REDIS_PORT) || 6379,
});
