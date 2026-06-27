import { Header } from '@/shared/ui/Header'
import { Footer } from '@/shared/ui/Footer'
import { BottomNav } from '@/shared/ui/BottomNav'
import { getPublicCategories } from '@/entities/category/queries'

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const categories = await getPublicCategories()
  return (
    <>
      <Header categories={categories} />
      <main className="min-h-screen pb-20 md:pb-0">{children}</main>
      <Footer />
      <BottomNav categories={categories} />
    </>
  )
}
