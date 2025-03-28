import defaultTheme from 'tailwindcss/defaultTheme'

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        mono: ['JetBrains Mono', ...defaultTheme.fontFamily.sans],
      },
      typography: theme => ({
        DEFAULT: {
          css: {},
        },
        dark: {
          css: {
            'color': theme('colors.gray.300'),
            '[class~="lead"]': {
              color: theme('colors.gray.400'),
            },
            'a': {
              color: theme('colors.blue.400'),
            },
            'strong': {
              color: theme('colors.gray.100'),
            },
            'ol > li::before': {
              color: theme('colors.gray.400'),
            },
            'ul > li::before': {
              backgroundColor: theme('colors.gray.600'),
            },
            'hr': {
              borderColor: theme('colors.gray.700'),
            },
            'blockquote': {
              color: theme('colors.gray.400'),
              borderLeftColor: theme('colors.gray.700'),
            },
            'h1': {
              color: theme('colors.gray.100'),
            },
            'h2': {
              color: theme('colors.gray.100'),
            },
            'h3': {
              color: theme('colors.gray.100'),
            },
            'h4': {
              color: theme('colors.gray.100'),
            },
            'figure figcaption': {
              color: theme('colors.gray.400'),
            },
            'code': {
              color: theme('colors.gray.100'),
              backgroundColor: theme('colors.gray.800'),
            },
            'a code': {
              color: theme('colors.blue.400'),
            },
            'pre': {
              color: theme('colors.gray.200'),
              backgroundColor: theme('colors.gray.800'),
            },
            'thead': {
              color: theme('colors.gray.100'),
              borderBottomColor: theme('colors.gray.600'),
            },
            'tbody tr': {
              borderBottomColor: theme('colors.gray.700'),
            },
          },
        },
      }),
    },
  },
  plugins: [require('@tailwindcss/typography')],
}
