import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#0f0f23',
          secondary: '#1a1a3e',
          card: '#1e1e42',
          cell: '#2a2a5a',
          'cell-hover': '#3a3a7a',
        },
        accent: {
          DEFAULT: '#6c5ce7',
          hover: '#7c6cf7',
          light: '#a29bfe',
        },
        text: {
          primary: '#ffffff',
          secondary: '#b2b2d8',
          muted: '#6c6c9e',
        },
        success: '#00b894',
        error: '#e74c3c',
        warning: '#fdcb6e',
        border: '#3a3a6a',
      },
      borderRadius: {
        card: '12px',
        cell: '8px',
      },
    },
  },
  plugins: [],
};
export default config;
