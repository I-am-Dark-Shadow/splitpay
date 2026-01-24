/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'], // We will add the font in index.html
      },
      colors: {
        slate: {
          850: '#151F32', // Custom depth for dark mode if needed
        }
      }
    },
  },
  plugins: [],
}