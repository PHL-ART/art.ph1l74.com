import type { Metadata } from 'next'
import { Manrope, Jost, Montserrat, Lora } from 'next/font/google'
import '@/styles/globals.css'

const manrope = Manrope({
  subsets: ['latin', 'cyrillic'],
  weight: ['700'],
  variable: '--font-display',
})

const jost = Jost({
  subsets: ['latin', 'cyrillic'],
  weight: ['200', '300'],
  variable: '--font-body',
})

const montserrat = Montserrat({
  subsets: ['latin', 'cyrillic'],
  weight: ['600', '700'],
  variable: '--font-nav',
})

const lora = Lora({
  subsets: ['latin', 'cyrillic'],
  style: ['italic'],
  variable: '--font-editorial',
})

export const metadata: Metadata = {
  title: 'PHL·ART',
  description: 'Кураторская медиа-платформа',
  icons: {
    icon: '/logo-white.svg',
    shortcut: '/logo-white.svg',
    apple: '/logo-white.svg',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem('theme')||'dark';document.documentElement.setAttribute('data-theme',t)})()`,
          }}
        />
      </head>
      <body
        className={`${manrope.variable} ${jost.variable} ${montserrat.variable} ${lora.variable}`}
      >
        {children}
      </body>
    </html>
  )
}
