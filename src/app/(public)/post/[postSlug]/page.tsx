import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { getPostBySlug } from '@/entities/post/queries'
import { BlockRenderer } from '@/entities/post/ui/BlockRenderer'
import { ReadingProgress, SocialLinks } from '@/shared/ui'
import { getPostUrl } from '@/shared/lib/getPostUrl'
import type { Block, TextBlock } from '@/entities/post/types'

export const revalidate = 300

interface Props {
  params: { postSlug: string }
}

function estimateReadingTime(blocks: Block[]): number {
  const words = blocks
    .filter((b): b is TextBlock => b.type === 'text')
    .reduce((acc, b) => acc + (b.html?.replace(/<[^>]+>/g, '').split(/\s+/).length ?? 0), 0)
  return Math.max(1, Math.round(words / 220))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getPostBySlug(params.postSlug)
  if (!post) return {}
  return {
    title: `${post.title} — PHL·ART`,
    openGraph: {
      title: post.title,
      images: post.coverImageKey ? [getPostUrl(post.coverImageKey)] : [],
    },
  }
}

export default async function PostPage({ params }: Props) {
  const post = await getPostBySlug(params.postSlug)
  if (!post) notFound()

  const readingMinutes = estimateReadingTime(post.body)

  const date = post.publishedAt
    ? (() => {
        const d = new Date(post.publishedAt)
        const dm = new Intl.DateTimeFormat('ru', { day: 'numeric', month: 'long' }).format(d)
        return `${dm} ${d.getFullYear()}`
      })()
    : null

  const metaLine = [
    date,
    `${readingMinutes} мин чтения`,
    'текст и фото — PHL·ART',
  ].filter(Boolean).join(' · ')

  return (
    <>
      <ReadingProgress />

      <article>
        {/* ── Hero with gradient/cover ─────────────────── */}
        <div
          className="relative w-full overflow-hidden"
          style={{ height: 'clamp(280px, 38vh, 460px)' }}
        >
          {post.coverImageKey ? (
            <>
              <Image
                src={getPostUrl(post.coverImageKey)}
                alt={post.title}
                fill
                priority
                className="object-cover"
                sizes="100vw"
              />
              <div
                className="absolute inset-0"
                style={{ background: 'linear-gradient(to bottom, transparent 30%, var(--color-bg) 100%)' }}
              />
            </>
          ) : (
            <div
              className="absolute inset-0"
              style={{
                background: 'radial-gradient(120% 90% at 12% 0%, #ff3b2f 0%, #b8201a 26%, #5c1512 55%, #1c0c0b 100%)',
              }}
            >
              <div
                className="absolute inset-0"
                style={{ background: 'linear-gradient(to bottom, transparent 50%, var(--color-bg) 100%)' }}
              />
            </div>
          )}
        </div>

        {/* ── Post header ─────────────────────────────── */}
        <div
          className="mx-auto"
          style={{ maxWidth: '740px', padding: '0 44px' }}
        >
          <header style={{ marginTop: '-32px', position: 'relative', zIndex: 1 }}>
            {(post.categories.length > 0 || post.tags.length > 0) && (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1" style={{ marginBottom: '16px' }}>
                {post.categories.map(cat => (
                  <Link
                    key={cat.id}
                    href={`/search?cat=${cat.slug}`}
                    className="font-nav font-bold text-[12px] tracking-[0.12em] uppercase transition-opacity hover:opacity-70"
                    style={{ color: 'var(--color-accent)' }}
                  >
                    {cat.name}
                  </Link>
                ))}
                {post.tags.map(tag => (
                  <Link
                    key={tag.id}
                    href={`/search?tag=${tag.slug}`}
                    className="font-nav font-bold text-[12px] tracking-[0.12em] uppercase transition-opacity hover:opacity-70"
                    style={{ color: 'var(--color-caption)' }}
                  >
                    {tag.name}
                  </Link>
                ))}
              </div>
            )}

            <h1
              className="font-display font-bold lowercase"
              style={{
                fontSize: 'clamp(32px, 3.6vw, 54px)',
                lineHeight: '1.0',
                letterSpacing: '-0.015em',
                color: 'var(--color-text)',
                margin: '0 0 20px',
              }}
            >
              {post.title}
            </h1>

            <div
              className="font-nav font-medium text-[12px] tracking-[0.06em] uppercase"
              style={{ color: 'var(--color-caption)', marginBottom: '48px' }}
            >
              {metaLine}
            </div>
          </header>

          {/* ── Body content ──────────────────────────── */}
          <BlockRenderer blocks={post.body} />

          {/* ── Social links ──────────────────────────── */}
          <SocialLinks links={post.socialLinks} />
        </div>
      </article>
    </>
  )
}
