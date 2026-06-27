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
  const raw = lead?.html ?? b.blocks.find(bl => bl.type === 'text')?.html ?? null
  return raw ? raw.replace(/<[^>]+>/g, '') : null
}

export default async function HomePage() {
  const [featured, recent] = await Promise.all([getFeaturedPost(), getRecentPosts(12)])
  const heroExcerpt = featured ? extractLead(featured.body) : null

  return (
    <div style={{ background: 'var(--color-bg)' }}>

      {featured && (
        <section>
          {/* ── Full-width banner hero ── */}
          <div
            className="group relative overflow-hidden"
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

            {/* Dark overlay */}
            <div
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(to top, rgba(14,10,11,0.92) 50%, rgba(14,10,11,0.25) 100%)',
              }}
            />

            {/* Stretched link for post navigation */}
            <Link
              href={`/post/${featured.slug}`}
              className="absolute inset-0 z-[1]"
              aria-label={featured.title}
            />

            {/* Logo centered — pointer-events-none */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-white.svg" alt="PHL·ART" width={42} height={42} className="logo-dark" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-black.svg" alt="" width={42} height={42} aria-hidden className="logo-light" />
            </div>

            {/* Text at bottom — pointer-events-none wrapper */}
            <div
              className="absolute bottom-0 left-0 right-0 pointer-events-none z-[2]"
              style={{ padding: '0 44px 36px' }}
            >
              {/* Category/tag chips — pointer-events-auto so they intercept clicks */}
              {(featured.categories.length > 0 || featured.tags.length > 0) && (
                <div
                  className="flex flex-wrap gap-3 pointer-events-auto"
                  style={{ marginBottom: '14px' }}
                >
                  {featured.categories.map(cat => (
                    <Link
                      key={cat.id}
                      href={`/search?cat=${cat.slug}`}
                      className="chip-link font-nav font-bold text-[12px] tracking-[0.12em] uppercase"
                      style={{ color: 'var(--color-accent)' }}
                    >
                      {cat.name}
                    </Link>
                  ))}
                  {featured.tags.map(tag => (
                    <Link
                      key={tag.id}
                      href={`/search?tag=${tag.slug}`}
                      className="chip-link font-nav font-bold text-[12px] tracking-[0.12em] uppercase"
                      style={{ color: 'rgba(255,255,255,0.6)' }}
                    >
                      {tag.name}
                    </Link>
                  ))}
                </div>
              )}

              {/* Title — not a link; clicks fall to stretched link */}
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
