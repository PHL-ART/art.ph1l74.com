import Image from 'next/image'
import Link from 'next/link'
import { getFeaturedPost, getRecentPosts } from '@/entities/post/queries'
import { MediaCard, SectionTitle, GradientSurface } from '@/shared/ui'
import { getPostUrl } from '@/shared/lib/getPostUrl'

export const revalidate = 60

export default async function HomePage() {
  const [featured, recent] = await Promise.all([getFeaturedPost(), getRecentPosts(12)])

  return (
    <div className="max-w-7xl mx-auto px-5 md:px-12 py-10 md:py-16">
      {featured && (
        <section className="mb-16 md:mb-20">
          <Link href={`/post/${featured.slug}`} className="group block">
            <GradientSurface className="relative rounded-[2px] overflow-hidden min-h-[420px] md:min-h-[560px]">
              {featured.coverImageKey && (
                <Image
                  src={getPostUrl(featured.coverImageKey)}
                  alt={featured.title}
                  fill
                  priority
                  className="object-cover opacity-70 group-hover:opacity-80 transition-opacity duration-300"
                  sizes="100vw"
                />
              )}
              <div className="relative z-10 p-8 md:p-12 flex flex-col justify-end h-full min-h-[420px] md:min-h-[560px] bg-gradient-to-t from-[rgba(0,0,0,0.7)] via-transparent to-transparent">
                {featured.categories.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {featured.categories.map(cat => (
                      <span key={cat.id} className="font-nav uppercase tracking-widest text-[10px] text-white/60">
                        {cat.name}
                      </span>
                    ))}
                  </div>
                )}
                <h1 className="font-display font-bold text-white text-3xl md:text-5xl lowercase tracking-tight leading-tight max-w-2xl">
                  {featured.title}
                </h1>
                {featured.publishedAt && (
                  <p className="mt-3 font-body text-sm text-white/50">
                    {new Intl.DateTimeFormat('ru', { day: 'numeric', month: 'long', year: 'numeric' }).format(
                      new Date(featured.publishedAt)
                    )}
                  </p>
                )}
              </div>
            </GradientSurface>
          </Link>
        </section>
      )}

      {recent.length > 0 && (
        <section>
          <SectionTitle className="mb-8">последние материалы</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {recent.map(post => (
              <MediaCard
                key={post.id}
                title={post.title}
                slug={post.slug}
                coverImageKey={post.coverImageKey}
                publishedAt={post.publishedAt}
                categories={post.categories}
              />
            ))}
          </div>
        </section>
      )}

      {!featured && recent.length === 0 && (
        <div className="text-center py-32">
          <p className="font-body text-caption">Публикации появятся здесь</p>
        </div>
      )}
    </div>
  )
}
