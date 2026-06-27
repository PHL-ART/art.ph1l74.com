import { Logo } from './Logo'
import { NavLine } from './NavLine'
import { ThemeToggle } from './ThemeToggle'
import Link from 'next/link'

interface HeaderProps {
  categories: { id: string; name: string; slug: string }[]
}

export function Header({ categories }: HeaderProps) {
  const navItems = [
    { label: 'Главная', href: '/' },
    ...categories.map(c => ({ label: c.name, href: `/${c.slug}` })),
  ]
  return (
    <header className="sticky top-0 z-30 bg-bg/90 backdrop-blur-sm border-b border-hairline">
      <div className="max-w-7xl mx-auto px-5 md:px-12 h-16 flex items-center justify-between gap-6">
        <Logo variant="white" size={32} />
        <div className="hidden md:flex flex-1">
          <NavLine items={navItems} />
        </div>
        <div className="flex items-center">
          <Link href="/search" aria-label="Поиск" className="w-11 h-11 flex items-center justify-center text-caption hover:text-text transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
