import type { Config } from 'tailwindcss';
import daisyui from 'daisyui';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  plugins: [daisyui],
  daisyui: {
    themes: [
      'dim',
      {
        groundtruth: {
          // Dark base — Grafana-style dashboard
          'base-100': 'oklch(20% 0.02 240)',
          'base-200': 'oklch(17% 0.02 240)',
          'base-300': 'oklch(14% 0.02 240)',
          'base-content': 'oklch(88% 0.02 240)',

          // Primary: jungle green — agricultural identity
          primary: 'oklch(65% 0.18 145)',
          'primary-content': 'oklch(98% 0.01 145)',

          // Secondary: blue-green — CO₂ / charts
          secondary: 'oklch(55% 0.14 200)',
          'secondary-content': 'oklch(98% 0.01 200)',

          // Accent: amber — EUDR warnings
          accent: 'oklch(75% 0.20 95)',
          'accent-content': 'oklch(15% 0.02 95)',

          // System colors
          neutral: 'oklch(25% 0.02 240)',
          info: 'oklch(70% 0.18 200)',
          success: 'oklch(65% 0.18 145)',
          warning: 'oklch(75% 0.20 95)',
          error: 'oklch(60% 0.22 25)',
        },
      },
    ],
    darkTheme: 'groundtruth',
    logs: false,
  },
} satisfies Config;
