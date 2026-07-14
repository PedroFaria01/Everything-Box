const { heroui } = require('@heroui/react')

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/renderer/index.html',
    './src/renderer/src/**/*.{js,ts,jsx,tsx}',
    './node_modules/@heroui/**/dist/**/*.{js,ts,jsx,tsx}'
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        base: {
          950: '#05060b',
          900: '#0a0d16',
          800: '#11141f',
          700: '#181c2a'
        },
        accent: {
          cyan: '#22d3ee',
          purple: '#a855f7',
          blue: '#3b82f6'
        }
      },
      boxShadow: {
        glow: '0 0 20px rgba(56, 189, 248, 0.35)'
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: [heroui()]
}
