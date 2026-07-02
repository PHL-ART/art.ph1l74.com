import { Fragment } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import DOMPurify from 'isomorphic-dompurify'
import { searchPosts, browsePosts } from '@/shared/lib/search'
import { getPostUrl } from '@/shared/lib/getPostUrl'
import { formatDate } from '@/shared/lib/formatDate'
import { CARD_GRADIENTS } from '@/shared/lib/gradients'

interface Props {
  searchParams: { q?: string; cat?: string; tag?: string }
}

function extractExcerpt(body: unknown): string | null {
  if (!body || typeof body !== 'object') return null
  const b = body as { blocks?: { type: string; html?: string }[] }
  const blocks = Array.isArray(b) ? b : (b?.blocks ?? [])
  return blocks.find(bl => bl.type === 'text')?.html?.replace(/<[^>]+>/g, '') ?? null
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function highlight(text: string, query: string): string {
  const safe = escapeHtml(text)
  if (!query.trim()) return safe
  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const marked = safe.replace(
    new RegExp(`(${escapeHtml(escapedQuery)})`, 'gi'),
    '<mark style="background:none;color:var(--color-accent);font-weight:inherit">$1</mark>',
  )
  return DOMPurify.sanitize(marked, { ALLOWED_TAGS: ['mark'], ALLOWED_ATTR: ['style'] })
}

export default async function SearchPage({ searchParams }: Props) {
  const query = searchParams.q?.trim() ?? ''
  const activeCat = searchParams.cat ?? ''
  const activeTag = searchParams.tag ?? ''

  const isBrowseMode = !query && (activeCat || activeTag)

  // Text search: fetch all, filter by cat locally (so we can show chip counts)
  // Browse mode: fetch by cat/tag directly
  const allResults = query
    ? await searchPosts(query)
    : isBrowseMode
      ? await browsePosts({ cat: activeCat || undefined, tag: activeTag || undefined })
      : []

  // For text search: optionally filter by active category chip
  const results = query && activeCat
    ? allResults.filter(p => p.categories.some(c => c.slug === activeCat))
    : allResults

  // Category counts for filter chips (text search only)
  const catCounts: Record<string, { name: string; slug: string; count: number }> = {}
  if (query) {
    for (const post of allResults) {
      for (const cat of post.categories) {
        if (!catCounts[cat.slug]) catCounts[cat.slug] = { name: cat.name, slug: cat.slug, count: 0 }
        catCounts[cat.slug].count++
      }
    }
  }

  const buildUrl = (cat: string) => {
    const params = new URLSearchParams()
    if (query) params.set('q', query)
    if (cat) params.set('cat', cat)
    return `/search?${params.toString()}`
  }

  // Heading for browse mode
  const browseLabel = isBrowseMode
    ? activeCat
      ? `Категория: ${allResults[0]?.categories.find(c => c.slug === activeCat)?.name ?? activeCat}`
      : `Тег: ${allResults[0]?.tags.find(t => t.slug === activeTag)?.name ?? activeTag}`
    : null

  const hasContent = query || isBrowseMode

  return (
    <div style={{ background: 'var(--color-bg)', padding: '52px 44px 80px', minHeight: '80vh' }}>

      {hasContent ? (
        <>
          <div
            className="font-nav font-bold text-[11px] tracking-[0.14em] uppercase"
            style={{ color: 'var(--color-caption)', marginBottom: '12px' }}
          >
            {isBrowseMode ? browseLabel : 'Результаты поиска'}
          </div>

          {query && (
            <h1
              className="font-display font-bold lowercase"
              style={{
                fontSize: 'clamp(36px, 4vw, 56px)',
                lineHeight: '1.0',
                letterSpacing: '-0.015em',
                color: 'var(--color-text)',
                margin: '0 0 12px',
              }}
            >
              «{query}»
            </h1>
          )}

          <p
            className="font-body"
            style={{ fontWeight: 300, fontSize: '15px', color: 'var(--color-caption)', marginBottom: '28px' }}
          >
            найдено {allResults.length}{' '}
            {allResults.length === 1 ? 'материал' : allResults.length < 5 ? 'материала' : 'материалов'}
          </p>

          {/* Filter chips (text search only) */}
          {query && Object.keys(catCounts).length > 0 && (
            <div className="flex flex-wrap gap-2" style={{ marginBottom: '36px' }}>
              <Link
                href={buildUrl('')}
                className="font-nav font-bold text-[11px] tracking-[0.08em] uppercase transition-colors"
                style={{
                  padding: '6px 14px',
                  border: `1px solid ${!activeCat ? 'var(--color-accent)' : 'var(--color-hairline)'}`,
                  background: !activeCat ? 'var(--color-accent)' : 'transparent',
                  color: !activeCat ? '#fff' : 'var(--color-caption)',
                  borderRadius: '3px',
                }}
              >
                Все · {allResults.length}
              </Link>
              {Object.values(catCounts).map(cat => (
                <Link
                  key={cat.slug}
                  href={buildUrl(cat.slug)}
                  className="font-nav font-bold text-[11px] tracking-[0.08em] uppercase transition-colors"
                  style={{
                    padding: '6px 14px',
                    border: `1px solid ${activeCat === cat.slug ? 'var(--color-accent)' : 'var(--color-hairline)'}`,
                    background: activeCat === cat.slug ? 'var(--color-accent)' : 'transparent',
                    color: activeCat === cat.slug ? '#fff' : 'var(--color-caption)',
                    borderRadius: '3px',
                  }}
                >
                  {cat.name} · {cat.count}
                </Link>
              ))}
            </div>
          )}

          {/* Results list */}
          {results.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {results.map((post, i) => {
                const excerpt = extractExcerpt(post.body)
                const date = formatDate(post.publishedAt)

                return (
                  <div
                    key={post.id}
                    className="group relative"
                    style={{
                      display: 'flex',
                      gap: '28px',
                      padding: '24px 0',
                      borderBottom: '1px solid var(--color-hairline)',
                    }}
                  >
                    {/* Stretched link */}
                    <Link
                      href={`/post/${post.slug}`}
                      className="absolute inset-0 z-[1]"
                      aria-label={post.title}
                    />

                    <div
                      className="relative flex-shrink-0 overflow-hidden z-[2] pointer-events-none"
                      style={{ width: '180px', height: '120px' }}
                    >
                      {post.coverImageKey ? (
                        <Image
                          src={getPostUrl(post.coverImageKey)}
                          alt={post.title}
                          fill
                          className="object-cover"
                          sizes="180px"
                        />
                      ) : (
                        <div
                          className="absolute inset-0"
                          style={{ background: CARD_GRADIENTS[i % CARD_GRADIENTS.length] }}
                        />
                      )}
                    </div>

                    <div className="relative z-[2] pointer-events-none" style={{ flex: 1, minWidth: 0 }}>
                      {/* Categories */}
                      {post.categories.length > 0 && (
                        <div className="flex flex-wrap gap-x-3 gap-y-1 pointer-events-auto" style={{ marginBottom: '6px' }}>
                          {post.categories.map(cat => (
                            <Link
                              key={cat.id}
                              href={`/search?cat=${cat.slug}`}
                              className="chip-link font-nav font-bold text-[11px] tracking-[0.10em] uppercase"
                              style={{ color: 'var(--color-accent)' }}
                            >
                              {cat.name}
                            </Link>
                          ))}
                        </div>
                      )}

                      <h2
                        className="font-display font-bold lowercase group-hover:opacity-80 transition-opacity"
                        style={{
                          fontSize: '22px',
                          lineHeight: '1.05',
                          letterSpacing: '-0.01em',
                          color: 'var(--color-text)',
                          marginBottom: excerpt ? '8px' : '6px',
                        }}
                        dangerouslySetInnerHTML={{ __html: highlight(post.title, query) }}
                      />

                      {excerpt && (
                        <p
                          className="font-body"
                          style={{
                            fontWeight: 300,
                            fontSize: '14px',
                            lineHeight: '1.6',
                            color: 'var(--color-caption)',
                            overflow: 'hidden',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            marginBottom: '6px',
                          }}
                          dangerouslySetInnerHTML={{ __html: highlight(excerpt, query) }}
                        />
                      )}

                      {/* Date + tags row */}
                      {(date || post.tags.length > 0) && (
                        <div
                          className="flex flex-wrap items-center gap-[6px] pointer-events-auto font-nav font-medium text-[11px] tracking-[0.06em] uppercase"
                          style={{ color: 'var(--color-caption-faint)' }}
                        >
                          {date && <span>{date}</span>}
                          {post.tags.map((tag, ti) => (
                            <Fragment key={tag.id}>
                              {(!!date || ti > 0) && <span aria-hidden>·</span>}
                              <Link
                                href={`/search?tag=${tag.slug}`}
                                className="chip-link"
                                style={{ color: 'var(--color-caption-faint)' }}
                              >
                                {tag.name}
                              </Link>
                            </Fragment>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p
              className="font-nav font-medium text-[13px] tracking-[0.06em] uppercase text-center"
              style={{ paddingTop: '60px', color: 'var(--color-caption)' }}
            >
              Ничего не найдено
            </p>
          )}
        </>
      ) : (
        <div style={{ paddingTop: '80px', textAlign: 'center' }}>
          <p
            className="font-nav font-medium text-[13px] tracking-[0.06em] uppercase"
            style={{ color: 'var(--color-caption)' }}
          >
            Введите запрос в строке поиска
          </p>
        </div>
      )}
    </div>
  )
}
