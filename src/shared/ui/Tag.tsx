import { cn } from '@/shared/lib/cn'

interface TagProps {
  children: React.ReactNode
  href?: string
  className?: string
}

export function Tag({ children, href, className }: TagProps) {
  const base = cn(
    'inline-flex items-center px-2.5 py-0.5 rounded-[4px]',
    'font-nav font-semibold uppercase tracking-widest text-[9px]',
    'text-caption border border-hairline min-h-[22px]',
    className
  )
  if (href) return <a href={href} className={base}>{children}</a>
  return <span className={base}>{children}</span>
}
