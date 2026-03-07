/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        gold:  '#C6A85C',
        goldl: '#E8D5A3',
        dark:  '#0C0910',
        dark2: '#161120',
        dark3: '#1E1628',
        dark4: '#251D2F',
        cream: '#FAF6EE',
        muted: '#8A7A9A',
      },
      fontFamily: {
        display: ['Playfair Display', 'Georgia', 'serif'],
        body:    ['DM Sans', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
