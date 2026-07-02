import { cn } from '@/shared/lib/cn'

export function SectionTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <h2 className={cn('font-display font-bold text-text lowercase tracking-tight text-2xl md:text-3xl', className)}>
      {children}
    </h2>
  )
}
