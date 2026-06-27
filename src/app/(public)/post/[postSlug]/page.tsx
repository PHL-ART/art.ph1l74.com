import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Image from 'next/image'
import { getPostBySlug } from '@/entities/post/queries'
import { BlockRenderer } from '@/entities/post/ui/BlockRenderer'
import { ReadingProgress, SocialLinks, Tag } from '@/shared/ui'
import { getPostUrl } from '@/shared/lib/getPostUrl'

export const revalidate = 300

interface Props {
  params: { postSlug: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getPostBySlug(params.postSlug)
  if (!post) return {}
  return {
    title: `${post.title} — PHL·ART`,
    openGraph: {
      title: post.title,
      images: post.coverImageKey ? [getPostUrl(post.coverImageKey)] : [],
    },
  }
}

export default async function PostPage({ params }: Props) {
  const post = await getPostBySlug(params.postSlug)
  if (!post) notFound()

  const date = post.publishedAt
    ? new Intl.DateTimeFormat('ru', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(new Date(post.publishedAt))
    : null

  return (
    <>
      <ReadingProgress />

      <article>
        {/* Hero: cover image with dark gradient overlay */}
        {post.coverImageKey && (
          <div className="relative w-full aspect-[16/9] md:aspect-[21/9] overflow-hidden">
            <Image
              src={getPostUrl(post.coverImageKey)}
              alt={post.title}
              fill
              priority
              className="object-cover"
              sizes="100vw"
            />
            {/* Dark gradient overlay — bottom-to-top fade to bg color */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-bg" />
          </div>
        )}

        <div className="max-w-3xl mx-auto px-5 md:px-12 py-10 md:py-16">
          {/* Post header */}
          <header className="mb-10">
            {/* Categories */}
            {post.categories.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {post.categories.map(cat => (
                  <Tag key={cat.id} href={`/${cat.slug}`}>
                    {cat.name}
                  </Tag>
                ))}
              </div>
            )}

            {/* Title — lowercase Manrope 700 */}
            <h1 className="font-display font-bold text-text text-3xl md:text-[42px] lowercase tracking-tight leading-tight mb-4">
              {post.title}
            </h1>

            {/* Date + tags row */}
            <div className="flex flex-wrap gap-4 items-center">
              {date && (
                <time
                  dateTime={post.publishedAt ? new Date(post.publishedAt).toISOString() : undefined}
                  className="font-body text-sm text-caption"
                >
                  {date}
                </time>
              )}
              {post.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {post.tags.map(tag => (
                    <Tag key={tag.id} href={`/search?q=${encodeURIComponent(tag.name)}`}>
                      {tag.name}
                    </Tag>
                  ))}
                </div>
              )}
            </div>
          </header>

          {/* Body blocks */}
          <BlockRenderer blocks={post.body} />

          {/* Social links at the end */}
          <SocialLinks links={post.socialLinks} />
        </div>
      </article>
    </>
  )
}
