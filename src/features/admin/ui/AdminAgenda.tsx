'use client'

import type { AdminPost } from '@/features/admin/types'

const STATUS_COLOR: Record<string, string> = {
  PUBLISHED: '#3ec27a',
  SCHEDULED: '#ffb02e',
  DRAFT: 'rgba(255,255,255,0.4)',
}

interface Props {
  posts: AdminPost[]
  selectedPostId: string | null
  onSelectPost: (id: string) => void
}

export function AdminAgenda({ posts, selectedPostId, onSelectPost }: Props) {
  const s3Base = process.env.NEXT_PUBLIC_S3_BASE_URL

  const agenda = posts
    .filter(p => p.status !== 'PUBLISHED')
    .sort((a, b) => {
      const ta = a.scheduledAt ? new Date(a.scheduledAt).getTime() : Infinity
      const tb = b.scheduledAt ? new Date(b.scheduledAt).getTime() : Infinity
      return ta - tb
    })

  if (agenda.length === 0) return null

  return (
    <div>
      <h2 className="font-display font-bold text-base m-0 mb-3">Ближайшие публикации</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {agenda.map(post => {
          const coverSrc = post.coverImageKey && s3Base ? `${s3Base}/${post.coverImageKey}` : null
          const whenLabel = post.scheduledAt
            ? new Date(post.scheduledAt).toLocaleString('ru', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })
            : '—'
          return (
            <button key={post.id} onClick={() => onSelectPost(post.id)} style={{ all: 'unset', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', padding: '11px 13px', boxShadow: post.id === selectedPostId ? 'inset 0 0 0 1px #ff3b30' : 'none' }}>
              <div style={{ width: 46, height: 46, flexShrink: 0, backgroundSize: 'cover', backgroundPosition: 'center', backgroundImage: coverSrc ? `url(${coverSrc})` : undefined, background: coverSrc ? undefined : 'linear-gradient(135deg,#ff3b30,#7a1d18)', border: '1px solid rgba(255,255,255,0.14)' }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, background: STATUS_COLOR[post.status] }} />
                  <span className="font-nav font-bold text-[9px] tracking-[0.06em] uppercase" style={{ color: '#ff5a4a' }}>{post.categories[0]?.name ?? '—'}</span>
                  <span className="font-body font-light text-[11px]" style={{ color: 'rgba(255,255,255,0.5)' }}>{whenLabel}</span>
                </div>
                <div className="font-display font-bold text-[14px]" style={{ lineHeight: 1.15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{post.title}</div>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0 }}><polyline points="9 18 15 12 9 6" /></svg>
            </button>
          )
        })}
      </div>
    </div>
  )
}
