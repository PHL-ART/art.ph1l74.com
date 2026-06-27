import type { Metadata } from 'next'
import { getRecentPosts } from '@/entities/post/queries'
import { PostsInfiniteGrid } from '@/features/posts/ui/PostsInfiniteGrid'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Все материалы — PHL·ART',
  description: 'Полный архив материалов: фото, кино, подкасты, тексты.',
}

const LIMIT = 12

export default async function PostsPage() {
  // Fetch one extra to determine hasMore without a separate count query
  const all = await getRecentPosts(LIMIT + 1, 0)
  const hasMore = all.length > LIMIT
  const posts = all.slice(0, LIMIT)

  return (
    <div style={{ background: 'var(--color-bg)' }}>
      {/* Page heading */}
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
          все материалы
        </h1>
      </div>

      {posts.length > 0 ? (
        <PostsInfiniteGrid initialPosts={posts} initialHasMore={hasMore} />
      ) : (
        <p
          className="font-nav font-medium text-[13px] tracking-[0.06em] uppercase text-center"
          style={{ paddingTop: '80px', color: 'var(--color-caption)' }}
        >
          Публикации появятся здесь
        </p>
      )}
    </div>
  )
}
