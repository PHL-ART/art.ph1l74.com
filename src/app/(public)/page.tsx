import Image from 'next/image'
import Link from 'next/link'
import { getFeaturedPost, getRecentPosts } from '@/entities/post/queries'
import { MediaCard } from '@/shared/ui'
import { getPostUrl } from '@/shared/lib/getPostUrl'

export const revalidate = 60

export default async function HomePage() {
  const [featured, recent] = await Promise.all([getFeaturedPost(), getRecentPosts(12)])

  return (
    <div style={{ background: 'var(--color-bg)' }}>

      {/* ── Editorial hero — 2-column grid ─────────────── */}
      {featured && (
        <section>
          <Link
            href={`/post/${featured.slug}`}
            className="group block"
            style={{ padding: '52px 44px 48px' }}
          >
            <div
              className="grid items-center"
              style={{ gridTemplateColumns: '1fr 1fr', gap: '44px' }}
            >
              {/* Left: text */}
              <div>
                {/* Category label */}
                {featured.categories.length > 0 && (
                  <div
                    className="font-nav font-bold text-[12px] tracking-[0.12em] uppercase"
                    style={{ color: 'var(--color-accent)', marginBottom: '20px' }}
                  >
                    {featured.categories.map(c => c.name).join(' · ')}
                  </div>
                )}

                {/* Title */}
                <h1
                  className="font-display font-bold lowercase"
                  style={{
                    margin: 0,
                    fontSize: '52px',
                    lineHeight: '1.0',
                    letterSpacing: '-0.015em',
                    color: 'var(--color-text)',
                  }}
                >
                  {featured.title}
                </h1>

                {/* Date */}
                {featured.publishedAt && (
                  <div
                    className="font-nav font-medium text-[12px] tracking-[0.07em] uppercase"
                    style={{ marginTop: '26px', color: 'rgba(255,255,255,0.5)' }}
                  >
                    {new Intl.DateTimeFormat('ru', { day: 'numeric', month: 'long', year: 'numeric' }).format(
                      new Date(featured.publishedAt)
                    )}
                  </div>
                )}
              </div>

              {/* Right: cover image */}
              <div
                className="relative overflow-hidden"
                style={{
                  height: '404px',
                  border: '1px solid rgba(255,255,255,0.14)',
                  background: 'center/cover no-repeat',
                }}
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
                  <div className="absolute inset-0" style={{ background: 'var(--grad-red, radial-gradient(120% 90% at 12% 0%, #ff3b2f 0%, #b8201a 26%, #5c1512 55%, #1c0c0b 100%))' }} />
                )}
              </div>
            </div>
          </Link>
        </section>
      )}

      {/* ── Recent posts grid ──────────────────────────── */}
      {recent.length > 0 && (
        <section>
          {/* Section header */}
          <div
            className="flex items-baseline justify-between"
            style={{ padding: '8px 44px 24px' }}
          >
            <h2
              className="font-display font-bold"
              style={{ margin: '24px 0 0', fontSize: '30px', letterSpacing: '0.01em', color: 'var(--color-text)' }}
            >
              последние материалы
            </h2>
            <Link
              href="/search"
              className="font-nav font-semibold text-[13px] tracking-[0.06em] uppercase"
              style={{ color: 'var(--color-accent)' }}
            >
              все →
            </Link>
          </div>

          {/* Cards */}
          <div
            className="grid"
            style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '22px', padding: '0 44px 52px' }}
          >
            {recent.map(post => (
              <MediaCard
                key={post.id}
                title={post.title}
                slug={post.slug}
                coverImageKey={post.coverImageKey}
                publishedAt={post.publishedAt}
                categories={post.categories}
              />
            ))}
          </div>
        </section>
      )}

      {/* ── Empty state ────────────────────────────────── */}
      {!featured && recent.length === 0 && (
        <div className="text-center" style={{ padding: '128px 44px' }}>
          <p
            className="font-nav font-medium text-[13px] tracking-[0.06em] uppercase"
            style={{ color: 'var(--color-caption)' }}
          >
            Публикации появятся здесь
          </p>
        </div>
      )}

    </div>
  )
}
