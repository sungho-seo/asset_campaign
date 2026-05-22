/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#fafaf9',
        'bg-soft': '#f5f5f4',
        panel: '#ffffff',
        line: '#e7e5e4',
        'line-2': '#d6d3d1',
        text: {
          DEFAULT: '#0c0a09',
          2: '#44403c',
          3: '#78716c',
          4: '#a8a29e',
        },
        accent: '#000000',
        brand: {
          DEFAULT: '#A50034',
          2: '#C8003F',
          dark: '#7A0026',
          soft: '#FCE4EC',
        },
        focus: {
          DEFAULT: '#3b82f6',
          soft: '#dbeafe',
        },
        success: {
          DEFAULT: '#15803d',
          soft: '#dcfce7',
          2: '#16a34a',
        },
        warn: {
          DEFAULT: '#a16207',
          soft: '#fef3c7',
          2: '#ca8a04',
        },
        danger: {
          DEFAULT: '#b91c1c',
          soft: '#fee2e2',
          2: '#dc2626',
        },
        purple: {
          DEFAULT: '#7c3aed',
          soft: '#ede9fe',
        },
      },
      fontFamily: {
        sans: ['Geist', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '8px',
        lg: '12px',
        sm: '6px',
      },
      boxShadow: {
        sm: '0 1px 2px rgba(0,0,0,.04)',
        DEFAULT: '0 1px 3px rgba(0,0,0,.06), 0 1px 2px rgba(0,0,0,.04)',
        lg: '0 20px 40px -12px rgba(0,0,0,.18), 0 8px 16px -8px rgba(0,0,0,.08)',
      },
      letterSpacing: {
        tightish: '-0.01em',
        tighter2: '-0.02em',
      },
    },
  },
  plugins: [],
};
