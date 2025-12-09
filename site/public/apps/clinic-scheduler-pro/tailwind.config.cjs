/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './index-animated.html',
    './src/**/*.{js,jsx,ts,tsx}'
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['"DM Sans"', 'Inter', 'system-ui', 'sans-serif'],
        body: ['"Inter"', 'system-ui', 'sans-serif']
      },
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a'
        },
        medical: {
          50: '#e9f9fb',
          100: '#cff2f6',
          200: '#a0e5ee',
          300: '#6fd2e2',
          400: '#3eb8ce',
          500: '#1e9bb4',
          600: '#157992',
          700: '#135f75',
          800: '#124e60',
          900: '#0f3f4e'
        },
        surface: {
          DEFAULT: 'rgba(255,255,255,0.82)',
          muted: 'rgba(255,255,255,0.68)',
          border: 'rgba(148, 163, 184, 0.18)'
        }
      },
      boxShadow: {
        glass: '0 10px 30px rgba(12, 74, 110, 0.18)',
        glassLg: '0 18px 55px rgba(12, 74, 110, 0.25)'
      }
    }
  },
  plugins: [require('@tailwindcss/forms')]
};
