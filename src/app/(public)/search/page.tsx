import { SectionTitle, MediaCard } from '@/shared/ui'
import { searchPosts } from '@/shared/lib/search'

interface Props {
  searchParams: { q?: string }
}

export default async function SearchPage({ searchParams }: Props) {
  const query = searchParams.q?.trim() ?? ''
  const results = query ? await searchPosts(query) : []

  return (
    <div className="max-w-7xl mx-auto px-5 md:px-12 py-10 md:py-16">
      <form method="GET" className="mb-10">
        <div className="relative max-w-xl">
          <input
            name="q"
            defaultValue={query}
            placeholder="Поиск по материалам..."
            autoFocus
            className="w-full bg-glass border border-hairline rounded-[4px] px-4 py-3 font-body text-text placeholder:text-caption focus:outline-none focus:border-accent text-[17px]"
          />
          <button
            type="submit"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-caption hover:text-text transition-colors"
            aria-label="Найти"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              aria-hidden
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </button>
        </div>
      </form>
      {query && (
        <>
          <SectionTitle className="mb-2">
            {results.length > 0 ? `Найдено: ${results.length}` : 'Ничего не найдено'}
          </SectionTitle>
          {results.length > 0 && (
            <p className="font-body text-caption text-sm mb-8">по запросу «{query}»</p>
          )}
          {results.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {results.map(post => (
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
          )}
        </>
      )}
      {!query && (
        <p className="font-body text-caption text-center py-20">Введи запрос для поиска</p>
      )}
    </div>
  )
}
