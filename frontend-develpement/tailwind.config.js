export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans:   ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        outfit: ['Outfit', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Green palette (from color reference)
        brand: {
          green:  { 400: '#4ade80', 500: '#22c55e', 600: '#16a34a', 700: '#15803d' },
          blue:   { 400: '#60a5fa', 500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8' },
          orange: { 400: '#fb923c', 500: '#f97316', 600: '#ea580c', 700: '#c2410c' },
        },
      },
      boxShadow: {
        glow:        '0 30px 80px rgba(15, 23, 42, 0.18)',
        'glow-blue': '0 10px 40px rgba(59, 130, 246, 0.25)',
        'glow-green':'0 10px 40px rgba(34, 197, 94, 0.25)',
      },
      animation: {
        'card-in': 'cardEnter 0.5s ease forwards',
      },
      keyframes: {
        cardEnter: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
