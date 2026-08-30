/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ipl: {
          dark: '#0B0F19',
          card: '#131B2E',
          border: '#1E293B',
          accent: '#00F0FF',
          gold: '#F59E0B',
          orange: '#FF5722',
          purple: '#8B5CF6',
          green: '#10B981',
          red: '#EF4444'
        }
      },
      fontFamily: {
        sans: ['Inter', 'Outfit', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'neon': '0 0 20px -5px rgba(0, 240, 255, 0.4)',
        'neon-gold': '0 0 20px -5px rgba(245, 158, 11, 0.4)',
        'card-glow': '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
      }
    },
  },
  plugins: [],
}
