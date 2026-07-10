import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/features/**/*.{js,ts,jsx,tsx,mdx}',
    './src/shared/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#0b1326',
        'surface-container-lowest': '#060e20',
        'surface-container-low': '#131b2e',
        'surface-container': '#171f33',
        'surface-container-high': '#222a3d',
        'surface-container-highest': '#2d3449',
        'surface-bright': '#31394d',
        'on-surface': '#dae2fd',
        'on-surface-variant': '#c4c7c9',
        outline: '#8e9193',
        'outline-variant': '#444749',
        primary: '#ffffff',
        secondary: '#4edea3',
        'secondary-fixed-dim': '#4edea3',
        'on-secondary': '#003824',
        error: '#ffb4ab',
        'error-container': '#93000a',
        'on-error-container': '#ffdad6',
      },
      fontFamily: {
        display: ['Inter', 'sans-serif'],
        headline: ['Inter', 'sans-serif'],
        'body-sm': ['Inter', 'sans-serif'],
        'mono-data': ['JetBrains Mono', 'monospace'],
        'mono-label': ['JetBrains Mono', 'monospace'],
        'code-block': ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '0.25rem',
        lg: '0.5rem',
        xl: '0.75rem',
        full: '9999px',
      },
    },
  },
  plugins: [],
};

export default config;
