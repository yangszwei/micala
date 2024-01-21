export default {
	id: 'radlexterm-pipeline',
	description: 'Ingest pipeline for importing radlex data',
	processors: [
		{
			csv: {
				field: 'message',
				target_fields: ['Code Value', 'Code Meaning'],
				ignore_missing: false,
			},
		},
		{
			remove: {
				field: 'message',
			},
		},
	],
};
