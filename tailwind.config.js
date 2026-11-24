/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: 'rgb(var(--c-primary) / <alpha-value>)',
        primarysoft: 'rgb(var(--c-primary-soft) / <alpha-value>)',
        accent: 'rgb(var(--c-accent) / <alpha-value>)',
        ink: 'rgb(var(--c-text) / <alpha-value>)',
        muted: 'rgb(var(--c-muted) / <alpha-value>)',
        line: 'rgb(var(--c-border) / <alpha-value>)',
        surface: 'rgb(var(--c-surface) / <alpha-value>)',
        surface2: 'rgb(var(--c-surface2) / <alpha-value>)',
        appbg: 'rgb(var(--c-bg) / <alpha-value>)',
        hero1: 'rgb(var(--c-hero1) / <alpha-value>)',
        hero2: 'rgb(var(--c-hero2) / <alpha-value>)',
        hero3: 'rgb(var(--c-hero3) / <alpha-value>)',
        gold: 'rgb(var(--c-accent) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['"IBM Plex Sans Arabic"', 'system-ui', 'sans-serif'],
        quran: ['Amiri', 'serif'],
        display: ['Amiri', '"IBM Plex Sans Arabic"', 'serif'],
      },
      boxShadow: {
        soft: '0 1px 2px rgb(0 0 0 / 0.04), 0 10px 30px -18px rgb(0 0 0 / 0.18)',
        lift: '0 2px 4px rgb(0 0 0 / 0.04), 0 18px 40px -24px rgb(0 0 0 / 0.28)',
        insetline: 'inset 0 1px 0 rgb(255 255 255 / 0.08)',
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.97)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        'slide-up': {
          from: { transform: 'translateY(100%)' },
          to: { transform: 'translateY(0)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.55' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.32s cubic-bezier(0.22, 1, 0.36, 1) both',
        'fade-in': 'fade-in 0.2s ease-out both',
        'scale-in': 'scale-in 0.18s cubic-bezier(0.22, 1, 0.36, 1) both',
        'slide-up': 'slide-up 0.28s cubic-bezier(0.22, 1, 0.36, 1) both',
        'pulse-soft': 'pulse-soft 2.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
