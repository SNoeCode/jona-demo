/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './client/src/**/*.{js,ts,jsx,tsx,mdx}', // Add this if needed
  ],
  darkMode: 'class',
  theme: {
    extend: {},
  },
  plugins: [],
}