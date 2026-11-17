/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'] },
      colors: { brand: { DEFAULT: '#06C167', dark: '#049E54', light: '#E6F9EF' } },
      keyframes: {
        'slide-in-right': { from: { transform: 'translateX(100%)' }, to: { transform: 'translateX(0)' } },
        'slide-up': { from: { transform: 'translateY(100%)' }, to: { transform: 'translateY(0)' } },
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'scale-in': { from: { opacity: '0', transform: 'scale(.96)' }, to: { opacity: '1', transform: 'scale(1)' } },
        shimmer: { '100%': { transform: 'translateX(100%)' } },
        'alert-ring': { '0%,100%': { boxShadow: '0 0 0 0 rgba(6,193,103,.55)' }, '50%': { boxShadow: '0 0 0 8px rgba(6,193,103,0)' } },
      },
      animation: {
        'slide-in-right': 'slide-in-right .28s cubic-bezier(.32,.72,0,1)',
        'slide-up': 'slide-up .3s cubic-bezier(.32,.72,0,1)',
        'fade-in': 'fade-in .2s ease-out',
        'scale-in': 'scale-in .2s ease-out',
        'alert-ring': 'alert-ring 1.2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
