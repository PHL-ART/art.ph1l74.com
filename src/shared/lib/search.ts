import { prisma } from './prisma'
import type { PostPreview } from '@/entities/post/types'

export async function searchPosts(query: string): Promise<(PostPreview & { body: unknown })[]> {
  if (!query.trim()) return []
  return prisma.post.findMany({
    where: {
      status: 'PUBLISHED',
      title: { contains: query, mode: 'insensitive' },
    },
    orderBy: { publishedAt: 'desc' },
    take: 20,
    select: {
      id: true,
      title: true,
      slug: true,
      coverImageKey: true,
      publishedAt: true,
      isFeatured: true,
      body: true,
      categories: { select: { id: true, name: true, slug: true } },
      tags: { select: { id: true, name: true, slug: true } },
    },
  })
}
