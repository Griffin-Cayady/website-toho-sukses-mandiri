import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';

const eslintConfig = [
	{ ignores: ['.next/**', 'out/**', 'node_modules/**'] },
	...nextCoreWebVitals,
	{
		rules: {
			// Images are served from the TSM_DB_Prod upload folder and the site is a static export,
			// so next/image optimization isn't available.
			'@next/next/no-img-element': 'off',
		},
	},
];

export default eslintConfig;
