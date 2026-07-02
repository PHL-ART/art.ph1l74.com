import { Fragment } from 'react'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { getPostBySlug } from '@/entities/post/queries'
import { BlockRenderer } from '@/entities/post/ui/BlockRenderer'
import { ReadingProgress, SocialLinks } from '@/shared/ui'
import { getPostUrl } from '@/shared/lib/getPostUrl'
import { ViewCounter } from './ViewCounter'

export const revalidate = 300

interface Props {
  params: { postSlug: string }
}


export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getPostBySlug(params.postSlug)
  if (!post) return {}

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? ''
  const url = `${siteUrl}/post/${post.slug}`

  // Extract lead text for description (strip HTML tags, truncate to 160 chars)
  const lead = (() => {
    const b = post.body as { blocks?: { type: string; html?: string; isLead?: boolean }[] }
    const blocks = Array.isArray(b) ? b : (b?.blocks ?? [])
    const leadBlock = blocks.find(bl => bl.type === 'text' && bl.isLead)
    const firstText = leadBlock ?? blocks.find(bl => bl.type === 'text')
    return firstText?.html?.replace(/<[^>]+>/g, '').slice(0, 160) ?? ''
  })()

  const categoryName = post.categories[0]?.name ?? ''

  // Use cover image if available, otherwise generate branded OG image
  const ogImage = post.coverImageKey
    ? getPostUrl(post.coverImageKey)
    : `${siteUrl}/api/og?title=${encodeURIComponent(post.title)}${
        categoryName ? `&category=${encodeURIComponent(categoryName)}` : ''
      }`

  return {
    title: `${post.title} — PHL·ART`,
    description: lead,
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      title: post.title,
      description: lead,
      url,
      siteName: 'PHL·ART',
      images: [{ url: ogImage, width: 1200, height: 630 }],
      ...(post.publishedAt && { publishedTime: post.publishedAt.toISOString() }),
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: lead,
      images: [ogImage],
    },
  }
}

export default async function PostPage({ params }: Props) {
  const post = await getPostBySlug(params.postSlug)
  if (!post) notFound()

  const date = post.publishedAt
    ? (() => {
        const d = new Date(post.publishedAt)
        const dm = new Intl.DateTimeFormat('ru', { day: 'numeric', month: 'long' }).format(d)
        return `${dm} ${d.getFullYear()}`
      })()
    : null

  return (
    <>
      <ReadingProgress />
      <ViewCounter postSlug={params.postSlug} />

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
            {post.categories.length > 0 && (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1" style={{ marginBottom: '16px' }}>
                {post.categories.map(cat => (
                  <Link
                    key={cat.id}
                    href={`/search?cat=${cat.slug}`}
                    className="chip-link font-nav font-bold text-[12px] tracking-[0.12em] uppercase"
                    style={{ color: 'var(--color-accent)' }}
                  >
                    {cat.name}
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

            {(date || post.tags.length > 0) && (
              <div
                className="flex flex-wrap items-center gap-[6px] font-nav font-medium text-[12px] tracking-[0.06em] uppercase"
                style={{ color: 'var(--color-caption)', marginBottom: '48px' }}
              >
                {date && <span>{date}</span>}
                {post.tags.map((tag, i) => (
                  <Fragment key={tag.id}>
                    {(!!date || i > 0) && <span aria-hidden>·</span>}
                    <Link
                      href={`/search?tag=${tag.slug}`}
                      className="chip-link"
                      style={{ color: 'var(--color-caption)' }}
                    >
                      {tag.name}
                    </Link>
                  </Fragment>
                ))}
              </div>
            )}
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
