'use client'

import { useRouter } from 'next/navigation'
import type { AdminPost } from '@/features/admin/types'

interface Props {
  post: AdminPost | null
}

const STATUS_LABEL: Record<string, string> = {
  PUBLISHED: 'опубликовано', SCHEDULED: 'запланировано', DRAFT: 'черновик',
}

export function PostSettingsPanel({ post }: Props) {
  const router = useRouter()

  if (!post) {
    return (
      <div style={{ border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)', minHeight: 420, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span className="font-body font-light text-sm" style={{ color: 'rgba(255,255,255,0.35)', textAlign: 'center', maxWidth: 180 }}>
          Выберите материал из списка
        </span>
      </div>
    )
  }

  const s3Base = process.env.NEXT_PUBLIC_S3_BASE_URL
  const coverSrc = post.coverImageKey && s3Base ? `${s3Base}/${post.coverImageKey}` : null
  const isPublished = post.status === 'PUBLISHED'

  return (
    <div style={{ border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)', display: 'flex', flexDirection: 'column' }}>
      <div className="font-nav font-bold text-[11px] tracking-[0.1em] uppercase" style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}>
        Настройки материала
      </div>
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Cover thumbnail */}
        <div
          style={{
            height: 100,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundImage: coverSrc ? `url(${coverSrc})` : undefined,
            background: coverSrc ? undefined : 'linear-gradient(135deg,#ff3b30,#7a1d18)',
          }}
        />

        {/* Meta */}
        <div>
          <div className="font-nav font-bold text-[10px] tracking-[0.08em] uppercase" style={{ color: '#ff5a4a', marginBottom: 4 }}>
            {post.categories[0]?.name ?? '—'} · {STATUS_LABEL[post.status] ?? post.status}
          </div>
          <div className="font-display font-bold text-[16px]" style={{ lineHeight: 1.1 }}>
            {post.title || 'Без названия'}
          </div>
        </div>

        {/* Cross-posting placeholder (non-published only) */}
        {!isPublished && (
          <div>
            <div className="font-nav font-bold text-[10px] tracking-[0.08em] uppercase" style={{ color: 'rgba(255,255,255,0.45)', marginBottom: 8 }}>
              Кросс-постинг
            </div>
            <div className="font-body font-light text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Настройте сервисы в разделе «Сервисы»
            </div>
          </div>
        )}

        {/* AfterPosting placeholder (published only) */}
        {isPublished && (
          <div>
            <div className="font-nav font-bold text-[10px] tracking-[0.08em] uppercase" style={{ color: 'rgba(255,255,255,0.45)', marginBottom: 8 }}>
              AfterPosting
            </div>
            <div className="font-body font-light text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Ссылки на другие платформы — в разработке
            </div>
          </div>
        )}

        {/* Edit button */}
        <button
          onClick={() => router.push(`/admin/post/${post.id}`)}
          className="font-nav font-bold text-[11px] tracking-[0.06em] uppercase"
          style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', border: 'none', padding: '10px 0', cursor: 'pointer', width: '100%' }}
        >
          Редактировать
        </button>
      </div>
    </div>
  )
}
