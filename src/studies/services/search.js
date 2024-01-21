const multiMatch = ({ query, type = 'best_fields', boost, fuzziness, operator }) => ({
	multi_match: {
		query: query,
		lenient: 'true',
		analyzer: 'standard',
		type: type,
		fields: [
			'report.Records.FULLTEXT',
			'report.Records.FULLTEXT.autocomplete',
			'report.Records.FULLTEXT.edge_ngram',
			'series.instance.metadata*',
		],
		...(boost && { boost }),
		...(fuzziness && { fuzziness }),
		...(operator && { operator }),
	},
});

const matchPhrase = ({ field, query }) => ({
	match_phrase: { [field]: { query } },
});

const matchTerms = ({ field, query }) => ({
	terms: { [field]: query },
});

const mustNotExist = ({ field }) => ({
	bool: { must_not: { exists: { field } } },
});

const queryString = ({ fields, query }) => ({
	query_string: { fields, query },
});

const range = ({ field, gte, lte }) => ({
	range: { [field]: { gte, lte } },
});

const wildcard = ({ field, query }) => ({
	wildcard: { [field]: { value: query } },
});

/**
 * Constructs the search body for a new search.
 *
 * @param {SearchStudiesQuery} query The search query.
 * @returns {Object} The search body.
 */
export const newSearchBody = (query) => {
	const setIf = (cond, query) => (cond ? [query] : []);

	const fields = [
		'report.Records.FULLTEXT',
		'report.Records.FULLTEXT.autocomplete',
		'report.Records.FULLTEXT.edge_ngram',
		'series.instance.metadata*',
	];

	const genders = query.gender && (Array.isArray(query.gender) ? query.gender : [query.gender]);
	const categories = query.category && (Array.isArray(query.category) ? query.category : [query.category]);

	return {
		query: {
			bool: {
				must: [
					multiMatch({ query: query.search, fields, boost: 1, fuzziness: 1, operator: 'or' }),
					...setIf(query.modality, wildcard({ field: 'series.modality.code', query: query.modality })),
					...setIf(query.patientId, matchPhrase({ field: 'subject.reference', query: `patient/${query.patientId}` })),
					...setIf(query.patientName, queryString({ fields: ['dicomJson.0010010'], query: query.patientName })),
					...setIf(query.fromDate || query.toDate, range({ field: 'started', gte: query.fromDate, lte: query.toDate })),
				],
				should: [
					multiMatch({ query: query.search, fields, type: 'phrase', boost: 3 }),
					multiMatch({ query: query.search, fields, boost: 2, fuzziness: 1, operator: 'and' }),
				],
				filter: [
					// Add gender filters
					...(genders?.reduce((acc, gender) => {
						if (gender === 'UNKNOWN') acc.push(mustNotExist({ field: 'dicomJson.00100040.Value.keyword' }));
						else if (gender) acc.push(matchTerms({ field: 'dicomJson.00100040.Value.keyword', query: gender }));
					}, []) ?? []),
					// Add category filters
					...(categories?.map((category) => ({
						nested: {
							path: 'report.category',
							query: {
								bool: {
									must: [
										{
											match_phrase: {
												'report.category.name': category,
											},
										},
									],
								},
							},
						},
					})) ?? []),
				],
			},
		},
		highlight: {
			pre_tags: ['<span class="highlight">'],
			post_tags: ['</span>'],
			fields: {
				'report.Records.FULLTEXT': {
					number_of_fragments: 2,
					fragment_size: 50,
				},
			},
		},
		aggs: {
			category: {
				nested: {
					path: 'report.category',
				},
				aggs: {
					termAgg: {
						terms: {
							field: 'report.category.name.keyword',
							size: 100,
						},
					},
				},
			},
			gender: {
				terms: {
					field: 'dicomJson.00100040.Value.keyword',
					size: 100,
					missing: 'UNKNOWN',
				},
			},
		},
		from: query.offset ?? 0,
		size: query.limit ?? 10,
	};
};
