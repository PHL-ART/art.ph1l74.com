import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { getCategoryBySlug, getCategoryHeroBg } from '@/entities/category/queries'
import { getPostsByCategory } from '@/entities/post/queries'
import { MediaCard } from '@/shared/ui'
import { getPostUrl } from '@/shared/lib/getPostUrl'

export const revalidate = 60

interface Props {
  params: { categorySlug: string }
  searchParams: { page?: string }
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const page = Math.max(1, Number(searchParams.page ?? 1))
  const limit = 12
  const category = await getCategoryBySlug(params.categorySlug)
  if (!category) notFound()

  const [{ posts, total }, heroBg] = await Promise.all([
    getPostsByCategory(params.categorySlug, { page, limit }),
    getCategoryHeroBg(category),
  ])
  const totalPages = Math.ceil(total / limit)

  const heroBgStyle =
    heroBg.type === 'gradient'
      ? { background: heroBg.css }
      : heroBg.type === 'default'
        ? { background: 'linear-gradient(135deg, #1a1416 0%, #2d1b1e 100%)' }
        : undefined

  return (
    <div>
      {/* Hero section */}
      <section
        className="relative h-48 md:h-72 overflow-hidden"
        style={heroBgStyle}
      >
        {heroBg.type === 'image' && (
          <Image
            src={getPostUrl(heroBg.s3Key)}
            alt={category.name}
            fill
            className="object-cover opacity-50"
            priority
            sizes="100vw"
          />
        )}
        <div className="relative z-10 h-full flex items-end px-5 md:px-12 pb-8 bg-gradient-to-t from-bg/80 to-transparent">
          <h1 className="font-display font-bold text-text text-3xl md:text-5xl lowercase tracking-tight">
            {category.name}
          </h1>
        </div>
      </section>

      {/* Posts grid */}
      <div className="max-w-7xl mx-auto px-5 md:px-12 py-10 md:py-14">
        {category.description && (
          <p className="font-body text-body text-[17px] mb-10 max-w-2xl">
            {category.description}
          </p>
        )}

        {posts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {posts.map(post => (
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
        ) : (
          <p className="font-body text-caption text-center py-20">
            В этом разделе пока нет материалов
          </p>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <nav
            className="flex justify-center gap-2 mt-12"
            aria-label="Страницы"
          >
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <Link
                key={p}
                href={`/${params.categorySlug}?page=${p}`}
                className={`w-11 h-11 flex items-center justify-center rounded-[2px] border font-nav text-[11px] uppercase tracking-widest transition-colors ${
                  p === page
                    ? 'border-accent text-accent'
                    : 'border-hairline text-caption hover:text-text hover:border-text/30'
                }`}
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
