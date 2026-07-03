import Link from 'next/link'
import { Header } from '@/shared/ui/Header'
import { Footer } from '@/shared/ui/Footer'
import { ErrorContent } from '@/shared/ui/ErrorContent'
import { getPublicCategories } from '@/entities/category/queries'

export default async function GlobalNotFound() {
  const categories = await getPublicCategories()

  return (
    <>
      <Header categories={categories} />
      <main style={{ maxWidth: '1440px', margin: '0 auto' }}>
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
      </main>
      <Footer />
    </>
  )
}
