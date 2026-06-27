import type { Config } from 'tailwindcss'

export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg:       'var(--color-bg)',
        footer:   'var(--color-bg-footer)',
        text:     'var(--color-text)',
        body:     'var(--color-text-body)',
        caption:  'var(--color-caption)',
        accent:   'var(--color-accent)',
        hairline: 'var(--color-hairline)',
        glass:    'var(--color-glass)',
      },
      fontFamily: {
        display:   ['var(--font-display)', 'sans-serif'],
        body:      ['var(--font-body)', 'sans-serif'],
        nav:       ['var(--font-nav)', 'sans-serif'],
        editorial: ['var(--font-editorial)', 'serif'],
      },
    },
  },
  plugins: [],
} satisfies Config
