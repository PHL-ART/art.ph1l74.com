'use client'

export default function GlobalError({
  error: _error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="ru">
      <body style={{ background: '#0e0a0b', color: '#fff', fontFamily: 'sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', margin: 0 }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '13px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: '16px' }}>
            что-то пошло не так
          </p>
          <button
            onClick={reset}
            style={{ background: '#ff3b30', color: '#fff', border: 'none', padding: '8px 20px', cursor: 'pointer', fontSize: '13px', letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: 'sans-serif' }}
          >
            попробовать снова
          </button>
        </div>
      </body>
    </html>
  )
}
