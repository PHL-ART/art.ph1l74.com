import { Fragment } from 'react'
import Link from 'next/link'

interface TagItem {
  id: string
  name: string
  slug: string
}

interface MetaRowProps {
  /** Строка даты (уже отформатированная) */
  date?: string | null
  tags?: TagItem[]
  /** Цвет текста, по умолчанию var(--color-caption-faint) */
  color?: string
  className?: string
}

/**
 * Строка метаданных: дата + теги, разделённые точкой «·».
 * Используется в карточках, страницах поста и результатах поиска.
 */
export function MetaRow({
  date,
  tags = [],
  color = 'var(--color-caption-faint)',
  className,
}: MetaRowProps) {
  if (!date && tags.length === 0) return null

  return (
    <div
      className={`flex flex-wrap items-center gap-[6px] font-nav font-medium text-[11px] tracking-[0.06em] uppercase pointer-events-auto ${className ?? ''}`}
      style={{ color }}
    >
      {date && <span>{date}</span>}
      {tags.map((tag, i) => (
        <Fragment key={tag.id}>
          {/* Точка-разделитель перед каждым тегом: после даты или после предыдущего тега */}
          {(!!date || i > 0) && <span aria-hidden>·</span>}
          <Link
            href={`/search?tag=${tag.slug}`}
            className="chip-link"
            style={{ color }}
          >
            {tag.name}
          </Link>
        </Fragment>
      ))}
    </div>
  )
}
