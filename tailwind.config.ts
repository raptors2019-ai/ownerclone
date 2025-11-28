import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        pizza: {
          50: '#fdf8f3',
          100: '#fbe8d3',
          200: '#f8d4a8',
          300: '#f4ba70',
          400: '#f09d3d',
          500: '#ed8936',
          600: '#dd6b20',
          700: '#c05621',
          800: '#92400e',
          900: '#78350f',
        },
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)'],
        mono: ['var(--font-geist-mono)'],
      },
    },
  },
  plugins: [],
};

export default config;
