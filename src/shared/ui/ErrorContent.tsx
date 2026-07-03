interface ErrorContentProps {
  code: string
  label: string
  message: string
  // Принимается готовый ReactNode — Link или button — чтобы компонент оставался Server-compatible
  action: React.ReactNode
}

export function ErrorContent({ code, label, message, action }: ErrorContentProps) {
  return (
    <div
      style={{
        background: 'var(--color-bg)',
        padding: '52px 44px 80px',
        minHeight: '80vh',
      }}
    >
      {/* Лейбл — зеркало "РЕЗУЛЬТАТЫ ПОИСКА" из страницы поиска */}
      <div
        className="font-nav font-bold text-[11px] tracking-[0.14em] uppercase"
        style={{ color: 'var(--color-caption)', marginBottom: '12px' }}
      >
        {label}
      </div>

      {/* Код ошибки — зеркало большого «запроса» из страницы поиска */}
      <div
        className="font-display font-bold lowercase"
        style={{
          fontSize: 'clamp(56px, 6vw, 96px)',
          lineHeight: '1.0',
          letterSpacing: '-0.015em',
          color: 'var(--color-text)',
          margin: '0 0 16px',
        }}
      >
        {code}
      </div>

      <p
        className="font-body"
        style={{
          fontWeight: 300,
          fontSize: '15px',
          color: 'var(--color-caption)',
          marginBottom: '32px',
        }}
      >
        {message}
      </p>

      {action}
    </div>
  )
}
