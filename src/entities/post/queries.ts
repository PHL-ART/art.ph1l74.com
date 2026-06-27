import { prisma } from '@/shared/lib/prisma'
import type { PostPreview, PostFull, Block } from './types'

const categorySelect = { id: true, name: true, slug: true } as const

const tagSelect = { id: true, name: true, slug: true } as const

const postPreviewSelect = {
  id: true,
  title: true,
  slug: true,
  coverImageKey: true,
  publishedAt: true,
  isFeatured: true,
  categories: { select: categorySelect },
  tags: { select: tagSelect },
} as const

export async function getFeaturedPost(): Promise<(PostPreview & { body: unknown }) | null> {
  return prisma.post.findFirst({
    where: { status: 'PUBLISHED', isFeatured: true },
    select: { ...postPreviewSelect, body: true },
  })
}

export async function getRecentPosts(limit: number, offset = 0): Promise<PostPreview[]> {
  return prisma.post.findMany({
    where: { status: 'PUBLISHED', isFeatured: false },
    orderBy: { publishedAt: 'desc' },
    take: limit,
    skip: offset,
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
  const rawBody = post.body as { blocks?: Block[] } | Block[]
  const blocks: Block[] = Array.isArray(rawBody) ? rawBody : (rawBody?.blocks ?? [])
  return { ...post, body: blocks } as PostFull
}

export async function getPostsByCategory(
  categorySlug: string,
  { page, limit }: { page: number; limit: number }
): Promise<{ posts: (PostPreview & { body: unknown })[]; total: number }> {
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
      select: { ...postPreviewSelect, body: true },
    }),
    prisma.post.count({ where }),
  ])
  return { posts, total }
}
