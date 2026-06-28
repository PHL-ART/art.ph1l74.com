import type { AdminPost } from '@/features/admin/types'

interface Props {
  posts: AdminPost[]
}

function CoverThumb({ post, size }: { post: AdminPost; size: number }) {
  const s3Base = process.env.NEXT_PUBLIC_S3_BASE_URL
  const src = post.coverImageKey && s3Base ? `${s3Base}/${post.coverImageKey}` : null
  return (
    <div style={{ width: size, height: size, flexShrink: 0, backgroundSize: 'cover', backgroundPosition: 'center', backgroundImage: src ? `url(${src})` : undefined, background: src ? undefined : 'linear-gradient(135deg,#ff3b30,#7a1d18)', border: '1px solid rgba(255,255,255,0.14)' }} />
  )
}

const COL_TEMPLATE = '1fr 110px 130px 120px 90px'
const HEADER_CELLS = ['материал', 'раздел', 'дата', 'каналы', 'охват']

export function AdminArchive({ posts }: Props) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="font-display font-bold text-base m-0">Архив постов</h2>
        <span className="font-nav font-bold text-[10px] tracking-[0.07em] uppercase" style={{ color: 'rgba(255,255,255,0.45)' }}>
          {posts.length} материал{posts.length === 1 ? '' : posts.length < 5 ? 'а' : 'ов'}
        </span>
      </div>
      <div className="hidden lg:block" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: COL_TEMPLATE, gap: 16, padding: '11px 18px', background: 'rgba(255,255,255,0.04)' }} className="font-nav font-bold text-[10px] tracking-[0.08em] uppercase">
          {HEADER_CELLS.map(cell => (<div key={cell} style={{ color: 'rgba(255,255,255,0.5)', textAlign: cell === 'охват' ? 'right' : 'left' }}>{cell}</div>))}
        </div>
        {posts.map(post => {
          const date = post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('ru', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'
          return (
            <div key={post.id} style={{ display: 'grid', gridTemplateColumns: COL_TEMPLATE, gap: 16, padding: '13px 18px', borderTop: '1px solid rgba(255,255,255,0.07)', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <CoverThumb post={post} size={38} />
                <span className="font-display font-bold text-[14px]">{post.title}</span>
              </div>
              <div className="font-nav font-bold text-[11px] tracking-[0.05em] uppercase" style={{ color: '#ff5a4a' }}>{post.categories[0]?.name ?? '—'}</div>
              <div className="font-body font-light text-[14px]" style={{ color: 'rgba(255,255,255,0.7)' }}>{date}</div>
              <div style={{ display: 'flex', gap: 6 }}>
                {(['VK', 'TG'] as const).map(ch => (<span key={ch} className="font-nav font-bold text-[10px]" style={{ color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.18)', padding: '3px 7px' }}>{ch}</span>))}
              </div>
              <div className="font-display font-bold text-[14px]" style={{ textAlign: 'right', color: 'rgba(255,255,255,0.5)' }}>{post.viewCount.toLocaleString('ru')}</div>
            </div>
          )
        })}
      </div>
      <div className="lg:hidden flex flex-col gap-2.5">
        {posts.map(post => {
          const date = post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('ru', { day: 'numeric', month: 'long' }) : '—'
          return (
            <div key={post.id} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', padding: '11px 13px' }}>
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
                  {(['VK', 'TG'] as const).map(ch => (<span key={ch} className="font-nav font-bold text-[9px]" style={{ color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.18)', padding: '2px 6px' }}>{ch}</span>))}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
