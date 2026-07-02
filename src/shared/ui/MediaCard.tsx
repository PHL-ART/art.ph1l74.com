import Link from 'next/link'
import { formatDate } from '@/shared/lib/formatDate'
import { cn } from '@/shared/lib/cn'
import { CARD_GRADIENTS } from '@/shared/lib/gradients'
import { CategoryChips } from './CategoryChips'
import { MetaRow } from './MetaRow'
import { PostThumbnail } from './PostThumbnail'

interface MediaCardProps {
  title: string
  slug: string
  coverImageKey?: string | null
  excerpt?: string | null
  publishedAt: Date | null
  categories: { id: string; name: string; slug: string }[]
  tags?: { id: string; name: string; slug: string }[]
  placeholderGradient?: string
  className?: string
}

export function MediaCard({
  title,
  slug,
  coverImageKey,
  excerpt,
  publishedAt,
  categories,
  tags = [],
  placeholderGradient = CARD_GRADIENTS[0],
  className,
}: MediaCardProps) {
  const date = formatDate(publishedAt)

  return (
    <article
      className={cn(
        'group relative overflow-hidden cursor-pointer',
        'border transition-all duration-200 ease-out',
        'hover:-translate-y-[3px] hover:bg-white/[0.06] hover:shadow-[0_0_32px_rgba(255,255,255,0.10)] hover:border-white/30 active:scale-[0.98]',
        className,
      )}
      style={{
        borderColor: 'rgba(255,255,255,0.14)',
        background: 'rgba(255,255,255,0.03)',
      }}
    >
      {/* Растянутая ссылка покрывает всю карточку на z-[1] */}
      <Link href={`/post/${slug}`} className="absolute inset-0 z-[1]" aria-label={title} />

      {/* Обложка — без перехвата кликов (клик падает на растянутую ссылку) */}
      <PostThumbnail
        coverImageKey={coverImageKey}
        title={title}
        placeholderGradient={placeholderGradient}
        className="pointer-events-none"
        height={188}
      />

      {/* Контентный блок: z-[2], интерактивные дети сами перехватывают клики */}
      <div
        className="relative z-[2] flex flex-col gap-[9px] pointer-events-none"
        style={{ padding: '18px 18px 22px' }}
      >
        <CategoryChips
          categories={categories}
          className="pointer-events-auto"
        />

        {/* Заголовок — не ссылка, клик падает на растянутую ссылку */}
        <h3
          className="font-display font-bold lowercase"
          style={{ fontSize: '22px', lineHeight: '1.08', color: 'var(--color-text)' }}
        >
          {title}
        </h3>

        {excerpt && (
          <p
            className="font-body"
            style={{ fontWeight: 200, fontSize: '15px', lineHeight: '1.5', color: 'rgba(255,255,255,0.6)' }}
          >
            {excerpt}
          </p>
        )}

        <MetaRow
          date={date}
          tags={tags}
          className="mt-[3px]"
        />
      </div>
    </article>
  )
}
