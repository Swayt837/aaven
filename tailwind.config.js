/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#FAF6EE',
        ink: '#111111',
        coral: '#EF5A4C',
        sun: '#F7C948',
        pink: '#F0426B',
        // Fonds de carte par mode
        creator: '#FCE7EF',
        bar: '#EFEDE6',
        freelance: '#E8EDFC',
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', '"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        hard: '4px 5px 0 0 #111111',
        'hard-lg': '6px 6px 0 0 #111111',
        'hard-sm': '2px 3px 0 0 #111111',
      },
      borderRadius: {
        brutal: '16px',
      },
      transitionDuration: {
        120: '120ms',
      },
    },
  },
  plugins: [],
}
