'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { MediaCard } from '@/shared/ui'
import { CARD_GRADIENTS } from '@/shared/lib/gradients'
import type { PostPreview } from '@/entities/post/types'

// API returns publishedAt as an ISO string, not a Date object
type ApiPost = Omit<PostPreview, 'publishedAt'> & { publishedAt: string | null }

interface Props {
  initialPosts: PostPreview[]
  initialHasMore: boolean
}

export function PostsInfiniteGrid({ initialPosts, initialHasMore }: Props) {
  const [posts, setPosts] = useState<PostPreview[]>(initialPosts)
  const [page, setPage] = useState(2)
  const [isLoading, setIsLoading] = useState(false)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const sentinelRef = useRef<HTMLDivElement>(null)

  // loadMore is recreated whenever page, isLoading, or hasMore change.
  // The IntersectionObserver effect depends on loadMore so it re-registers
  // the observer each time, picking up the latest page/state values.
  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return
    setIsLoading(true)
    try {
      const res = await fetch(`/api/posts?page=${page}&limit=12`)
      if (!res.ok) {
        console.error('[PostsInfiniteGrid] /api/posts returned', res.status)
        setHasMore(false)
        return
      }
      const data: { posts: ApiPost[]; hasMore: boolean } = await res.json()
      // Convert publishedAt ISO strings back to Date objects for MediaCard
      const normalized: PostPreview[] = data.posts.map(p => ({
        ...p,
        publishedAt: p.publishedAt ? new Date(p.publishedAt) : null,
      }))
      setPosts(prev => [...prev, ...normalized])
      setPage(p => p + 1)
      setHasMore(data.hasMore)
    } finally {
      setIsLoading(false)
    }
  }, [page, isLoading, hasMore])

  // Re-register the IntersectionObserver whenever loadMore changes so the
  // callback always has the current page and loading state captured in closure.
  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) loadMore() },
      { rootMargin: '200px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [loadMore])

  return (
    <>
      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 px-5 md:px-11"
        style={{ gap: '16px', paddingBottom: '52px' }}
      >
        {posts.map((post, i) => (
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

      {/* Sentinel element — observed by IntersectionObserver to trigger next page load */}
      {hasMore && (
        <div ref={sentinelRef} style={{ height: '1px' }} aria-hidden />
      )}

      {/* Loading skeleton — 3 pulsing placeholder cards while fetching next page */}
      {isLoading && (
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 px-5 md:px-11"
          style={{ gap: '16px', paddingBottom: '52px' }}
        >
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse border"
              style={{
                height: '280px',
                borderColor: 'rgba(255,255,255,0.14)',
                background: 'rgba(255,255,255,0.03)',
              }}
            />
          ))}
        </div>
      )}
    </>
  )
}
