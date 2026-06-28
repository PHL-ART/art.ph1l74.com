'use client'

import { buildCalendarDays } from '@/features/admin/lib/buildCalendarDays'
import type { AdminPost } from '@/features/admin/types'

const WEEKDAYS = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс']
const MONTHS_RU = ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь']
const STATUS_COLOR: Record<string, string> = {
  PUBLISHED: '#3ec27a',
  SCHEDULED: '#ffb02e',
  DRAFT: 'rgba(255,255,255,0.4)',
}

interface Props {
  posts: AdminPost[]
  year: number
  month: number
  selectedPostId: string | null
  onSelectPost: (id: string) => void
  onNavigate: (year: number, month: number) => void
  isLoading: boolean
}

export function AdminCalendar({ posts, year, month, selectedPostId, onSelectPost, onNavigate, isLoading }: Props) {
  const days = buildCalendarDays(year, month, posts)

  function goToPrev() {
    if (month === 1) onNavigate(year - 1, 12)
    else onNavigate(year, month - 1)
  }
  function goToNext() {
    if (month === 12) onNavigate(year + 1, 1)
    else onNavigate(year, month + 1)
  }

  function formatTime(iso: string | null): string {
    if (!iso) return ''
    return new Date(iso).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display font-bold text-base m-0">Календарь публикаций</h2>
        <div className="flex items-center gap-3.5">
          <button onClick={goToPrev} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.55)', display: 'flex', padding: 0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
          </button>
          <span className="font-nav font-bold text-[12px] tracking-[0.08em] uppercase">{MONTHS_RU[month - 1]} {year}</span>
          <button onClick={goToNext} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.55)', display: 'flex', padding: 0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6" /></svg>
          </button>
        </div>
      </div>
      <div style={{ border: '1px solid rgba(255,255,255,0.1)', opacity: isLoading ? 0.6 : 1, transition: 'opacity 0.2s' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', background: 'rgba(255,255,255,0.04)' }}>
          {WEEKDAYS.map(wd => (
            <div key={wd} className="font-nav font-bold text-[10px] tracking-[0.08em] uppercase" style={{ padding: '9px 12px', color: 'rgba(255,255,255,0.5)' }}>{wd}</div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
          {days.map((day, i) => (
            <div key={i} className="min-h-[46px] lg:min-h-[98px]" style={{ borderTop: '1px solid rgba(255,255,255,0.07)', borderLeft: '1px solid rgba(255,255,255,0.07)', padding: 8, display: 'flex', flexDirection: 'column', gap: 5 }}>
              <span className="hidden lg:block font-display font-bold text-[12px]" style={{ color: day.isCurrentMonth ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.22)' }}>{day.num}</span>
              <div className="hidden lg:flex flex-col gap-1.5">
                {day.posts.map(post => (
                  <button key={post.id} onClick={() => onSelectPost(post.id)} style={{ all: 'unset', cursor: 'pointer', minWidth: 0, background: 'rgba(255,255,255,0.05)', padding: '5px 7px', display: 'flex', flexDirection: 'column', gap: 2, boxShadow: post.id === selectedPostId ? 'inset 0 0 0 1px #ff3b30' : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, background: STATUS_COLOR[post.status] ?? STATUS_COLOR.DRAFT }} />
                      <span className="font-body font-light text-[10px]" style={{ color: 'rgba(255,255,255,0.6)' }}>{post.status === 'PUBLISHED' ? formatTime(post.publishedAt) : formatTime(post.scheduledAt)}</span>
                    </div>
                    <span className="font-display font-bold text-[11px]" style={{ lineHeight: 1.1, color: 'rgba(255,255,255,0.92)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{post.title}</span>
                  </button>
                ))}
              </div>
              <div className="lg:hidden flex flex-col items-center gap-1 pt-1">
                <span className="font-display font-bold text-[11px]" style={{ color: day.isCurrentMonth ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.22)' }}>{day.num}</span>
                <div style={{ display: 'flex', gap: 3 }}>
                  {day.posts.map(post => (
                    <button key={post.id} onClick={() => onSelectPost(post.id)} style={{ all: 'unset', width: 5, height: 5, borderRadius: '50%', cursor: 'pointer', background: STATUS_COLOR[post.status] ?? STATUS_COLOR.DRAFT, boxShadow: post.id === selectedPostId ? '0 0 0 2px rgba(255,59,48,0.55)' : 'none' }} />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="lg:hidden flex flex-wrap gap-4 mt-3 font-body font-light text-[11px]" style={{ color: 'rgba(255,255,255,0.55)' }}>
        {([['#3ec27a', 'опубликовано'], ['#ffb02e', 'запланировано'], ['rgba(255,255,255,0.4)', 'черновик']] as const).map(([color, label]) => (
          <span key={label} className="flex items-center gap-1.5">
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, display: 'inline-block' }} />
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}
