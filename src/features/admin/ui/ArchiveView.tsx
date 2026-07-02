'use client'

import { useCallback, useEffect, useState } from 'react'
import type { AdminPost } from '@/features/admin/types'
import { deletePost } from '@/features/admin/actions/deletePost'
import { AdminArchive } from './AdminArchive'
import { PostSettingsPanel } from './PostSettingsPanel'

interface Props {
  selectedPostId: string | null
  onSelectPost: (id: string) => void
}

export function ArchiveView({ selectedPostId, onSelectPost }: Props) {
  const [search, setSearch] = useState('')
  const [posts, setPosts] = useState<AdminPost[]>([])
  const [loading, setLoading] = useState(false)

  const fetchPosts = useCallback(async (q: string) => {
    setLoading(true)
    const params = new URLSearchParams({ mode: 'archive', status: 'PUBLISHED', ...(q ? { search: q } : {}) })
    const data = await fetch(`/api/admin/posts?${params}`).then(r => r.json())
    setPosts(data.posts ?? [])
    setLoading(false)
  }, [])

  // Initial load
  useEffect(() => { fetchPosts('') }, [fetchPosts])

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => fetchPosts(search), 300)
    return () => clearTimeout(t)
  }, [search, fetchPosts])

  const selectedPost = posts.find(p => p.id === selectedPostId) ?? null

  async function handleDelete(id: string) {
    const result = await deletePost(id)
    if (result.success) fetchPosts(search)
  }

  return (
    <div style={{ padding: '24px 30px', display: 'grid', gridTemplateColumns: '1fr 300px', gap: 22, alignItems: 'start' }}>
      {/* Left column: search + archive table */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Поиск по заголовку..."
          className="font-body font-light"
          style={{
            width: '100%',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.12)',
            color: '#fff',
            padding: '10px 14px',
            fontSize: 14,
            outline: 'none',
          }}
        />

        {loading ? (
          <div className="font-body font-light text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Загрузка...
          </div>
        ) : (
          <AdminArchive
            posts={posts}
            hideTitle
            onSelectPost={onSelectPost}
            selectedPostId={selectedPostId}
            onDelete={handleDelete}
          />
        )}
      </div>

      {/* Right column: post settings sidebar */}
      <PostSettingsPanel post={selectedPost} />
    </div>
  )
}
