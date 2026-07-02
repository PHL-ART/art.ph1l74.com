import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { getCategoryBySlug } from '@/entities/category/queries'
import { getPostsByCategory } from '@/entities/post/queries'
import { getPostUrl } from '@/shared/lib/getPostUrl'
import { CARD_GRADIENTS } from '@/shared/lib/gradients'

const MONTH_EXCEPTIONS = ['март', 'май', 'июнь', 'июль']

function formatPostDate(date: Date | null): { day: string; month: string; year: string } | null {
  if (!date) return null
  const d = new Date(date)
  const day = String(d.getDate())
  const year = String(d.getFullYear())
  const monthFull = new Intl.DateTimeFormat('ru', { month: 'long' }).format(d)
  const month = MONTH_EXCEPTIONS.includes(monthFull) ? monthFull : monthFull.slice(0, 3)
  return { day, month, year }
}

export const revalidate = 60

interface Props {
  params: { categorySlug: string }
  searchParams: { page?: string }
}

function extractLead(body: unknown): string | null {
  if (!body || typeof body !== 'object') return null
  const b = body as { blocks?: { type: string; html?: string; isLead?: boolean }[] }
  const blocks = Array.isArray(b) ? b : (b?.blocks ?? [])
  const lead = blocks.find(bl => bl.type === 'text' && bl.isLead)
  const raw = lead?.html ?? blocks.find(bl => bl.type === 'text')?.html ?? null
  return raw ? raw.replace(/<[^>]+>/g, '') : null
}

export async function generateMetadata({
  params,
}: {
  params: { categorySlug: string }
}): Promise<Metadata> {
  const category = await getCategoryBySlug(params.categorySlug)
  if (!category) return {}

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? ''
  const description = category.description ?? `Материалы раздела «${category.name}»`

  return {
    title: `${category.name} — PHL·ART`,
    description,
    alternates: { canonical: `${siteUrl}/${category.slug}` },
    openGraph: {
      title: `${category.name} — PHL·ART`,
      description,
      url: `${siteUrl}/${category.slug}`,
      siteName: 'PHL·ART',
    },
  }
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const page = Math.max(1, Number(searchParams.page ?? 1))
  const limit = 12
  const category = await getCategoryBySlug(params.categorySlug)
  if (!category) notFound()

  const { posts, total } = await getPostsByCategory(params.categorySlug, { page, limit })
  const totalPages = Math.ceil(total / limit)
  const offset = (page - 1) * limit

  return (
    <div style={{ background: 'var(--color-bg)' }}>

      {/* ── Section heading ──────────────────────────── */}
      <div style={{ padding: '52px 44px 36px' }}>
        <h1
          className="font-display font-bold lowercase"
          style={{
            fontSize: 'clamp(48px, 6vw, 80px)',
            lineHeight: 1,
            letterSpacing: '-0.02em',
            color: 'var(--color-text)',
            margin: 0,
          }}
        >
          {category.name}
        </h1>
      </div>

      {/* ── Indexed post list ────────────────────────── */}
      <div style={{ padding: '0 44px 64px' }}>
        {posts.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {posts.map((post, i) => {
              const excerpt = extractLead(post.body)
              const dateInfo = formatPostDate(post.publishedAt)
              const otherCategories = post.categories.filter(c => c.slug !== params.categorySlug)
              const hasChips = otherCategories.length > 0 || post.tags.length > 0

              return (
                <div
                  key={post.id}
                  className="group relative"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '28px',
                    padding: '24px 0',
                    borderBottom: '1px solid var(--color-hairline)',
                  }}
                >
                  {/* Stretched link — covers entire row at z-[1] */}
                  <Link
                    href={`/post/${post.slug}`}
                    className="absolute inset-0 z-[1]"
                    aria-label={post.title}
                  />

                  {/* Date column */}
                  <div
                    className="flex-shrink-0 text-right relative z-[2] pointer-events-none"
                    style={{ width: '48px' }}
                  >
                    {dateInfo ? (
                      <>
                        <div
                          className="font-nav font-bold"
                          style={{ fontSize: '22px', lineHeight: '1.0', letterSpacing: '-0.01em', color: 'var(--color-text)' }}
                        >
                          {dateInfo.day}
                        </div>
                        <div
                          className="font-nav font-medium uppercase"
                          style={{ fontSize: '10px', letterSpacing: '0.06em', color: 'var(--color-caption)', marginTop: '2px' }}
                        >
                          {dateInfo.month}
                        </div>
                        <div
                          className="font-nav"
                          style={{ fontSize: '10px', letterSpacing: '0.04em', color: 'var(--color-caption)', opacity: 0.45, marginTop: '1px' }}
                        >
                          {dateInfo.year}
                        </div>
                      </>
                    ) : (
                      <div style={{ height: '48px' }} />
                    )}
                  </div>

                  {/* Cover */}
                  <div
                    className="relative flex-shrink-0 overflow-hidden z-[2] pointer-events-none"
                    style={{ width: '270px', height: '150px' }}
                  >
                    {post.coverImageKey ? (
                      <Image
                        src={getPostUrl(post.coverImageKey)}
                        alt={post.title}
                        fill
                        className="object-cover"
                        sizes="270px"
                      />
                    ) : (
                      <div
                        className="absolute inset-0"
                        style={{ background: CARD_GRADIENTS[i % CARD_GRADIENTS.length] }}
                      />
                    )}
                  </div>

                  {/* Text */}
                  <div className="relative z-[2] pointer-events-none" style={{ flex: 1, minWidth: 0 }}>
                    {hasChips && (
                      <div className="flex flex-wrap gap-x-3 gap-y-1 pointer-events-auto" style={{ marginBottom: '10px' }}>
                        {otherCategories.map(cat => (
                          <Link
                            key={cat.id}
                            href={`/search?cat=${cat.slug}`}
                            className="chip-link font-nav font-bold text-[11px] tracking-[0.10em] uppercase"
                            style={{ color: 'var(--color-accent)' }}
                          >
                            {cat.name}
                          </Link>
                        ))}
                        {post.tags.map(tag => (
                          <Link
                            key={tag.id}
                            href={`/search?tag=${tag.slug}`}
                            className="chip-link font-nav font-bold text-[11px] tracking-[0.10em] uppercase"
                            style={{ color: 'var(--color-accent)' }}
                          >
                            {tag.name}
                          </Link>
                        ))}
                      </div>
                    )}
                    <h2
                      className="font-display font-bold lowercase group-hover:opacity-80 transition-opacity"
                      style={{
                        fontSize: '26px',
                        lineHeight: '1.05',
                        letterSpacing: '-0.01em',
                        color: 'var(--color-text)',
                        margin: 0,
                      }}
                    >
                      {post.title}
                    </h2>
                    {excerpt && (
                      <p
                        className="font-body"
                        style={{
                          marginTop: '10px',
                          fontWeight: 300,
                          fontSize: '15px',
                          lineHeight: '1.6',
                          color: 'var(--color-caption)',
                          maxWidth: '60ch',
                          overflow: 'hidden',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                        }}
                      >
                        {excerpt}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <p
            className="font-nav font-medium text-[13px] tracking-[0.06em] uppercase text-center"
            style={{ paddingTop: '80px', color: 'var(--color-caption)' }}
          >
            В этом разделе пока нет материалов
          </p>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <nav className="flex justify-center gap-2 mt-12" aria-label="Страницы">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <Link
                key={p}
                href={`/${params.categorySlug}?page=${p}`}
                className="font-nav text-[11px] uppercase tracking-widest transition-colors"
                style={{
                  width: '44px',
                  height: '44px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: `1px solid ${p === page ? 'var(--color-accent)' : 'var(--color-hairline)'}`,
                  color: p === page ? 'var(--color-accent)' : 'var(--color-caption)',
                }}
                aria-current={p === page ? 'page' : undefined}
              >
                {p}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </div>
  )
}
