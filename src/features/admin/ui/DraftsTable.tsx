'use client'


import { useState } from 'react'
import type { AdminPost } from '@/features/admin/types'
import { deleteDraft } from '@/features/admin/actions/deleteDraft'

interface Props {
  posts: AdminPost[]
  selectedPostId: string | null
  onSelectPost: (id: string) => void
  onDeleted: () => void
}

export function DraftsTable({ posts, selectedPostId, onSelectPost, onDeleted }: Props) {
  
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete(id: string) {
    setDeleting(true)
    const result = await deleteDraft(id)
    setDeleting(false)
    setConfirmId(null)
    if (result.success) onDeleted()
  }

  if (posts.length === 0) {
    return (
      <div>
        <h2 className="font-display font-bold text-base mb-3">Черновики</h2>
        <div className="font-body font-light text-sm" style={{ color: 'rgba(255,255,255,0.4)', padding: '20px 0' }}>
          Нет черновиков
        </div>
      </div>
    )
  }

  return (
    <div>
      <h2 className="font-display font-bold text-base mb-3">Черновики</h2>
      <div style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
        {posts.map(post => {
          const date = post.updatedAt
            ? new Date(post.updatedAt).toLocaleDateString('ru', { day: 'numeric', month: 'short' })
            : '—'
          const isSelected = post.id === selectedPostId
          return (
            <div
              key={post.id}
              style={{
                display: 'grid', gridTemplateColumns: '1fr auto auto',
                gap: 12, padding: '11px 16px', alignItems: 'center',
                borderTop: '1px solid rgba(255,255,255,0.07)',
                background: isSelected ? 'rgba(255,59,48,0.06)' : 'transparent',
                cursor: 'pointer',
              }}
              onClick={() => onSelectPost(post.id)}
            >
              <span className="font-display font-bold text-[14px]" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {post.title || 'Без названия'}
              </span>
              <span className="font-body font-light text-[12px]" style={{ color: 'rgba(255,255,255,0.45)', flexShrink: 0 }}>
                {date}
              </span>
              {confirmId === post.id ? (
                <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                  <button
                    onClick={() => handleDelete(post.id)}
                    disabled={deleting}
                    className="font-nav font-bold text-[10px] uppercase"
                    style={{ background: '#ff3b30', color: '#fff', border: 'none', padding: '4px 8px', cursor: 'pointer' }}
                  >
                    Удалить
                  </button>
                  <button
                    onClick={() => setConfirmId(null)}
                    className="font-nav font-bold text-[10px] uppercase"
                    style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', border: 'none', padding: '4px 8px', cursor: 'pointer' }}
                  >
                    Отмена
                  </button>
                </div>
              ) : (
                <button
                  onClick={e => { e.stopPropagation(); setConfirmId(post.id) }}
                  style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', padding: 4 }}
                  title="Удалить черновик"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
                  </svg>
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
