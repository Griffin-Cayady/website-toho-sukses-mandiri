/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ['./src/**/*.{js,jsx}'],
	theme: {
		extend: {
			fontFamily: {
				sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
			},
			colors: {
				// Brand green built around the logo green #009200 (brand-600).
				brand: {
					50: '#eef8ee',
					100: '#d6efd6',
					200: '#ade0ad',
					300: '#74c874',
					400: '#3aab3a',
					500: '#129c12',
					600: '#009200',
					700: '#007a00',
					800: '#0b5f0e',
					900: '#0e4712',
					950: '#072a09',
				},
				// Logo yellow, used sparingly as a highlight.
				sun: {
					DEFAULT: '#FFF101',
					soft: '#FFF9B8',
				},
				// One neutral family, tinted slightly toward the brand green.
				gray: {
					50: '#f7f8f7',
					100: '#eef0ee',
					200: '#dfe3e0',
					300: '#c6ccc8',
					400: '#959e98',
					500: '#6b746e',
					600: '#4e5651',
					700: '#3a413c',
					800: '#252b27',
					900: '#171c19',
					950: '#0d110e',
				},
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))',
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))',
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))',
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))',
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))',
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))',
				},
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)',
			},
			// Shadows tinted with the brand's dark green instead of pure black.
			boxShadow: {
				soft: '0 1px 2px rgb(14 40 18 / 0.06), 0 8px 24px -12px rgb(14 40 18 / 0.18)',
				lift: '0 2px 4px rgb(14 40 18 / 0.06), 0 24px 48px -20px rgb(14 40 18 / 0.30)',
				brand: '0 8px 20px -8px rgb(0 146 0 / 0.55)',
			},
			zIndex: {
				raised: '10',
				dropdown: '30',
				nav: '40',
				banner: '50',
				toast: '60',
				skip: '70',
			},
			transitionTimingFunction: {
				'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
			},
		},
	},
	plugins: [require('tailwindcss-animate')],
};
