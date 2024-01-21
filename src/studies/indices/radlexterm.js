export default {
	index: 'radlexterm',
	mappings: {
		properties: {
			'Code Meaning': {
				type: 'text',
				fields: {
					keyword: {
						type: 'keyword',
					},
				},
			},
			'Code Value': {
				type: 'keyword',
			},
		},
	},
};
