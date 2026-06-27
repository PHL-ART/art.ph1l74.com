import { prisma } from '@/shared/lib/prisma'
import type { PostPreview, PostFull, Block } from './types'

const categorySelect = { id: true, name: true, slug: true } as const

const postPreviewSelect = {
  id: true,
  title: true,
  slug: true,
  coverImageKey: true,
  publishedAt: true,
  isFeatured: true,
  categories: { select: categorySelect },
} as const

export async function getFeaturedPost(): Promise<PostPreview | null> {
  return prisma.post.findFirst({
    where: { status: 'PUBLISHED', isFeatured: true },
    select: postPreviewSelect,
  })
}

export async function getRecentPosts(limit: number): Promise<PostPreview[]> {
  return prisma.post.findMany({
    where: { status: 'PUBLISHED' },
    orderBy: { publishedAt: 'desc' },
    take: limit,
    select: postPreviewSelect,
  })
}

export async function getPostBySlug(slug: string): Promise<PostFull | null> {
  const post = await prisma.post.findFirst({
    where: { slug, status: 'PUBLISHED' },
    include: {
      categories: { select: categorySelect },
      tags: { select: { id: true, name: true, slug: true } },
      socialLinks: {
        include: { social: { select: { id: true, name: true, iconUrl: true } } },
        orderBy: { createdAt: 'asc' },
      },
    },
  })
  if (!post) return null
  return { ...post, body: post.body as Block[] } as PostFull
}

export async function getPostsByCategory(
  categorySlug: string,
  { page, limit }: { page: number; limit: number }
): Promise<{ posts: PostPreview[]; total: number }> {
  const where = {
    status: 'PUBLISHED' as const,
    categories: { some: { slug: categorySlug } },
  }
  const [posts, total] = await prisma.$transaction([
    prisma.post.findMany({
      where,
      orderBy: { publishedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      select: postPreviewSelect,
    }),
    prisma.post.count({ where }),
  ])
  return { posts, total }
}
