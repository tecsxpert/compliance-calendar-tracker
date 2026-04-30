/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#e8eef6',
          100: '#c5d5e9',
          200: '#9fb9da',
          300: '#789dcb',
          400: '#5888bf',
          500: '#1B4F8A',
          600: '#174478',
          700: '#123866',
          800: '#0e2d54',
          900: '#0a2142',
        },
      },
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}