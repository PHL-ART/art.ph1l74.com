'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  {
    href: '/admin/dashboard',
    label: 'Дашборд',
    icon: (
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="4" width="18" height="17" rx="2" />
        <line x1="3" y1="9" x2="21" y2="9" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="16" y1="2" x2="16" y2="6" />
      </svg>
    ),
  },
  {
    href: '/admin/post/new',
    label: 'Редактор',
    icon: (
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
      </svg>
    ),
  },
  {
    href: '/admin/media',
    label: 'Медиа',
    icon: (
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <path d="M21 15l-5-5L5 21" />
      </svg>
    ),
  },
  {
    href: '/admin/services',
    label: 'Сервисы',
    icon: (
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
        <circle cx="3.5" cy="6" r="1" /><circle cx="3.5" cy="12" r="1" /><circle cx="3.5" cy="18" r="1" />
      </svg>
    ),
  },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <div
      className="hidden lg:flex flex-col items-center flex-shrink-0 py-6 gap-1.5"
      style={{
        width: 72,
        background: '#0a0708',
        borderRight: '1px solid rgba(255,255,255,0.08)',
        position: 'sticky',
        top: 0,
        height: '100vh',
        overflowY: 'auto',
      }}
    >
      <Image src="/logo-white.svg" alt="PHL·ART" width={34} height={34} style={{ marginBottom: 18 }} />
      {NAV.map(({ href, label, icon }) => {
        const isActive = href === '/admin/post/new'
          ? pathname.startsWith('/admin/post')
          : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            title={label}
            style={{
              width: 44, height: 44,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: 8,
              background: isActive ? 'rgba(255,59,48,0.14)' : 'transparent',
              color: isActive ? '#ff3b30' : 'rgba(255,255,255,0.45)',
              textDecoration: 'none',
            }}
          >
            {icon}
          </Link>
        )
      })}
    </div>
  )
}
