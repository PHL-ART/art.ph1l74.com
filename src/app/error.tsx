'use client'

// Глобальный fallback — рендерится в собственном html/body контексте,
// поэтому CSS-токены и шрифты из корневого лейаута недоступны.
// Используем захардкоженные значения тёмной темы.
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body
        style={{
          background: '#0e0a0b',
          color: '#fff',
          margin: 0,
          fontFamily: 'sans-serif',
          minHeight: '100vh',
        }}
      >
        <div style={{ padding: '52px 44px 80px', minHeight: '80vh' }}>
          <div
            style={{
              fontSize: '11px',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.62)',
              marginBottom: '12px',
            }}
          >
            что-то пошло не так
          </div>

          <div
            style={{
              fontSize: 'clamp(56px, 6vw, 96px)',
              fontWeight: 700,
              lineHeight: '1.0',
              letterSpacing: '-0.015em',
              color: '#fff',
              margin: '0 0 16px',
            }}
          >
            !
          </div>

          <p
            style={{
              fontWeight: 300,
              fontSize: '15px',
              color: 'rgba(255,255,255,0.62)',
              marginBottom: '32px',
            }}
          >
            произошла ошибка на сервере
          </p>

          <button
            onClick={reset}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#ff3b30',
              padding: 0,
              fontSize: '13px',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              fontFamily: 'sans-serif',
            }}
          >
            попробовать снова
          </button>
        </div>
      </body>
    </html>
  )
}
