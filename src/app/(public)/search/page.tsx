import Link from 'next/link'
import DOMPurify from 'isomorphic-dompurify'
import { searchPosts, browsePosts } from '@/shared/lib/search'
import { formatDate } from '@/shared/lib/formatDate'
import { extractLead } from '@/shared/lib/extractLead'
import { CategoryChips } from '@/shared/ui/CategoryChips'
import { MetaRow } from '@/shared/ui/MetaRow'
import { PostThumbnail } from '@/shared/ui/PostThumbnail'

interface Props {
  searchParams: { q?: string; cat?: string; tag?: string }
}

// ── Утилиты подсветки ────────────────────────────────────────────────────────

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

/**
 * Оборачивает все вхождения query в <mark> для визуальной подсветки.
 * Использует DOMPurify для защиты от XSS.
 */
function highlightQuery(text: string, query: string): string {
  const safeText = escapeHtml(text)
  if (!query.trim()) return safeText

  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const marked = safeText.replace(
    new RegExp(`(${escapeHtml(escapedQuery)})`, 'gi'),
    '<mark style="background:none;color:var(--color-accent);font-weight:inherit">$1</mark>',
  )
  return DOMPurify.sanitize(marked, { ALLOWED_TAGS: ['mark'], ALLOWED_ATTR: ['style'] })
}

// ── Чип фильтра по категории ─────────────────────────────────────────────────

interface FilterChipProps {
  label: string
  href: string
  isActive: boolean
}

function FilterChip({ label, href, isActive }: FilterChipProps) {
  return (
    <Link
      href={href}
      className="font-nav font-bold text-[11px] tracking-[0.08em] uppercase transition-colors"
      style={{
        padding: '6px 14px',
        border: `1px solid ${isActive ? 'var(--color-accent)' : 'var(--color-hairline)'}`,
        background: isActive ? 'var(--color-accent)' : 'transparent',
        color: isActive ? '#fff' : 'var(--color-caption)',
        borderRadius: '3px',
      }}
    >
      {label}
    </Link>
  )
}

// ── Строка одного результата поиска ──────────────────────────────────────────

interface SearchPost {
  id: string
  slug: string
  title: string
  coverImageKey?: string | null
  publishedAt: Date | null
  body: unknown
  categories: { id: string; name: string; slug: string }[]
  tags: { id: string; name: string; slug: string }[]
}

interface SearchResultRowProps {
  post: SearchPost
  index: number
  query: string
}

function SearchResultRow({ post, index, query }: SearchResultRowProps) {
  const excerpt = extractLead(post.body)
  const date = formatDate(post.publishedAt)

  return (
    <div
      className="group relative"
      style={{
        display: 'flex',
        gap: '28px',
        padding: '24px 0',
        borderBottom: '1px solid var(--color-hairline)',
      }}
    >
      {/* Растянутая ссылка покрывает всю строку */}
      <Link
        href={`/post/${post.slug}`}
        className="absolute inset-0 z-[1]"
        aria-label={post.title}
      />

      {/* Миниатюра */}
      <PostThumbnail
        coverImageKey={post.coverImageKey}
        title={post.title}
        index={index}
        className="flex-shrink-0 z-[2] pointer-events-none"
        width={180}
        height={120}
        sizes="180px"
      />

      {/* Текстовый блок */}
      <div className="relative z-[2] pointer-events-none" style={{ flex: 1, minWidth: 0 }}>
        {post.categories.length > 0 && (
          <CategoryChips
            categories={post.categories}
            className="pointer-events-auto mb-[6px]"
          />
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
          dangerouslySetInnerHTML={{ __html: highlightQuery(post.title, query) }}
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
            dangerouslySetInnerHTML={{ __html: highlightQuery(excerpt, query) }}
          />
        )}

        <MetaRow
          date={date}
          tags={post.tags}
          className="pointer-events-auto"
        />
      </div>
    </div>
  )
}

// ── Страница поиска ───────────────────────────────────────────────────────────

export default async function SearchPage({ searchParams }: Props) {
  const query = searchParams.q?.trim() ?? ''
  const activeCat = searchParams.cat ?? ''
  const activeTag = searchParams.tag ?? ''

  const isBrowseMode = !query && (activeCat || activeTag)

  // При текстовом поиске загружаем все результаты, чтобы посчитать кол-во по категориям
  // В режиме просмотра — сразу фильтруем на сервере
  const allResults = query
    ? await searchPosts(query)
    : isBrowseMode
      ? await browsePosts({ cat: activeCat || undefined, tag: activeTag || undefined })
      : []

  // При текстовом поиске — дополнительно фильтруем по выбранному чипу категории
  const results = query && activeCat
    ? allResults.filter(p => p.categories.some(c => c.slug === activeCat))
    : allResults

  // Считаем количество постов по каждой категории (только в режиме текстового поиска)
  const catCounts: Record<string, { name: string; slug: string; count: number }> = {}
  if (query) {
    for (const post of allResults) {
      for (const cat of post.categories) {
        catCounts[cat.slug] ??= { name: cat.name, slug: cat.slug, count: 0 }
        catCounts[cat.slug].count++
      }
    }
  }

  function buildFilterUrl(cat: string) {
    const params = new URLSearchParams()
    if (query) params.set('q', query)
    if (cat) params.set('cat', cat)
    return `/search?${params.toString()}`
  }

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

          {/* Чипы-фильтры по категориям (только при текстовом поиске) */}
          {query && Object.keys(catCounts).length > 0 && (
            <div className="flex flex-wrap gap-2" style={{ marginBottom: '36px' }}>
              <FilterChip
                label={`Все · ${allResults.length}`}
                href={buildFilterUrl('')}
                isActive={!activeCat}
              />
              {Object.values(catCounts).map(cat => (
                <FilterChip
                  key={cat.slug}
                  label={`${cat.name} · ${cat.count}`}
                  href={buildFilterUrl(cat.slug)}
                  isActive={activeCat === cat.slug}
                />
              ))}
            </div>
          )}

          {/* Список результатов */}
          {results.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {results.map((post, i) => (
                <SearchResultRow key={post.id} post={post} index={i} query={query} />
              ))}
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
