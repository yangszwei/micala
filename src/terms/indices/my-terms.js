export default {
	index: 'my-terms',
	settings: {
		max_ngram_diff: '20',
		max_shingle_diff: '20',
		analysis: {
			filter: {
				stemmer: {
					type: 'stemmer',
					language: 'english',
				},
				autocompleteFilter: {
					max_shingle_size: '20',
					min_shingle_size: '2',
					type: 'shingle',
				},
				stopwords: {
					type: 'stop',
					stopwords: ['_english_'],
				},
			},
			analyzer: {
				myStandard: {
					filter: ['lowercase', 'stopwords'],
					char_filter: ['html_strip'],
					type: 'custom',
					tokenizer: 'standard',
				},
				autocomplete: {
					filter: ['lowercase', 'autocompleteFilter'],
					char_filter: ['html_strip'],
					type: 'custom',
					tokenizer: 'standard',
				},
				nGram: {
					filter: ['lowercase', 'stemmer'],
					tokenizer: 'nGram',
				},
				edgeGram: {
					filter: ['lowercase', 'stemmer'],
					tokenizer: 'edgeGram',
				},
			},
			tokenizer: {
				nGram: {
					token_chars: ['letter', 'digit'],
					min_gram: '3',
					type: 'ngram',
					max_gram: '15',
				},
				edgeGram: {
					token_chars: ['letter', 'digit'],
					min_gram: '2',
					type: 'edge_ngram',
					max_gram: '20',
				},
			},
		},
	},
	mappings: {
		properties: {
			terms: {
				type: 'text',
				fields: {
					autocomplete: {
						type: 'text',
						analyzer: 'autocomplete',
						fielddata: true,
					},
					default: {
						type: 'completion',
						analyzer: 'myStandard',
						preserve_separators: true,
						preserve_position_increments: true,
						max_input_length: 50,
					},
					edge_ngram: {
						type: 'text',
						analyzer: 'edgeGram',
						fielddata: true,
					},
					key: {
						type: 'keyword',
					},
					ngram: {
						type: 'text',
						analyzer: 'nGram',
						fielddata: true,
					},
				},
			},
		},
	},
};
