import Link from 'next/link'
import Image from 'next/image'
import { getPostUrl } from '@/shared/lib/getPostUrl'
import { cn } from '@/shared/lib/cn'

interface MediaCardProps {
  title: string
  slug: string
  coverImageKey?: string | null
  excerpt?: string | null
  publishedAt: Date | null
  categories: { id: string; name: string; slug: string }[]
  className?: string
}

export function MediaCard({ title, slug, coverImageKey, excerpt, publishedAt, categories, className }: MediaCardProps) {
  // Date formatted short: "24 июня · 6 мин"
  const date = publishedAt
    ? new Intl.DateTimeFormat('ru', { day: 'numeric', month: 'long' }).format(new Date(publishedAt))
    : null

  const categoryLabel = categories.map(c => c.name).join(' · ')

  return (
    <Link
      href={`/post/${slug}`}
      className={cn(
        'group block overflow-hidden',
        'border transition-transform duration-200 ease-out',
        'hover:-translate-y-[3px] active:scale-[0.98]',
        className
      )}
      style={{
        borderColor: 'rgba(255,255,255,0.14)',
        background: 'rgba(255,255,255,0.03)',
      }}
    >
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
          <div
            className="absolute inset-0"
            style={{ background: 'center/cover no-repeat', backgroundImage: "url('/gradient-placeholder.png')" }}
          />
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col gap-[11px]" style={{ padding: '18px 18px 22px' }}>
        {/* Category label */}
        {categoryLabel && (
          <div
            className="font-nav font-bold text-[11px] tracking-[0.10em] uppercase"
            style={{ color: 'var(--color-accent)' }}
          >
            {categoryLabel}
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
    </Link>
  )
}
