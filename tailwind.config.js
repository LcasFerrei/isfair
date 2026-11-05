import defaultTheme from 'tailwindcss/defaultTheme';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: '#0B1B3D', 2: '#5B6478', 3: '#A3AAB8' },
        muted: { DEFAULT: '#F2F4F7', 2: '#E6E9EF' },
        line: '#E6E9EF',
        fair: { DEFAULT: '#00C48C', text: '#00875F' },
        tourist: { DEFAULT: '#FFB800', text: '#9A6B00' },
        abusive: { DEFAULT: '#FF4D4D', text: '#D63030' },
      },
      fontFamily: {
        sans: ['Figtree', ...defaultTheme.fontFamily.sans],
      },
      keyframes: {
        // Faixa contínua: o conteúdo vem duplicado, então andar metade da largura volta ao mesmo ponto
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scan: {
          '0%, 100%': { top: '12%' },
          '50%': { top: '72%' },
        },
        'sheet-up': {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        'overlay-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'drawer-in': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%, 60%': { transform: 'translateX(-6px)' },
          '40%, 80%': { transform: 'translateX(6px)' },
        },
        'check-draw': {
          '0%': { strokeDashoffset: '24' },
          '100%': { strokeDashoffset: '0' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.6)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        breathe: {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.85' },
          '50%': { transform: 'scale(1.06)', opacity: '1' },
        },
        'emoji-in': {
          '0%': { opacity: '0', transform: 'translateY(6px) scale(0.85)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'scan-band': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        'drawer-in-rtl': {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
      },
      animation: {
        marquee: 'marquee 60s linear infinite',
        'fade-in': 'fade-in 0.2s ease-out both',
        'sheet-up': 'sheet-up 0.28s cubic-bezier(0.32, 0.72, 0, 1) both',
        'overlay-in': 'overlay-in 0.2s ease-out both',
        'drawer-in': 'drawer-in 0.28s cubic-bezier(0.32, 0.72, 0, 1) both',
        'drawer-in-rtl': 'drawer-in-rtl 0.28s cubic-bezier(0.32, 0.72, 0, 1) both',
        breathe: 'breathe 3.2s ease-in-out infinite',
        float: 'float 5s ease-in-out infinite',
        'float-slow': 'float 7s ease-in-out infinite',
        shake: 'shake 0.4s ease-in-out',
        'check-draw': 'check-draw 0.45s 0.15s ease-out both',
        'scale-in': 'scale-in 0.35s cubic-bezier(0.2, 0.9, 0.3, 1.3) both',
        'emoji-in': 'emoji-in 0.45s cubic-bezier(0.2, 0.8, 0.2, 1) both',
        'scan-band': 'scan-band 1.6s ease-in-out infinite alternate',
        scan: 'scan 1.8s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
