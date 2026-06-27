'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { Logo } from './Logo'
import { ThemeToggle } from './ThemeToggle'

interface HeaderProps {
  categories: { id: string; name: string; slug: string }[]
}

export function Header({ categories }: HeaderProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [query, setQuery] = useState('')

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (query.trim()) router.push(`/search?q=${encodeURIComponent(query.trim())}`)
  }

  return (
    <header className="sticky top-0 z-30 bg-header border-b border-hairline">
      <div
        className="flex items-center justify-between"
        style={{ padding: '22px 44px' }}
      >
        {/* Logo — white on dark, black on light via variant */}
        <Logo size={40} />

        {/* Nav — desktop */}
        <nav className="hidden md:flex gap-[30px]">
          {categories.map(cat => {
            const isActive = pathname === `/${cat.slug}` || pathname.startsWith(`/${cat.slug}/`)
            return (
              <Link
                key={cat.id}
                href={`/${cat.slug}`}
                className="font-nav font-semibold text-[13px] tracking-[0.06em] uppercase pb-1 transition-colors"
                style={{
                  color: isActive ? 'var(--color-text)' : 'var(--color-caption)',
                  borderBottom: isActive ? '2px solid var(--color-accent)' : '2px solid transparent',
                }}
              >
                {cat.name}
              </Link>
            )
          })}
        </nav>

        {/* Right: inline search + theme toggle */}
        <div className="flex items-center gap-[14px]">
          {/* Inline search input — desktop */}
          <form onSubmit={handleSearch} className="hidden md:flex items-center relative">
            <svg
              width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="var(--color-caption)" strokeWidth="2" strokeLinecap="round"
              className="absolute left-0 pointer-events-none" aria-hidden
            >
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="поиск"
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="font-nav font-semibold text-[13px] tracking-[0.06em] uppercase bg-transparent border-none outline-none w-24"
              style={{ color: 'var(--color-caption)', paddingLeft: '22px' }}
            />
          </form>

          {/* Search icon — mobile only */}
          <Link
            href="/search"
            aria-label="Поиск"
            className="md:hidden w-11 h-11 flex items-center justify-center"
            style={{ color: 'var(--color-caption)' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden>
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
          </Link>

          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
