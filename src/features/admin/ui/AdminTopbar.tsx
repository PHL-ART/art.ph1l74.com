import Image from 'next/image'

export function AdminTopbar() {
  return (
    <>
      <div className="hidden lg:flex items-center justify-between px-8 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="flex items-center gap-6">
          <h1 className="font-display font-bold m-0" style={{ fontSize: 24, letterSpacing: '-0.01em' }}>Студия публикаций</h1>
          <div className="flex gap-1">
            <span className="font-nav font-bold text-[11px] tracking-[0.06em] uppercase" style={{ padding: '7px 14px', background: 'rgba(255,255,255,0.08)', color: '#fff' }}>обзор</span>
            <span className="font-nav font-bold text-[11px] tracking-[0.06em] uppercase" style={{ padding: '7px 14px', color: 'rgba(255,255,255,0.5)' }}>архив</span>
          </div>
        </div>
        <button disabled className="font-nav font-bold text-[12px] tracking-[0.06em] uppercase opacity-40 cursor-not-allowed flex items-center gap-2" style={{ background: '#ff3b30', color: '#fff', border: 'none', padding: '11px 18px' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Новый пост
        </button>
      </div>
      <div className="flex lg:hidden items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="flex items-center gap-3">
          <Image src="/logo-white.svg" alt="PHL·ART" width={32} height={32} />
          <h1 className="font-display font-bold m-0" style={{ fontSize: 18, letterSpacing: '-0.01em' }}>Студия</h1>
        </div>
        <button disabled className="font-nav font-bold text-[11px] tracking-[0.05em] uppercase opacity-40 cursor-not-allowed flex items-center gap-1.5" style={{ background: '#ff3b30', color: '#fff', border: 'none', padding: '9px 14px' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Пост
        </button>
      </div>
      <div className="flex lg:hidden gap-6 px-5 pt-3.5 font-nav font-bold text-[12px] tracking-[0.06em] uppercase">
        <span className="pb-2.5" style={{ borderBottom: '2px solid #ff3b30' }}>обзор</span>
        <span className="pb-2.5" style={{ color: 'rgba(255,255,255,0.45)' }}>архив</span>
      </div>
      <div className="lg:hidden h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
    </>
  )
}
