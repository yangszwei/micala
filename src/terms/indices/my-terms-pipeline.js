export default {
	id: 'my-terms-pipeline',
	description: 'Ingest pipeline for importing terms data from CSV',
	processors: [
		{
			csv: {
				field: 'message',
				target_fields: ['terms', 'temps'],
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
