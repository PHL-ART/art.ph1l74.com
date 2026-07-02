import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Image from 'next/image'
import { getPostBySlug } from '@/entities/post/queries'
import { BlockRenderer } from '@/entities/post/ui/BlockRenderer'
import { ReadingProgress, SocialLinks } from '@/shared/ui'
import { getPostUrl } from '@/shared/lib/getPostUrl'
import { extractLead } from '@/shared/lib/extractLead'
import { CategoryChips } from '@/shared/ui/CategoryChips'
import { MetaRow } from '@/shared/ui/MetaRow'
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
  const description = extractLead(post.body)?.slice(0, 160) ?? ''
  const categoryName = post.categories[0]?.name ?? ''

  // Если есть обложка — используем её, иначе генерируем OG-изображение с текстом
  const ogImage = post.coverImageKey
    ? getPostUrl(post.coverImageKey)
    : `${siteUrl}/api/og?title=${encodeURIComponent(post.title)}${
        categoryName ? `&category=${encodeURIComponent(categoryName)}` : ''
      }`

  return {
    title: `${post.title} — PHL·ART`,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      title: post.title,
      description,
      url,
      siteName: 'PHL·ART',
      images: [{ url: ogImage, width: 1200, height: 630 }],
      ...(post.publishedAt && { publishedTime: post.publishedAt.toISOString() }),
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description,
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
        {/* ── Герой с обложкой или радиальным градиентом ───────────── */}
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

        {/* ── Шапка поста ─────────────────────────────────────────── */}
        <div className="mx-auto" style={{ maxWidth: '740px', padding: '0 44px' }}>
          <header style={{ marginTop: '-32px', position: 'relative', zIndex: 1 }}>
            <CategoryChips
              categories={post.categories}
              size="large"
              className="mb-[16px]"
            />

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

            <MetaRow
              date={date}
              tags={post.tags}
              color="var(--color-caption)"
              className="mb-[48px] text-[12px]"
            />
          </header>

          {/* ── Тело поста ────────────────────────────────────────── */}
          <BlockRenderer blocks={post.body} />

          {/* ── Социальные ссылки ─────────────────────────────────── */}
          <SocialLinks links={post.socialLinks} />
        </div>
      </article>
    </>
  )
}
