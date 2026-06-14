import type { Config } from 'tailwindcss';

// Color tokens are OKLCH channels (L C H) in app/globals.css; wrap with
// oklch(var(--token) / <alpha-value>) so alpha utilities (bg-primary/50) work.
const c = (token: string) => `oklch(var(${token}) / <alpha-value>)`;

const config: Config = {
  darkMode: ['class'],
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: { '2xl': '1400px' },
    },
    extend: {
      colors: {
        border: c('--border'),
        input: c('--input'),
        ring: c('--ring'),
        background: c('--background'),
        foreground: c('--foreground'),
        primary: {
          DEFAULT: c('--primary'),
          foreground: c('--primary-foreground'),
        },
        secondary: {
          DEFAULT: c('--secondary'),
          foreground: c('--secondary-foreground'),
        },
        muted: {
          DEFAULT: c('--muted'),
          foreground: c('--muted-foreground'),
        },
        accent: {
          DEFAULT: c('--accent'),
          foreground: c('--accent-foreground'),
        },
        destructive: {
          DEFAULT: c('--destructive'),
          foreground: c('--destructive-foreground'),
        },
        card: {
          DEFAULT: c('--card'),
          foreground: c('--card-foreground'),
        },
        popover: {
          DEFAULT: c('--popover'),
          foreground: c('--popover-foreground'),
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'var(--font-sans)', 'ui-sans-serif', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        xl: 'calc(var(--radius) + 4px)',
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      boxShadow: {
        card: 'var(--shadow-card)',
        modal: 'var(--shadow-modal)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
