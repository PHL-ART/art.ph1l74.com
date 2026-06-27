import Link from 'next/link'
import Image from 'next/image'
import { getFeaturedPost, getRecentPosts } from '@/entities/post/queries'
import { MediaCard } from '@/shared/ui'
import { getPostUrl } from '@/shared/lib/getPostUrl'
import { formatDate } from '@/shared/lib/formatDate'
import { CARD_GRADIENTS, HERO_GRADIENT } from '@/shared/lib/gradients'

export const revalidate = 60

function extractLead(body: unknown): string | null {
  if (!body || typeof body !== 'object') return null
  const b = body as { blocks?: { type: string; html?: string; isLead?: boolean }[] }
  if (!Array.isArray(b.blocks)) return null
  const lead = b.blocks.find(bl => bl.type === 'text' && bl.isLead)
  return lead?.html ?? b.blocks.find(bl => bl.type === 'text')?.html ?? null
}

export default async function HomePage() {
  const [featured, recent] = await Promise.all([getFeaturedPost(), getRecentPosts(12)])
  const heroExcerpt = featured ? extractLead(featured.body) : null
  const heroLabel = featured
    ? [...featured.categories.map(c => c.name), ...featured.tags.map(t => t.name)].join(' · ')
    : null

  return (
    <div style={{ background: 'var(--color-bg)' }}>

      {featured && (
        <section>
          <Link href={`/post/${featured.slug}`} className="group block" aria-label={featured.title}>
            {/* ── Full-width banner hero ── */}
            <div
              className="relative overflow-hidden"
              style={{ minHeight: 'clamp(420px, 52vh, 580px)' }}
            >
              {/* Cover / gradient background */}
              {featured.coverImageKey ? (
                <Image
                  src={getPostUrl(featured.coverImageKey)}
                  alt={featured.title}
                  fill
                  priority
                  className="object-cover"
                  sizes="100vw"
                />
              ) : (
                <div className="absolute inset-0" style={{ background: HERO_GRADIENT }} />
              )}

              {/* Dark overlay for text legibility */}
              <div
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(to top, rgba(14,10,11,0.92) 50%, rgba(14,10,11,0.25) 100%)',
                }}
              />

              {/* Logo centered */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo-white.svg" alt="PHL·ART" width={42} height={42} className="logo-dark" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo-black.svg" alt="" width={42} height={42} aria-hidden className="logo-light" />
              </div>

              {/* Text at bottom-left */}
              <div
                className="absolute bottom-0 left-0 right-0"
                style={{ padding: '0 44px 36px' }}
              >
                {heroLabel && (
                  <div
                    className="font-nav font-bold text-[12px] tracking-[0.12em] uppercase"
                    style={{ color: 'var(--color-accent)', marginBottom: '14px' }}
                  >
                    {heroLabel}
                  </div>
                )}
                <h1
                  className="font-display font-bold lowercase"
                  style={{
                    fontSize: 'clamp(30px, 3.8vw, 58px)',
                    lineHeight: '1.0',
                    letterSpacing: '-0.015em',
                    color: 'var(--color-text)',
                    margin: '0 0 14px',
                  }}
                >
                  {featured.title}
                </h1>
                {heroExcerpt && (
                  <p
                    className="font-body hidden md:block"
                    style={{
                      fontWeight: 300,
                      fontSize: '17px',
                      lineHeight: '1.65',
                      color: 'rgba(255,255,255,0.7)',
                      marginBottom: '14px',
                      maxWidth: '52ch',
                    }}
                  >
                    {heroExcerpt}
                  </p>
                )}
                {featured.publishedAt && (
                  <div
                    className="font-nav font-medium text-[11px] tracking-[0.06em] uppercase"
                    style={{ color: 'rgba(255,255,255,0.45)' }}
                  >
                    {formatDate(featured.publishedAt)}
                  </div>
                )}
              </div>
            </div>
          </Link>
        </section>
      )}

      {/* ── Recent posts ──────────────────────────────────── */}
      {recent.length > 0 && (
        <section>
          <div
            className="flex items-baseline justify-between px-5 md:px-11"
            style={{ paddingTop: '8px', paddingBottom: '20px' }}
          >
            <h2
              className="font-display font-bold lowercase"
              style={{ margin: '20px 0 0', fontSize: 'clamp(22px, 3vw, 30px)', letterSpacing: '-0.01em', color: 'var(--color-text)' }}
            >
              последние материалы
            </h2>
            <Link
              href="/search"
              className="font-nav font-semibold text-[13px] tracking-[0.06em] uppercase flex-shrink-0"
              style={{ color: 'var(--color-accent)', marginTop: '20px' }}
            >
              все →
            </Link>
          </div>

          {/* Mobile: single col. Desktop: 3-col */}
          <div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 px-5 md:px-11"
            style={{ gap: '16px', paddingBottom: '52px' }}
          >
            {recent.map((post, i) => (
              <MediaCard
                key={post.id}
                title={post.title}
                slug={post.slug}
                coverImageKey={post.coverImageKey}
                publishedAt={post.publishedAt}
                categories={post.categories}
                tags={post.tags}
                placeholderGradient={CARD_GRADIENTS[i % CARD_GRADIENTS.length]}
              />
            ))}
          </div>
        </section>
      )}

      {!featured && recent.length === 0 && (
        <div className="text-center" style={{ padding: '128px 20px' }}>
          <p className="font-nav font-medium text-[13px] tracking-[0.06em] uppercase" style={{ color: 'var(--color-caption)' }}>
            Публикации появятся здесь
          </p>
        </div>
      )}
    </div>
  )
}
