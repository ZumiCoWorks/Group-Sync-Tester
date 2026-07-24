import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: 'var(--bg-primary)',
        secondary: 'var(--bg-secondary)',
        muted: 'var(--border-muted)',
        heading: 'var(--text-heading)',
        body: 'var(--text-body)',
        'accent-creative': 'var(--accent-creative)',
        'accent-business': 'var(--accent-business)',
      },
    },
  },
  plugins: [],
};

export default config;
