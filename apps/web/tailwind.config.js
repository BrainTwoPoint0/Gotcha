/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-dm-sans)', 'system-ui', '-apple-system', 'sans-serif'],
        carter: ['var(--font-carter)', 'cursive'],
        // Editorial surface stack
        display: ['var(--font-fraunces)', 'Georgia', 'serif'],
        editorial: ['var(--font-inter)', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['var(--font-jetbrains-mono)', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      borderRadius: {
        // Editorial spec: sm=4 / md=8 / lg=12. `--radius` base is 0.5rem (8px).
        lg: 'calc(var(--radius) + 4px)',
        md: 'var(--radius)',
        sm: 'calc(var(--radius) - 4px)',
      },
      spacing: {
        // Editorial 4pt scale — favour 32 (8) and 48 (12). Breathing room is the product.
        editorial: '32px',
        'editorial-lg': '48px',
        'editorial-xl': '80px',
      },
      transitionTimingFunction: {
        'page-turn': 'cubic-bezier(0.2, 0, 0, 1)',
      },
      transitionDuration: {
        240: '240ms',
      },
      keyframes: {
        spotlight: {
          '0%': {
            opacity: '0',
            transform: 'translate(-72%, -62%) scale(0.5)',
          },
          '100%': {
            opacity: '1',
            transform: 'translate(-50%, -40%) scale(1)',
          },
        },
      },
      animation: {
        spotlight: 'spotlight 2s ease .75s 1 forwards',
      },
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          1: 'hsl(var(--chart-1))',
          2: 'hsl(var(--chart-2))',
          3: 'hsl(var(--chart-3))',
          4: 'hsl(var(--chart-4))',
          5: 'hsl(var(--chart-5))',
        },
        // Editorial palette — scoped under `editorial.*` to avoid clashing with shadcn's `accent`.
        // Usage: bg-editorial-paper, text-editorial-ink, border-editorial-neutral-2, etc.
        'editorial-ink': 'rgb(var(--editorial-ink) / <alpha-value>)',
        'editorial-paper': 'rgb(var(--editorial-paper) / <alpha-value>)',
        'editorial-accent': 'rgb(var(--editorial-accent) / <alpha-value>)',
        'editorial-neutral-2': 'rgb(var(--editorial-neutral-2) / <alpha-value>)',
        'editorial-neutral-3': 'rgb(var(--editorial-neutral-3) / <alpha-value>)',
        'editorial-success': 'rgb(var(--editorial-success) / <alpha-value>)',
        'editorial-alert': 'rgb(var(--editorial-alert) / <alpha-value>)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
