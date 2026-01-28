/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'noble-white': {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
        },
        'pitch-black': {
          50: '#0a0a0a',
          100: '#141414',
          200: '#1a1a1a',
          300: '#202020',
          400: '#262626',
          500: '#2d2d2d',
          600: '#333333',
          700: '#3a3a3a',
          800: '#404040',
          900: '#474747',
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
  darkMode: 'class',
}
