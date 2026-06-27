import { Fragment } from 'react'
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
  const tagList = tags ?? []

  return (
    <article
      className={cn(
        'group relative overflow-hidden cursor-pointer',
        'border transition-all duration-200 ease-out',
        'hover:-translate-y-[3px] hover:bg-white/[0.04] active:scale-[0.98]',
        className,
      )}
      style={{
        borderColor: 'rgba(255,255,255,0.14)',
        background: 'rgba(255,255,255,0.03)',
      }}
    >
      {/* Stretched link — covers entire card at z-[1] */}
      <Link href={`/post/${slug}`} className="absolute inset-0 z-[1]" aria-label={title} />

      {/* Cover — pointer-events-none: clicks fall through to stretched link */}
      <div
        className="relative overflow-hidden pointer-events-none"
        style={{ height: '188px' }}
      >
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

      {/* Content — z-[2] pointer-events-none; interactive children override to auto */}
      <div
        className="relative z-[2] flex flex-col gap-[9px] pointer-events-none"
        style={{ padding: '18px 18px 22px' }}
      >
        {/* Categories row — pointer-events-auto so they capture clicks */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-[8px] pointer-events-auto">
            {categories.map(cat => (
              <Link
                key={cat.id}
                href={`/search?cat=${cat.slug}`}
                className="chip-link font-nav font-bold text-[11px] tracking-[0.10em] uppercase"
                style={{ color: 'var(--color-accent)' }}
              >
                {cat.name}
              </Link>
            ))}
          </div>
        )}

        {/* Title — not a link; clicks fall through to stretched link */}
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

        {/* Date + tags row — pointer-events-none on wrapper; tag links override to auto */}
        {(date || tagList.length > 0) && (
          <div
            className="font-nav font-medium text-[11px] tracking-[0.06em] uppercase flex flex-wrap items-center gap-[6px]"
            style={{ color: 'var(--color-caption-faint)', marginTop: '3px' }}
          >
            {date && <span>{date}</span>}
            {tagList.map((tag, i) => (
              <Fragment key={tag.id}>
                {(!!date || i > 0) && <span aria-hidden>·</span>}
                <Link
                  href={`/search?tag=${tag.slug}`}
                  className="chip-link pointer-events-auto"
                  style={{ color: 'var(--color-caption-faint)' }}
                >
                  {tag.name}
                </Link>
              </Fragment>
            ))}
          </div>
        )}
      </div>
    </article>
  )
}
