'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/shared/lib/cn'

interface BottomNavProps {
  categories: { id: string; name: string; slug: string }[]
}

export function BottomNav({ categories }: BottomNavProps) {
  const pathname = usePathname()
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-footer border-t border-hairline z-40">
      <ul className="flex items-center justify-around py-2">
        <li>
          <Link href="/" className={cn('flex flex-col items-center gap-0.5 px-3 py-2 min-h-[44px] min-w-[44px] font-nav uppercase tracking-widest text-[9px]', pathname === '/' ? 'text-accent' : 'text-caption')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
            Главная
          </Link>
        </li>
        {categories.slice(0, 3).map(cat => (
          <li key={cat.id}>
            <Link href={`/${cat.slug}`} className={cn('flex flex-col items-center gap-0.5 px-3 py-2 min-h-[44px] min-w-[44px] font-nav uppercase tracking-widest text-[9px]', pathname.startsWith(`/${cat.slug}`) ? 'text-accent' : 'text-caption')}>
              <span className="w-5 h-5" aria-hidden />
              {cat.name}
            </Link>
          </li>
        ))}
        <li>
          <Link href="/search" className={cn('flex flex-col items-center gap-0.5 px-3 py-2 min-h-[44px] min-w-[44px] font-nav uppercase tracking-widest text-[9px]', pathname === '/search' ? 'text-accent' : 'text-caption')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            Поиск
          </Link>
        </li>
      </ul>
    </nav>
  )
}
