/**
 * Creates an index if it does not already exist.
 *
 * @param client - The Elasticsearch client.
 * @param request - The request object containing the index name and settings.
 * @returns A promise that resolves when the index is created or already exists.
 */
export const createIndexIfNotExists = async (client, request) => {
	if (!(await client.indices.exists({ index: request['index'] }))) {
		await client.indices.create(request);
	}
};

/**
 * Escapes or removes special characters in a string for use in a query.
 *
 * @param {string} str - The string to escape.
 * @returns {string} The escaped string.
 */
export const escape = (str) => {
	return str.replace(/[+\-=&|!(){}[\]^"~*?:\\/]/g, '\\$&').replace(/[<>]/g, '');
};

/**
 * Retrieves the document count of a specified index.
 *
 * @param {import('@elastic/elasticsearch').Client} client - The Elasticsearch client.
 * @param {string} index - The name of the index.
 * @returns {Promise<number>} A promise that resolves with the document count of the index.
 */
export const getIndexDocsCount = async (client, index) => {
	const stats = await client.indices.stats({ index });
	return stats.indices[index].total.docs.count;
};
