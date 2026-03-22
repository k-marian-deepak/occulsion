import type { Config } from 'tailwindcss'

export default {
  darkMode: ['selector', '[data-theme="dark"]'],
  content: ['./src/**/*.{ts,tsx}', './index.html'],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: 'var(--bg)',
          surface: 'var(--bg2)',
          elevated: 'var(--bg3)',
          deeper: 'var(--bg4)',
        },
        border: {
          DEFAULT: 'var(--border)',
          strong: 'var(--border2)',
        },
        text: {
          DEFAULT: 'var(--text)',
          muted: 'var(--text2)',
          info: 'var(--text3)',
        },
        success: {
          DEFAULT: 'var(--green)',
          bg: 'var(--gbg)',
        },
        danger: {
          DEFAULT: 'var(--red)',
          bg: 'var(--rbg)',
        },
        warning: {
          DEFAULT: 'var(--amber)',
          bg: 'var(--abg)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          glow: 'var(--aglow)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-in': 'slideIn 0.25s ease-out',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideIn: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
} satisfies Config
