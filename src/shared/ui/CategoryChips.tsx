import Link from 'next/link'

interface ChipItem {
  id: string
  name: string
  slug: string
}

interface CategoryChipsProps {
  /** Список категорий для отображения */
  categories: ChipItem[]
  /** Список тегов для отображения (опционально) */
  tags?: ChipItem[]
  /** Размер шрифта: small — 11px (карточки/строки), large — 12px (герой/шапка поста) */
  size?: 'small' | 'large'
  gap?: string
  className?: string
}

export function CategoryChips({
  categories,
  tags = [],
  size = 'small',
  gap = '3',
  className,
}: CategoryChipsProps) {
  const items = [...categories, ...tags]
  if (items.length === 0) return null

  const fontSize = size === 'large' ? 'text-[12px]' : 'text-[11px]'
  const tracking = size === 'large' ? 'tracking-[0.12em]' : 'tracking-[0.10em]'

  return (
    <div className={`flex flex-wrap gap-${gap} ${className ?? ''}`}>
      {categories.map(cat => (
        <Link
          key={cat.id}
          href={`/search?cat=${cat.slug}`}
          className={`chip-link font-nav font-bold ${fontSize} ${tracking} uppercase`}
          style={{ color: 'var(--color-accent)' }}
        >
          {cat.name}
        </Link>
      ))}
      {tags.map(tag => (
        <Link
          key={tag.id}
          href={`/search?tag=${tag.slug}`}
          className={`chip-link font-nav font-bold ${fontSize} ${tracking} uppercase`}
          style={{ color: 'var(--color-accent)' }}
        >
          {tag.name}
        </Link>
      ))}
    </div>
  )
}
