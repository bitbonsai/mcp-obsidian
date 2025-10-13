/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#0a0a0a',
        foreground: '#fafafa',
        muted: '#404040',
        'muted-foreground': '#a3a3a3',
        accent: '#7c3aed',
        'accent-2': '#06b6d4',
        card: '#171717',
        border: '#262626',
        success: '#22c55e',
        warning: '#f59e0b',
        error: '#ef4444',
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['JetBrains Mono', 'SF Mono', 'Consolas', 'Liberation Mono', 'Menlo', 'monospace'],
      },
      animation: {
        'fade-in-up': 'fade-in-up 0.6s ease-out forwards',
        'gradient-shift': 'gradient-shift 6s ease infinite',
        'typing': 'typing 3s steps(40, end), blink 0.75s step-end infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        'fade-in-up': {
          from: {
            opacity: '0',
            transform: 'translateY(2rem)',
          },
          to: {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        'gradient-shift': {
          '0%, 100%': {
            'background-position': '0% 50%',
          },
          '50%': {
            'background-position': '100% 50%',
          },
        },
        typing: {
          from: { width: '0' },
          to: { width: '100%' },
        },
        blink: {
          '0%, 50%': { opacity: '1' },
          '51%, 100%': { opacity: '0' },
        },
        glow: {
          '0%, 100%': {
            'box-shadow': '0 0 20px rgba(168, 85, 247, 0.4)',
          },
          '50%': {
            'box-shadow': '0 0 40px rgba(168, 85, 247, 0.6)',
          },
        },
      },
      backgroundSize: {
        '400%': '400% 400%',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}