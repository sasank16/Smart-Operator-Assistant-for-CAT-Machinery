/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cat: {
          yellow: '#FFCD11',
          'yellow-light': '#FFE066',
          'yellow-dark': '#E5B800',
          black: '#0D0D0D',
          dark: '#161616',
          darker: '#111111',
          card: '#1F1F1F',
          card2: '#282828',
          border: '#333333',
          borderLight: '#444444',
          gray: '#8C8C8C',
          danger: '#EF4444',
          warning: '#F59E0B',
          success: '#10B981',
          info: '#0EA5E9',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Courier New', 'monospace'],
        display: ['Impact', 'Arial Black', 'sans-serif'],
      },
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'radar-sweep': 'radar 3s linear infinite',
      },
      keyframes: {
        radar: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        }
      }
    },
  },
  plugins: [],
}
