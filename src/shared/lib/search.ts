import { prisma } from './prisma'
import type { PostPreview } from '@/entities/post/types'

type PostResult = PostPreview & { body: unknown }

const POST_SELECT = {
  id: true,
  title: true,
  slug: true,
  coverImageKey: true,
  publishedAt: true,
  isFeatured: true,
  body: true,
  categories: { select: { id: true, name: true, slug: true } },
  tags: { select: { id: true, name: true, slug: true } },
} as const

export async function searchPosts(query: string): Promise<PostResult[]> {
  if (!query.trim()) return []
  return prisma.post.findMany({
    where: {
      status: 'PUBLISHED',
      title: { contains: query, mode: 'insensitive' },
    },
    orderBy: { publishedAt: 'desc' },
    take: 20,
    select: POST_SELECT,
  })
}

export async function browsePosts(options: {
  cat?: string
  tag?: string
}): Promise<PostResult[]> {
  const { cat, tag } = options
  if (!cat && !tag) return []
  return prisma.post.findMany({
    where: {
      status: 'PUBLISHED',
      ...(cat && { categories: { some: { slug: cat } } }),
      ...(tag && { tags: { some: { slug: tag } } }),
    },
    orderBy: { publishedAt: 'desc' },
    take: 40,
    select: POST_SELECT,
  })
}
