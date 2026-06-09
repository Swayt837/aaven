import tailwindcssAnimate from 'tailwindcss-animate'

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
        lime: '#C8F050', // accent néon (glow / ponctuel)
        // Fonds de carte par mode
        creator: '#FCE7EF',
        bar: '#EFEDE6',
        freelance: '#E8EDFC',
        // Palette de marque (nouvelle landing cinématique)
        brand: {
          cream: '#F7F7F5',
          ink: '#0A0A0A',
          coral: '#FF4D42',
          neon: '#D6FF00',
          muted: '#575756',
          line: '#E2E2E0',
        },
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', '"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        editorial: ['Fraunces', 'Georgia', 'serif'], // italique éditoriale premium
        serif: ['"Playfair Display"', 'Georgia', 'serif'], // accents italiques landing
        sans: ['Manrope', 'Inter', 'system-ui', 'sans-serif'],
      },
      // Système d'élévation DOUX (premium) — l'identité reste portée par les contours encre.
      boxShadow: {
        'hard-sm': '0 2px 8px -3px rgba(17,17,17,.16)',
        hard: '0 8px 24px -8px rgba(17,17,17,.18), 0 2px 6px -2px rgba(17,17,17,.10)',
        'hard-lg': '0 26px 64px -18px rgba(17,17,17,.30), 0 6px 16px -6px rgba(17,17,17,.12)',
        soft: '0 1px 2px rgba(17,17,17,.05), 0 8px 22px -8px rgba(17,17,17,.14)',
        float: '0 20px 52px -16px rgba(17,17,17,.32)',
        'glow-coral': '0 12px 38px -10px rgba(239,90,76,.55)',
        'glow-sun': '0 12px 38px -10px rgba(247,201,72,.5)',
        'glow-pink': '0 12px 38px -10px rgba(240,66,107,.5)',
        inset1: 'inset 0 1px 0 0 rgba(255,255,255,.18)',
        pop: '3px 4px 0 0 #111111', // touche brutaliste, usage ponctuel
      },
      borderRadius: {
        brutal: '14px',
        card: '22px',
        xl2: '28px',
      },
      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.22, 1, 0.36, 1)',
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      transitionDuration: { 120: '120ms', 250: '250ms', 400: '400ms' },
      keyframes: {
        'bb-reveal': {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
      animation: {
        reveal: 'bb-reveal 700ms cubic-bezier(0.22,1,0.36,1) both',
        float: 'float 4s ease-in-out infinite',
      },
    },
  },
  plugins: [tailwindcssAnimate],
}
