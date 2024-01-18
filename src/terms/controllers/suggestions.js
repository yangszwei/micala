import { getTermsAutocomplete, getTermsSuggestion } from '../index.js';

/**
 * @param {import('koa').Context} ctx
 * @returns {Promise<void>}
 */
export default async (ctx) => {
	const { search } = ctx.query;

	if (!search) {
		ctx.status = 400;
		ctx.body = { message: 'Missing search query.' };
		return;
	}

	const suggestions = await getTermsSuggestion(ctx.esclient, search);

	const autocompletes = await getTermsAutocomplete(ctx.esclient, suggestions);
	if (autocompletes.length === 0) {
		// Try again with the original search term.
		autocompletes.push(...(await getTermsAutocomplete(ctx.esclient, [search])));
	}

	ctx.body = autocompletes;
};
