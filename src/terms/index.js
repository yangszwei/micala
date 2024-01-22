import { createIndexIfNotExists, escape, getIndexDocsCount } from '#lib/elasticsearch/utils.js';
import fs from 'fs/promises';
import myTerms from './indices/my-terms.js';
import myTermsPipeline from './indices/my-terms-pipeline.js';

/**
 * Creates the 'my-terms' index and ingest pipeline if they do not already exist.
 *
 * @param {import('@elastic/elasticsearch').Client} client - The Elasticsearch client.
 * @returns {Promise<void>} A promise that resolves when operations are complete.
 */
export const createMyTermsIndexAndPipeline = async (client) => {
	await createIndexIfNotExists(client, myTerms);
	await client.ingest.putPipeline(myTermsPipeline);
};

/**
 * Populates the 'my-terms' index with data from `allterms.csv` if the index is empty.
 *
 * @param {import('@elastic/elasticsearch').Client} client - The Elasticsearch client.
 * @returns {Promise<void>} A promise that resolves when the index is populated.
 */
export const populateMyTermsIndex = async (client) => {
	if ((await getIndexDocsCount(client, myTerms['index'])) > 0) {
		return;
	}

	const file = await fs.readFile('./data/terms/allterms.csv', 'utf8');
	const allterms = file.replace(/\r/g, '').split('\n').slice(1);

	console.debug('Populating "my-terms" index...');

	await client.bulk({
		index: myTerms['index'],
		pipeline: myTermsPipeline['id'],
		operations: allterms.flatMap((message) => [{ index: {} }, { message }]),
	});
};

/**
 * Get autocomplete suggestions by the given terms.
 *
 * @param {import('@elastic/elasticsearch').Client} client - The Elasticsearch client.
 * @param {string[]} terms - The terms to autocomplete.
 * @param {number} [n=10] - The maximum number of suggestions to return. Default is `10`
 * @returns {Promise<{ key: string; doc_count: number }[]>} The terms autocomplete.
 */
export const getTermsAutocomplete = async (client, terms, n = 10) => {
	const autocompletes = [];

	for (const term of terms) {
		const response = await client.search({
			index: myTerms['index'],
			body: {
				size: 0,
				query: {
					prefix: {
						'terms.autocomplete': {
							value: term,
						},
					},
				},
				aggs: {
					my_unbiased_sample: {
						sampler: {
							shard_size: 6000,
						},
						aggs: {
							terms: {
								terms: {
									field: 'terms.autocomplete',
									include: `${escape(term)}.*`,
									order: {
										_count: 'desc',
									},
								},
							},
						},
					},
				},
			},
		});

		const buckets = response.aggregations.my_unbiased_sample.terms.buckets;
		if (buckets.length > 0) {
			autocompletes.push(...buckets);
		}
	}

	// Get the top n suggestions.
	autocompletes.sort((a, b) => b.doc_count - a.doc_count).slice(0, n);

	return autocompletes;
};

/**
 * Get suggestions by the given search term.
 *
 * @param {import('@elastic/elasticsearch').Client} client - The Elasticsearch client.
 * @param {string} search - The search term.
 * @param {number} fuzziness - The fuzziness of the search term.
 * @returns {Promise<string[]>} The terms suggestion.
 */
export const getTermsSuggestion = async (client, search, fuzziness = 0) => {
	const response = await client.search({
		index: myTerms['index'],
		body: {
			suggest: {
				'my-suggest': {
					text: search,
					completion: {
						field: 'terms.default',
						size: 10,
						skip_duplicates: true,
						fuzzy: {
							fuzziness,
							prefix_length: 0,
						},
					},
				},
			},
		},
	});

	const options = response.suggest['my-suggest'][0].options;

	// Try again with a higher fuzziness if no results were found.
	if (options.length === 0 && fuzziness <= 6) {
		return getTermsSuggestion(client, search, fuzziness + 1);
	}

	return options.map((option) => option.text);
};
