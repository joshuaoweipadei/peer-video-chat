/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cv: {
          bg:      '#09090c',
          surface: '#0f1017',
          card:    '#141720',
          muted:   '#4a5060',
          text:    '#d8dae8',
          accent:  '#00e5a0',
          blue:    '#00b8ff',
          amber:   '#ffb347',
          danger:  '#ff4757',
          purple:  '#a78bfa',
        },
      },
      fontFamily: {
        mono:    ['"JetBrains Mono"', 'monospace'],
        display: ['"Syne"', 'sans-serif'],
      },
      keyframes: {
        'ping-slow': {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.25' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        fadein: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
      },
      animation: {
        'ping-slow': 'ping-slow 2s ease-in-out infinite',
        'slide-up':  'slide-up 0.3s ease both',
        'fadein':    'fadein 0.4s ease both',
      },
    },
  },
  plugins: [],
}