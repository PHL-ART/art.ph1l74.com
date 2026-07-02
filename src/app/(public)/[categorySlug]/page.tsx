import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { getCategoryBySlug } from '@/entities/category/queries'
import { getPostsByCategory } from '@/entities/post/queries'
import { extractLead } from '@/shared/lib/extractLead'
import { CategoryChips } from '@/shared/ui/CategoryChips'
import { PostThumbnail } from '@/shared/ui/PostThumbnail'

export const revalidate = 60

interface Props {
  params: { categorySlug: string }
  searchParams: { page?: string }
}

// Месяцы, у которых нет русского родительного падежа, отличающегося от именительного
const MONTH_EXCEPTIONS = ['март', 'май', 'июнь', 'июль']

function formatPostDate(date: Date | null): { day: string; month: string; year: string } | null {
  if (!date) return null
  const d = new Date(date)
  const monthFull = new Intl.DateTimeFormat('ru', { month: 'long' }).format(d)
  return {
    day: String(d.getDate()),
    month: MONTH_EXCEPTIONS.includes(monthFull) ? monthFull : monthFull.slice(0, 3),
    year: String(d.getFullYear()),
  }
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

// ── Строка поста в списке категории ──────────────────────────────────────────

interface CategoryPostRowProps {
  post: {
    id: string
    slug: string
    title: string
    coverImageKey?: string | null
    publishedAt: Date | null
    body: unknown
    categories: { id: string; name: string; slug: string }[]
    tags: { id: string; name: string; slug: string }[]
  }
  index: number
  currentCategorySlug: string
}

function CategoryPostRow({ post, index, currentCategorySlug }: CategoryPostRowProps) {
  const excerpt = extractLead(post.body)
  const dateInfo = formatPostDate(post.publishedAt)

  // Показываем категории и теги, исключая текущую категорию (она уже в заголовке страницы)
  const otherCategories = post.categories.filter(c => c.slug !== currentCategorySlug)
  const hasChips = otherCategories.length > 0 || post.tags.length > 0

  return (
    <div
      className="group relative"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '28px',
        padding: '24px 0',
        borderBottom: '1px solid var(--color-hairline)',
      }}
    >
      {/* Растянутая ссылка — перехватывает клики по всей строке на z-[1] */}
      <Link
        href={`/post/${post.slug}`}
        className="absolute inset-0 z-[1]"
        aria-label={post.title}
      />

      {/* Столбец с датой */}
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

      {/* Обложка */}
      <PostThumbnail
        coverImageKey={post.coverImageKey}
        title={post.title}
        index={index}
        className="flex-shrink-0 z-[2] pointer-events-none"
        width={270}
        height={150}
        sizes="270px"
      />

      {/* Текстовый блок */}
      <div className="relative z-[2] pointer-events-none" style={{ flex: 1, minWidth: 0 }}>
        {hasChips && (
          <CategoryChips
            categories={otherCategories}
            tags={post.tags}
            className="pointer-events-auto mb-[10px]"
          />
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
}

// ── Пагинация ────────────────────────────────────────────────────────────────

interface PaginationProps {
  currentPage: number
  totalPages: number
  categorySlug: string
}

function Pagination({ currentPage, totalPages, categorySlug }: PaginationProps) {
  if (totalPages <= 1) return null

  return (
    <nav className="flex justify-center gap-2 mt-12" aria-label="Страницы">
      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
        <Link
          key={page}
          href={`/${categorySlug}?page=${page}`}
          className="font-nav text-[11px] uppercase tracking-widest transition-colors"
          style={{
            width: '44px',
            height: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: `1px solid ${page === currentPage ? 'var(--color-accent)' : 'var(--color-hairline)'}`,
            color: page === currentPage ? 'var(--color-accent)' : 'var(--color-caption)',
          }}
          aria-current={page === currentPage ? 'page' : undefined}
        >
          {page}
        </Link>
      ))}
    </nav>
  )
}

// ── Страница категории ────────────────────────────────────────────────────────

export default async function CategoryPage({ params, searchParams }: Props) {
  const page = Math.max(1, Number(searchParams.page ?? 1))
  const limit = 12
  const category = await getCategoryBySlug(params.categorySlug)
  if (!category) notFound()

  const { posts, total } = await getPostsByCategory(params.categorySlug, { page, limit })
  const totalPages = Math.ceil(total / limit)

  return (
    <div style={{ background: 'var(--color-bg)' }}>

      {/* Заголовок раздела */}
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

      {/* Список постов */}
      <div style={{ padding: '0 44px 64px' }}>
        {posts.length > 0 ? (
          <>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {posts.map((post, i) => (
                <CategoryPostRow
                  key={post.id}
                  post={post}
                  index={i}
                  currentCategorySlug={params.categorySlug}
                />
              ))}
            </div>
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              categorySlug={params.categorySlug}
            />
          </>
        ) : (
          <p
            className="font-nav font-medium text-[13px] tracking-[0.06em] uppercase text-center"
            style={{ paddingTop: '80px', color: 'var(--color-caption)' }}
          >
            В этом разделе пока нет материалов
          </p>
        )}
      </div>
    </div>
  )
}
