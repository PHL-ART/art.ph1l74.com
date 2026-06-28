'use client'

import type { AdminPost } from '@/features/admin/types'

const STATUS_LABEL: Record<string, string> = {
  PUBLISHED: 'опубликовано',
  SCHEDULED: 'запланировано',
  DRAFT: 'черновик',
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <div onClick={onToggle} role="switch" aria-checked={on} style={{ cursor: 'pointer', width: 38, height: 21, borderRadius: 999, background: on ? '#ff3b30' : 'rgba(255,255,255,0.14)', position: 'relative', flexShrink: 0 }}>
      <div style={{ position: 'absolute', top: 2, [on ? 'right' : 'left']: 2, width: 17, height: 17, borderRadius: '50%', background: on ? '#fff' : 'rgba(255,255,255,0.55)', transition: 'left 0.15s, right 0.15s' }} />
    </div>
  )
}

const CHANNELS = [
  { key: 'vk' as const, name: 'VK', handle: 'phl_art' },
  { key: 'tg' as const, name: 'TG', handle: '@phlart' },
]

interface Props {
  post: AdminPost | null
  channels: { vk?: boolean; tg?: boolean }
  onToggle: (channel: 'vk' | 'tg', enabled: boolean) => void
  onPublish: () => void
  isPublishing: boolean
}

export function CrossPostingPanel({ post, channels, onToggle, onPublish, isPublishing }: Props) {
  const s3Base = process.env.NEXT_PUBLIC_S3_BASE_URL
  const coverSrc = post?.coverImageKey && s3Base ? `${s3Base}/${post.coverImageKey}` : null
  const isPublished = post?.status === 'PUBLISHED'
  const btnDisabled = !post || isPublished || isPublishing

  return (
    <div style={{ border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)', minHeight: 520, display: 'flex', flexDirection: 'column' }}>
      <div className="font-nav font-bold text-[11px] tracking-[0.1em] uppercase" style={{ padding: '16px 18px', borderBottom: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}>Кросс-постинг</div>
      {!post && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, padding: '40px 26px', textAlign: 'center' }}>
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.6">
            <path d="M4 12v7a1 1 0 001 1h14a1 1 0 001-1v-7" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" />
          </svg>
          <div className="font-body font-light text-[15px]" style={{ lineHeight: 1.5, color: 'rgba(255,255,255,0.5)', maxWidth: 200 }}>Выберите пост в календаре, чтобы настроить публикацию в каналы</div>
        </div>
      )}
      {post && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 18 }}>
          <div style={{ height: 140, backgroundSize: 'cover', backgroundPosition: 'center', backgroundImage: coverSrc ? `url(${coverSrc})` : undefined, background: coverSrc ? undefined : 'linear-gradient(135deg,#ff3b30,#7a1d18)', border: '1px solid rgba(255,255,255,0.14)', marginBottom: 14 }} />
          <div className="font-nav font-bold text-[10px] tracking-[0.1em] uppercase" style={{ color: '#ff5a4a', marginBottom: 6 }}>{post.categories.map(c => c.name).join(', ')} · {STATUS_LABEL[post.status] ?? post.status}</div>
          <div className="font-display font-bold text-[18px]" style={{ lineHeight: 1.1 }}>{post.title}</div>
          <div className="font-nav font-bold text-[11px] tracking-[0.1em] uppercase" style={{ color: 'rgba(255,255,255,0.5)', margin: '22px 0 12px' }}>
            {isPublished ? 'опубликовано в каналы' : 'платформы публикации'}
          </div>
          {!isPublished && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {CHANNELS.map(({ key, name, handle }) => {
                const enabled = channels[key] ?? true
                return (
                  <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.12)', padding: '13px 15px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                      <span className="font-nav font-bold text-[13px] tracking-[0.04em]">{name}</span>
                      <span className="font-body font-light text-[13px]" style={{ color: 'rgba(255,255,255,0.55)' }}>{handle}</span>
                    </div>
                    <Toggle on={enabled} onToggle={() => onToggle(key, !enabled)} />
                  </div>
                )
              })}
            </div>
          )}
          <div className="font-nav font-bold text-[11px] tracking-[0.1em] uppercase" style={{ color: 'rgba(255,255,255,0.5)', margin: '22px 0 10px' }}>время выхода</div>
          <div className="font-body font-light text-[15px]" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.12)', padding: '13px 15px' }}>
            <span>{post.scheduledAt ? new Date(post.scheduledAt).toLocaleString('ru', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }) : '—'}</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="1.8"><circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 15 14" /></svg>
          </div>
          <button onClick={onPublish} disabled={btnDisabled} className="font-nav font-bold text-[12px] tracking-[0.06em] uppercase" style={{ marginTop: 22, width: '100%', background: isPublished ? 'rgba(255,255,255,0.1)' : '#ff3b30', color: '#fff', border: 'none', padding: 14, cursor: btnDisabled ? 'not-allowed' : 'pointer', opacity: btnDisabled ? 0.6 : 1, transition: 'opacity 0.15s' }}>
            {isPublishing ? 'Публикуется...' : isPublished ? 'Уже опубликовано' : 'Опубликовать в выбранные каналы'}
          </button>
        </div>
      )}
    </div>
  )
}
