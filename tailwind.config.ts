import type { Config } from 'tailwindcss'

export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg:       'var(--color-bg)',
        header:   'var(--color-bg-header)',
        footer:   'var(--color-bg-footer)',
        text:     'var(--color-text)',
        body:     'var(--color-text-body)',
        muted:    'var(--color-text-muted)',
        caption:  'var(--color-caption)',
        faint:    'var(--color-caption-faint)',
        accent:   'var(--color-accent)',
        hairline: 'var(--color-hairline)',
        glass:    'var(--color-glass)',
        dot:      'var(--color-dot)',
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
