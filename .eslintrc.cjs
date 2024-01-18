/** @type {import('eslint').Linter.FlatConfig} */
module.exports = {
	root: true,
	env: {
		browser: true,
		es2022: true,
		node: true,
	},
	extends: ['eslint:recommended', 'prettier'],
	parserOptions: {
		ecmaVersion: 'latest',
		sourceType: 'module',
	},
	rules: {
		'sort-imports': ['warn', { allowSeparatedGroups: true }],
	},
};
