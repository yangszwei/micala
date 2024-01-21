import path from 'path';

/**
 * Converts the given path to a public URL based on the `ORIGIN` environment variable.
 *
 * @param {string} path - The path to convert.
 * @returns {string} The public URL.
 */
export const toPublicUrl = (path) => {
	const origin = process.env.ORIGIN ?? 'http://localhost:3000';
	return new URL(path.replace(/^\//, './'), origin).toString();
};

/**
 * Joins a path relative to the data directory.
 *
 * @param {string} name - The path to resolve.
 * @returns {string} The resolved path.
 */
export const joinDataPath = (...name) => {
	return path.join(process.env.DATA_PATH ?? './data', ...name);
};
