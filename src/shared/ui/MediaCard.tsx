import Link from 'next/link'
import Image from 'next/image'
import { getPostUrl } from '@/shared/lib/getPostUrl'
import { Tag } from './Tag'
import { cn } from '@/shared/lib/cn'

interface MediaCardProps {
  title: string
  slug: string
  coverImageKey?: string | null
  publishedAt: Date | null
  categories: { id: string; name: string; slug: string }[]
  className?: string
}

export function MediaCard({ title, slug, coverImageKey, publishedAt, categories, className }: MediaCardProps) {
  const date = publishedAt
    ? new Intl.DateTimeFormat('ru', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(publishedAt))
    : null

  return (
    <Link href={`/post/${slug}`}
      className={cn(
        'group block relative overflow-hidden rounded-[2px]',
        'border border-hairline bg-glass',
        'transition-transform duration-200 ease-out',
        'hover:-translate-y-[3px] hover:bg-[rgba(255,255,255,0.06)]',
        'active:scale-[0.98]',
        className
      )}
    >
      <div className="aspect-[4/3] relative overflow-hidden bg-glass">
        {coverImageKey ? (
          <Image src={getPostUrl(coverImageKey)} alt={title} fill className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[rgba(255,59,48,0.15)] to-transparent" />
        )}
      </div>
      <div className="p-[18px] flex flex-col gap-2">
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {categories.map(cat => <Tag key={cat.id}>{cat.name}</Tag>)}
          </div>
        )}
        <h3 className="font-display font-bold text-text text-lg leading-tight lowercase tracking-tight">{title}</h3>
        {date && <p className="font-body text-[13px] text-caption">{date}</p>}
      </div>
    </Link>
  )
}
