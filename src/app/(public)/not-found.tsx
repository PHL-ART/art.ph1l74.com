import Link from 'next/link'
import { ErrorContent } from '@/shared/ui/ErrorContent'

export default function NotFound() {
  return (
    <ErrorContent
      code="404"
      label="страница не найдена"
      message="такой страницы не существует"
      action={
        <Link
          href="/"
          className="font-nav font-semibold text-[13px] tracking-[0.06em] uppercase"
          style={{ color: 'var(--color-accent)' }}
        >
          ← на главную
        </Link>
      }
    />
  )
}
