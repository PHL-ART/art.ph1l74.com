'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useSelector, useDispatch } from 'react-redux'
import type { RootState, AppDispatch } from '@/shared/store'
import { setCurrentView } from '@/features/admin/model/adminSlice'

export function AdminTopbar() {
  const dispatch = useDispatch<AppDispatch>()
  const currentView = useSelector((state: RootState) => state.admin.currentView)

  return (
    <>
      <div className="hidden lg:flex items-center justify-between px-8 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="flex items-center gap-6">
          <h1 className="font-display font-bold m-0" style={{ fontSize: 24, letterSpacing: '-0.01em' }}>Студия публикаций</h1>
          <div className="flex gap-1">
            {(['overview', 'archive'] as const).map(view => {
              const label = view === 'overview' ? 'обзор' : 'архив'
              const active = currentView === view
              return (
                <button
                  key={view}
                  onClick={() => dispatch(setCurrentView(view))}
                  className="font-nav font-bold text-[11px] tracking-[0.06em] uppercase"
                  style={{
                    padding: '7px 14px',
                    background: active ? 'rgba(255,255,255,0.08)' : 'transparent',
                    color: active ? '#fff' : 'rgba(255,255,255,0.5)',
                    border: 'none', cursor: 'pointer',
                  }}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>
        <Link
          href="/admin/post/new"
          className="font-nav font-bold text-[12px] tracking-[0.06em] uppercase flex items-center gap-2"
          style={{ background: '#ff3b30', color: '#fff', padding: '11px 18px', textDecoration: 'none' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Новый пост
        </Link>
      </div>
      <div className="flex lg:hidden items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="flex items-center gap-3">
          <Image src="/logo-white.svg" alt="PHL·ART" width={32} height={32} />
          <h1 className="font-display font-bold m-0" style={{ fontSize: 18, letterSpacing: '-0.01em' }}>Студия</h1>
        </div>
        <Link
          href="/admin/post/new"
          className="font-nav font-bold text-[11px] tracking-[0.05em] uppercase flex items-center gap-1.5"
          style={{ background: '#ff3b30', color: '#fff', padding: '9px 14px', textDecoration: 'none' }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Пост
        </Link>
      </div>
      <div className="flex lg:hidden gap-6 px-5 pt-3.5 font-nav font-bold text-[12px] tracking-[0.06em] uppercase">
        {(['overview', 'archive'] as const).map(view => {
          const label = view === 'overview' ? 'обзор' : 'архив'
          const active = currentView === view
          return (
            <button
              key={view}
              onClick={() => dispatch(setCurrentView(view))}
              className="pb-2.5 font-nav font-bold text-[12px] tracking-[0.06em] uppercase"
              style={{
                borderBottom: active ? '2px solid #ff3b30' : '2px solid transparent',
                color: active ? '#fff' : 'rgba(255,255,255,0.45)',
                background: 'none', border: 'none', cursor: 'pointer',
                borderBottomColor: active ? '#ff3b30' : 'transparent',
                borderBottomWidth: '2px',
                borderBottomStyle: 'solid',
                paddingBottom: '10px',
              }}
            >
              {label}
            </button>
          )
        })}
      </div>
      <div className="lg:hidden h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
    </>
  )
}
