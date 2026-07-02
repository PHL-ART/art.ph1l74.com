export function AdminBottomNav() {
  return (
    <div className="flex lg:hidden fixed bottom-0 left-0 right-0 items-center justify-around py-3 px-6" style={{ background: '#0a0708', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
      <span style={{ color: '#ff3b30', display: 'flex' }}>
        <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="3" y="4" width="18" height="17" rx="2" />
          <line x1="3" y1="9" x2="21" y2="9" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="16" y1="2" x2="16" y2="6" />
        </svg>
      </span>
      <span style={{ color: 'rgba(255,255,255,0.45)', display: 'flex' }}>
        <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
          <circle cx="3.5" cy="6" r="1" /><circle cx="3.5" cy="12" r="1" /><circle cx="3.5" cy="18" r="1" />
        </svg>
      </span>
      <span style={{ color: 'rgba(255,255,255,0.45)', display: 'flex' }}>
        <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M4 12v7a1 1 0 001 1h14a1 1 0 001-1v-7" />
          <polyline points="16 6 12 2 8 6" />
          <line x1="12" y1="2" x2="12" y2="15" />
        </svg>
      </span>
      <span style={{ color: 'rgba(255,255,255,0.45)', display: 'flex' }}>
        <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="M21 15l-5-5L5 21" />
        </svg>
      </span>
      <span style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg,#ff3b30,#7a1d18)', display: 'inline-block' }} />
    </div>
  )
}
