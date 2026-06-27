import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { getCategoryBySlug } from '@/entities/category/queries'
import { getPostsByCategory } from '@/entities/post/queries'
import { getPostUrl } from '@/shared/lib/getPostUrl'
import { CARD_GRADIENTS } from '@/shared/lib/gradients'

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
  return lead?.html ?? blocks.find(bl => bl.type === 'text')?.html ?? null
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
              const globalIndex = offset + i + 1
              const isFirst = globalIndex === 1
              const excerpt = extractLead(post.body)
              const tagLabel = [
                ...post.categories.map(c => c.name),
                ...post.tags.map(t => t.name),
              ].filter(n => n !== category.name).join(' · ') || post.categories.map(c => c.name).join(' · ')

              return (
                <Link
                  key={post.id}
                  href={`/post/${post.slug}`}
                  className="group"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '28px',
                    padding: '24px 0',
                    borderBottom: '1px solid var(--color-hairline)',
                    textDecoration: 'none',
                  }}
                >
                  {/* Index number */}
                  <div
                    className="font-nav font-bold flex-shrink-0"
                    style={{
                      width: '48px',
                      fontSize: '22px',
                      letterSpacing: '-0.01em',
                      color: isFirst ? 'var(--color-accent)' : 'var(--color-caption)',
                      textAlign: 'right',
                    }}
                  >
                    {String(globalIndex).padStart(2, '0')}
                  </div>

                  {/* Cover */}
                  <div
                    className="relative flex-shrink-0 overflow-hidden"
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
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {tagLabel && (
                      <div
                        className="font-nav font-bold text-[11px] tracking-[0.10em] uppercase"
                        style={{ color: 'var(--color-accent)', marginBottom: '10px' }}
                      >
                        {tagLabel}
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
                </Link>
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
