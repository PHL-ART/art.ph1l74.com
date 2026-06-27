import Link from 'next/link'
import Image from 'next/image'
import { getPostUrl } from '@/shared/lib/getPostUrl'
import { formatDate } from '@/shared/lib/formatDate'
import { cn } from '@/shared/lib/cn'
import { CARD_GRADIENTS } from '@/shared/lib/gradients'

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
  tags,
  placeholderGradient = CARD_GRADIENTS[0],
  className,
}: MediaCardProps) {
  const date = formatDate(publishedAt)

  return (
    <article
      className={cn(
        'group relative overflow-hidden',
        'border transition-transform duration-200 ease-out',
        'hover:-translate-y-[3px] active:scale-[0.98]',
        className,
      )}
      style={{
        borderColor: 'rgba(255,255,255,0.14)',
        background: 'rgba(255,255,255,0.03)',
      }}
    >
      {/* Full-card stretched link at z-0 */}
      <Link href={`/post/${slug}`} className="absolute inset-0 z-0" aria-label={title} />

      {/* Cover */}
      <div className="relative overflow-hidden" style={{ height: '188px' }}>
        {coverImageKey ? (
          <Image
            src={getPostUrl(coverImageKey)}
            alt={title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0" style={{ background: placeholderGradient }} />
        )}
      </div>

      {/* Content — z-10 so inner links are above the stretched card link */}
      <div className="relative z-10 flex flex-col gap-[9px]" style={{ padding: '18px 18px 22px' }}>
        {/* Categories row */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-[8px]">
            {categories.map(cat => (
              <Link
                key={cat.id}
                href={`/search?cat=${cat.slug}`}
                onClick={e => e.stopPropagation()}
                className="font-nav font-bold text-[11px] tracking-[0.10em] uppercase transition-opacity hover:opacity-70"
                style={{ color: 'var(--color-accent)' }}
              >
                {cat.name}
              </Link>
            ))}
          </div>
        )}

        {/* Tags row */}
        {(tags ?? []).length > 0 && (
          <div className="flex flex-wrap gap-[8px]">
            {(tags ?? []).map(tag => (
              <Link
                key={tag.id}
                href={`/search?tag=${tag.slug}`}
                onClick={e => e.stopPropagation()}
                className="font-nav font-bold text-[11px] tracking-[0.10em] uppercase transition-opacity hover:opacity-70"
                style={{ color: 'var(--color-caption)' }}
              >
                {tag.name}
              </Link>
            ))}
          </div>
        )}

        {/* Title */}
        <h3
          className="font-display font-bold lowercase"
          style={{ fontSize: '22px', lineHeight: '1.08', color: 'var(--color-text)' }}
        >
          {title}
        </h3>

        {/* Excerpt */}
        {excerpt && (
          <p
            className="font-body"
            style={{ fontWeight: 200, fontSize: '15px', lineHeight: '1.5', color: 'rgba(255,255,255,0.6)' }}
          >
            {excerpt}
          </p>
        )}

        {/* Date */}
        {date && (
          <div
            className="font-nav font-medium text-[11px] tracking-[0.06em] uppercase"
            style={{ color: 'var(--color-caption-faint)', marginTop: '3px' }}
          >
            {date}
          </div>
        )}
      </div>
    </article>
  )
}
