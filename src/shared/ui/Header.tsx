'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { Logo } from './Logo'
import { ThemeToggle } from './ThemeToggle'

interface Category {
  id: string
  name: string
  slug: string
}

interface HeaderProps {
  categories: Category[]
}

// ── Ссылка на категорию в навигации ──────────────────────────────────────────

interface NavCategoryLinkProps {
  category: Category
  isActive: boolean
  className?: string
  onClick?: () => void
}

function NavCategoryLink({ category, isActive, className, onClick }: NavCategoryLinkProps) {
  return (
    <Link
      href={`/${category.slug}`}
      onClick={onClick}
      className={`font-nav font-semibold text-[13px] tracking-[0.06em] uppercase pb-1 transition-colors ${className ?? ''}`}
      style={{
        color: isActive ? 'var(--color-text)' : 'var(--color-caption)',
        borderBottom: isActive ? '2px solid var(--color-accent)' : '2px solid transparent',
      }}
    >
      {category.name}
    </Link>
  )
}

// ── Иконка бургер-меню ────────────────────────────────────────────────────────

function BurgerIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden>
      <line x1="3" y1="6" x2="19" y2="6" />
      <line x1="3" y1="11" x2="19" y2="11" />
      <line x1="3" y1="16" x2="19" y2="16" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden>
      <line x1="5" y1="5" x2="17" y2="17" />
      <line x1="17" y1="5" x2="5" y2="17" />
    </svg>
  )
}

// ── Шапка сайта ──────────────────────────────────────────────────────────────

export function Header({ categories }: HeaderProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)

  function isActiveCat(slug: string) {
    return pathname === `/${slug}` || pathname.startsWith(`/${slug}/`)
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`)
      setMenuOpen(false)
      setQuery('')
    }
  }

  return (
    <header className="sticky top-0 z-30" style={{ background: 'var(--color-bg-header)' }}>
      <div style={{ maxWidth: '1440px', margin: '0 auto' }}>

        {/* ── Десктоп: одна строка ──────────────────────────────── */}
        <div
          className="hidden md:flex items-center justify-between"
          style={{ padding: '20px 44px' }}
        >
          <Logo size={38} />

          <nav className="flex gap-[30px]">
            {categories.map(cat => (
              <NavCategoryLink
                key={cat.id}
                category={cat}
                isActive={isActiveCat(cat.slug)}
              />
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <form onSubmit={handleSearch} className="flex items-center relative">
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
            <ThemeToggle />
          </div>
        </div>

        {/* ── Мобильная шапка: логотип | бургер | тема ─────────── */}
        <div
          className="md:hidden grid items-center"
          style={{ padding: '14px 20px', gridTemplateColumns: '1fr auto 1fr' }}
        >
          {/* Логотип — левый угол */}
          <Logo size={32} />

          {/* Бургер — по центру */}
          <button
            onClick={() => setMenuOpen(v => !v)}
            aria-label={menuOpen ? 'Закрыть меню' : 'Открыть меню'}
            aria-expanded={menuOpen}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-text)',
              padding: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {menuOpen ? <CloseIcon /> : <BurgerIcon />}
          </button>

          {/* Выбор темы — правый угол */}
          <div className="flex justify-end">
            <ThemeToggle />
          </div>
        </div>

        {/* ── Мобильное выпадающее меню ────────────────────────── */}
        {menuOpen && (
          <div
            className="md:hidden"
            style={{
              borderTop: '1px solid var(--color-hairline)',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
            }}
          >
            {/* Категории */}
            <nav className="flex flex-col gap-5">
              {categories.map(cat => (
                <NavCategoryLink
                  key={cat.id}
                  category={cat}
                  isActive={isActiveCat(cat.slug)}
                  onClick={() => setMenuOpen(false)}
                />
              ))}
            </nav>

            {/* Поиск — в конце списка */}
            <form
              onSubmit={handleSearch}
              className="flex items-center gap-3"
              style={{ borderBottom: '1px solid var(--color-hairline)', paddingBottom: '10px' }}
            >
              <svg
                width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="var(--color-caption)" strokeWidth="1.6" strokeLinecap="round" aria-hidden
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="text"
                placeholder="Поиск"
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="font-nav font-semibold text-[13px] tracking-[0.06em] uppercase bg-transparent border-none outline-none flex-1"
                style={{ color: 'var(--color-caption)' }}
              />
            </form>
          </div>
        )}
      </div>
    </header>
  )
}
