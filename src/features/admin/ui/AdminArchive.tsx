'use client'

import { useState } from 'react'
import type { AdminPost } from '@/features/admin/types'

interface Props {
  posts: AdminPost[]
  onSelectPost?: (id: string) => void
  selectedPostId?: string | null
  hideTitle?: boolean
  onDelete?: (id: string) => Promise<void>
}

function CoverThumb({ post, size }: { post: AdminPost; size: number }) {
  const s3Base = process.env.NEXT_PUBLIC_S3_BASE_URL
  const src = post.coverImageKey && s3Base ? `${s3Base}/${post.coverImageKey}` : null
  return (
    <div style={{ width: size, height: size, flexShrink: 0, backgroundSize: 'cover', backgroundPosition: 'center', backgroundImage: src ? `url(${src})` : undefined, background: src ? undefined : 'linear-gradient(135deg,#ff3b30,#7a1d18)', border: '1px solid rgba(255,255,255,0.14)' }} />
  )
}

const BASE_COL = '1fr 110px 130px 120px 90px'
const DELETE_COL = '1fr 110px 130px 120px 90px 44px'
const HEADER_CELLS = ['материал', 'раздел', 'дата', 'каналы', 'охват']

export function AdminArchive({ posts, onSelectPost, selectedPostId, hideTitle, onDelete }: Props) {
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const colTemplate = onDelete ? DELETE_COL : BASE_COL

  async function handleDelete(id: string) {
    if (!onDelete) return
    setDeleting(true)
    await onDelete(id)
    setDeleting(false)
    setConfirmId(null)
  }

  return (
    <div>
      {!hideTitle && (
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="font-display font-bold text-base m-0">Архив постов</h2>
          <span className="font-nav font-bold text-[10px] tracking-[0.07em] uppercase" style={{ color: 'rgba(255,255,255,0.45)' }}>
            {posts.length} материал{posts.length === 1 ? '' : posts.length < 5 ? 'а' : 'ов'}
          </span>
        </div>
      )}

      {/* Desktop table */}
      <div className="hidden lg:block" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
        <div
          style={{ display: 'grid', gridTemplateColumns: colTemplate, gap: 16, padding: '11px 18px', background: 'rgba(255,255,255,0.04)' }}
          className="font-nav font-bold text-[10px] tracking-[0.08em] uppercase"
        >
          {HEADER_CELLS.map(cell => (
            <div key={cell} style={{ color: 'rgba(255,255,255,0.5)', textAlign: cell === 'охват' ? 'right' : 'left' }}>{cell}</div>
          ))}
          {onDelete && <div />}
        </div>

        {posts.map(post => {
          const date = post.publishedAt
            ? new Date(post.publishedAt).toLocaleDateString('ru', { day: 'numeric', month: 'long', year: 'numeric' })
            : '—'
          const isSelected = post.id === selectedPostId
          const isConfirming = confirmId === post.id

          return (
            <div
              key={post.id}
              onClick={() => !isConfirming && onSelectPost?.(post.id)}
              style={{
                display: 'grid', gridTemplateColumns: colTemplate, gap: 16, padding: '13px 18px',
                borderTop: '1px solid rgba(255,255,255,0.07)', alignItems: 'center',
                cursor: onSelectPost && !isConfirming ? 'pointer' : undefined,
                background: isSelected ? 'rgba(255,59,48,0.06)' : 'transparent',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <CoverThumb post={post} size={38} />
                <span className="font-display font-bold text-[14px]">{post.title}</span>
              </div>
              <div className="font-nav font-bold text-[11px] tracking-[0.05em] uppercase" style={{ color: '#ff5a4a' }}>
                {post.categories[0]?.name ?? '—'}
              </div>
              <div className="font-body font-light text-[14px]" style={{ color: 'rgba(255,255,255,0.7)' }}>{date}</div>
              <div style={{ display: 'flex', gap: 6 }}>
                {(['VK', 'TG'] as const).map(ch => (
                  <span key={ch} className="font-nav font-bold text-[10px]" style={{ color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.18)', padding: '3px 7px' }}>{ch}</span>
                ))}
              </div>
              <div className="font-display font-bold text-[14px]" style={{ textAlign: 'right', color: 'rgba(255,255,255,0.5)' }}>
                {post.viewCount.toLocaleString('ru')}
              </div>

              {onDelete && (
                <div onClick={e => e.stopPropagation()} style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  {isConfirming ? (
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleDelete(post.id)}
                        disabled={deleting}
                        className="font-nav font-bold text-[9px] uppercase"
                        style={{ background: '#ff3b30', color: '#fff', border: 'none', padding: '3px 7px', cursor: 'pointer' }}
                      >
                        Да
                      </button>
                      <button
                        onClick={() => setConfirmId(null)}
                        className="font-nav font-bold text-[9px] uppercase"
                        style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', border: 'none', padding: '3px 7px', cursor: 'pointer' }}
                      >
                        Нет
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmId(post.id)}
                      style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', padding: 4 }}
                      title="Удалить статью"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
                      </svg>
                    </button>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Mobile list */}
      <div className="lg:hidden flex flex-col gap-2.5">
        {posts.map(post => {
          const date = post.publishedAt
            ? new Date(post.publishedAt).toLocaleDateString('ru', { day: 'numeric', month: 'long' })
            : '—'
          const isSelected = post.id === selectedPostId
          return (
            <div
              key={post.id}
              onClick={() => onSelectPost?.(post.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                background: isSelected ? 'rgba(255,59,48,0.06)' : 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.1)', padding: '11px 13px',
                cursor: onSelectPost ? 'pointer' : undefined,
              }}
            >
              <CoverThumb post={post} size={44} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="font-display font-bold text-[14px]" style={{ lineHeight: 1.15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{post.title}</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-nav font-bold text-[9px] tracking-[0.05em] uppercase" style={{ color: '#ff5a4a' }}>{post.categories[0]?.name ?? '—'}</span>
                  <span className="font-body font-light text-[11px]" style={{ color: 'rgba(255,255,255,0.5)' }}>{date}</span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5, flexShrink: 0 }}>
                <span className="font-display font-bold text-[13px]" style={{ color: 'rgba(255,255,255,0.5)' }}>{post.viewCount.toLocaleString('ru')}</span>
                <div style={{ display: 'flex', gap: 4 }}>
                  {(['VK', 'TG'] as const).map(ch => (
                    <span key={ch} className="font-nav font-bold text-[9px]" style={{ color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.18)', padding: '2px 6px' }}>{ch}</span>
                  ))}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
