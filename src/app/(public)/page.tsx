import Link from 'next/link'
import Image from 'next/image'
import { getFeaturedPost, getRecentPosts } from '@/entities/post/queries'
import { MediaCard } from '@/shared/ui'
import { getPostUrl } from '@/shared/lib/getPostUrl'
import { formatDate } from '@/shared/lib/formatDate'

export const revalidate = 60

const CARD_GRADIENTS = [
  '/gradient-2.png',
  '/gradient-3.png',
  '/gradient-4.png',
  '/gradient-1.png',
  '/gradient-red.png',
  '/gradient-2.png',
  '/gradient-3.png',
  '/gradient-4.png',
]

function extractLead(body: unknown): string | null {
  if (!body || typeof body !== 'object') return null
  const b = body as { blocks?: { type: string; html?: string; isLead?: boolean }[] }
  if (!Array.isArray(b.blocks)) return null
  const lead = b.blocks.find(bl => bl.type === 'text' && bl.isLead)
  return lead?.html ?? b.blocks.find(bl => bl.type === 'text')?.html ?? null
}

const HERO_GRADIENT = 'radial-gradient(120% 90% at 12% 0%, #ff3b2f 0%, #b8201a 26%, #5c1512 55%, #1c0c0b 100%)'

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

            {/* ── Mobile hero: full-width cover with overlaid text ── */}
            <div className="md:hidden relative overflow-hidden" style={{ minHeight: '480px' }}>
              {/* Cover / gradient */}
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
                style={{ background: 'linear-gradient(to top, rgba(14,10,11,0.92) 45%, rgba(14,10,11,0.2) 100%)' }}
              />
              {/* Text at bottom */}
              <div className="absolute bottom-0 left-0 right-0" style={{ padding: '0 20px 28px' }}>
                {heroLabel && (
                  <div className="font-nav font-bold text-[11px] tracking-[0.12em] uppercase"
                    style={{ color: 'var(--color-accent)', marginBottom: '10px' }}>
                    {heroLabel}
                  </div>
                )}
                <h1
                  className="font-display font-bold lowercase"
                  style={{ fontSize: '30px', lineHeight: '1.05', letterSpacing: '-0.01em', color: 'var(--color-text)', margin: '0 0 12px' }}
                >
                  {featured.title}
                </h1>
                {heroExcerpt && (
                  <p className="font-body" style={{ fontWeight: 300, fontSize: '15px', lineHeight: '1.6', color: 'rgba(255,255,255,0.7)', marginBottom: '12px' }}>
                    {heroExcerpt}
                  </p>
                )}
                {featured.publishedAt && (
                  <div className="font-nav font-medium text-[11px] tracking-[0.06em] uppercase"
                    style={{ color: 'rgba(255,255,255,0.45)' }}>
                    {formatDate(featured.publishedAt)}
                  </div>
                )}
              </div>
            </div>

            {/* ── Desktop hero: 2-column grid ─────────────────────── */}
            <div
              className="hidden md:grid items-center"
              style={{ padding: '56px 44px 52px', gridTemplateColumns: '1fr 1fr', gap: '44px' }}
            >
              {/* Left: editorial text */}
              <div>
                {heroLabel && (
                  <div className="font-nav font-bold text-[12px] tracking-[0.12em] uppercase"
                    style={{ color: 'var(--color-accent)', marginBottom: '22px' }}>
                    {heroLabel}
                  </div>
                )}
                <h1
                  className="font-display font-bold lowercase"
                  style={{ margin: 0, fontSize: 'clamp(40px, 4.2vw, 64px)', lineHeight: '1.0', letterSpacing: '-0.015em', color: 'var(--color-text)' }}
                >
                  {featured.title}
                </h1>
                {heroExcerpt && (
                  <p className="font-body"
                    style={{ marginTop: '22px', fontWeight: 300, fontSize: '17px', lineHeight: '1.65', color: 'var(--color-text-body)', maxWidth: '44ch' }}>
                    {heroExcerpt}
                  </p>
                )}
                {featured.publishedAt && (
                  <div className="font-nav font-medium text-[12px] tracking-[0.07em] uppercase"
                    style={{ marginTop: '26px', color: 'var(--color-caption)' }}>
                    {formatDate(featured.publishedAt)}
                  </div>
                )}
              </div>

              {/* Right: cover */}
              <div
                className="relative overflow-hidden"
                style={{ height: '420px', border: '1px solid rgba(255,255,255,0.14)' }}
              >
                {featured.coverImageKey ? (
                  <Image
                    src={getPostUrl(featured.coverImageKey)}
                    alt={featured.title}
                    fill
                    priority
                    className="object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-300"
                    sizes="50vw"
                  />
                ) : (
                  <div className="absolute inset-0" style={{ background: HERO_GRADIENT }} />
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
