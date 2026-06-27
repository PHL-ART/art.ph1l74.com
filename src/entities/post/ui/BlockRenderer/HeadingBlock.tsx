import { cn } from '@/shared/lib/cn'

export function HeadingBlock({ level, text }: { level: 2 | 3; text: string }) {
  const Tag = `h${level}` as 'h2' | 'h3'
  return (
    <Tag
      className={cn(
        'font-display font-bold text-text lowercase tracking-tight',
        level === 2 ? 'text-2xl md:text-3xl' : 'text-xl md:text-2xl'
      )}
    >
      {text}
    </Tag>
  )
}
