import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx,mdx}',
    './components/**/*.{ts,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#FFF1F4',
          100: '#FFE4EA',
          200: '#FFC9D5',
          300: '#FF9EB1',
          400: '#FF6384',
          500: '#ED3B5B',
          600: '#CC1E41',
          700: '#A81533',
          800: '#86142C',
          900: '#6D1427',
        },
        emerald: {
          50: '#EEFBF5',
          100: '#D7F5E6',
          500: '#10B981',
          600: '#059669',
          700: '#047857',
        },
        amber: {
          500: '#F59E0B',
          600: '#D97706',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(16,24,40,.04), 0 1px 3px rgba(16,24,40,.06)',
        hover: '0 10px 30px -10px rgba(237,59,91,0.25)',
      },
    },
  },
  plugins: [],
};

export default config;
