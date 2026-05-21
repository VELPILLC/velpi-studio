/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#030810',
        panel: '#080f1e',
        panel2: '#0b1525',
        border: '#0e1e35',
        border2: '#152840',
        border3: '#1d3a58',
        blue: '#1d6ff5',
        blue2: '#1458cc',
        blue3: '#5a9aff',
        cyan: '#00c8ff',
        teal: '#00e5c8',
        text: '#c8dcf5',
        text2: '#4a6a8a',
        orange: '#f05a00',
      },
      fontFamily: {
        inter: ['var(--font-inter)', 'sans-serif'],
        mono: ['var(--font-ibm-plex-mono)', 'monospace'],
        bebas: ['var(--font-bebas-neue)', 'cursive'],
        barlow: ['var(--font-barlow-condensed)', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
