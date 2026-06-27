import { Header } from '@/shared/ui/Header'
import { Footer } from '@/shared/ui/Footer'
import { getPublicCategories } from '@/entities/category/queries'

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const categories = await getPublicCategories()
  return (
    <>
      <Header categories={categories} />
      <main className="min-h-screen">{children}</main>
      <Footer />
    </>
  )
}
