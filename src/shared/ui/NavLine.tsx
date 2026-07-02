import Link from 'next/link'
import { cn } from '@/shared/lib/cn'

interface NavItem {
  label: string
  href: string
}

export function NavLine({ items, className }: { items: NavItem[]; className?: string }) {
  return (
    <nav className={cn('flex items-center gap-2', className)}>
      {items.map((item, i) => (
        <span key={item.href} className="flex items-center gap-2">
          {i > 0 && <span className="w-1.5 h-1.5 rounded-full bg-caption" aria-hidden />}
          <Link
            href={item.href}
            className="font-nav font-semibold uppercase tracking-widest text-[11px] text-caption hover:text-text transition-colors"
          >
            {item.label}
          </Link>
        </span>
      ))}
    </nav>
  )
}
