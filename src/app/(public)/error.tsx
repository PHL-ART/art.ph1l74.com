'use client'

import { ErrorContent } from '@/shared/ui/ErrorContent'

// Error boundary для страниц публичного раздела.
// Header + Footer поступают из (public)/layout.tsx автоматически.
export default function PublicError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <ErrorContent
      code="!"
      label="что-то пошло не так"
      message="произошла ошибка на сервере"
      action={
        <button
          onClick={reset}
          className="font-nav font-semibold text-[13px] tracking-[0.06em] uppercase"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--color-accent)',
            padding: 0,
          }}
        >
          попробовать снова
        </button>
      }
    />
  )
}
