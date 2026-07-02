import { prisma } from '@/shared/lib/prisma'
import type { AdminPost } from './types'

export interface ArchiveFilters {
  search?: string
  status?: string
  categorySlug?: string
  tagSlug?: string
}

const adminPostSelect = {
  id: true, title: true, slug: true, status: true,
  scheduledAt: true, publishedAt: true, coverImageKey: true,
  viewCount: true, updatedAt: true,
  categories: { select: { name: true, slug: true } },
} as const

export async function getCalendarPosts(year: number, month: number): Promise<AdminPost[]> {
  const start = new Date(year, month - 1, 1)
  const end = new Date(year, month, 0, 23, 59, 59, 999)
  const posts = await prisma.post.findMany({
    where: {
      OR: [
        { publishedAt: { gte: start, lte: end } },
        { scheduledAt: { gte: start, lte: end } },
      ],
    },
    select: adminPostSelect,
    orderBy: [{ scheduledAt: 'asc' }, { publishedAt: 'asc' }],
  })
  return posts.map(p => ({
    ...p,
    status: p.status as AdminPost['status'],
    scheduledAt: p.scheduledAt?.toISOString() ?? null,
    publishedAt: p.publishedAt?.toISOString() ?? null,
    updatedAt: p.updatedAt?.toISOString() ?? null,
  }))
}

export async function getArchivePosts(): Promise<AdminPost[]> {
  const posts = await prisma.post.findMany({
    where: { status: 'PUBLISHED' },
    orderBy: { publishedAt: 'desc' },
    take: 20,
    select: adminPostSelect,
  })
  return posts.map(p => ({
    ...p,
    status: p.status as AdminPost['status'],
    scheduledAt: p.scheduledAt?.toISOString() ?? null,
    publishedAt: p.publishedAt?.toISOString() ?? null,
    updatedAt: p.updatedAt?.toISOString() ?? null,
  }))
}

export async function getAllPostsForArchive(filters: ArchiveFilters = {}): Promise<AdminPost[]> {
  const where: Record<string, unknown> = {}

  if (filters.search) {
    where.title = { contains: filters.search, mode: 'insensitive' }
  }
  if (filters.status && ['DRAFT', 'SCHEDULED', 'PUBLISHED'].includes(filters.status)) {
    where.status = filters.status
  }
  if (filters.categorySlug) {
    where.categories = { some: { slug: filters.categorySlug } }
  }
  if (filters.tagSlug) {
    where.tags = { some: { slug: filters.tagSlug } }
  }

  const posts = await prisma.post.findMany({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    where: where as any,
    select: adminPostSelect,
    orderBy: { updatedAt: 'desc' },
    take: 100,
  })

  return posts.map(p => ({
    ...p,
    status: p.status as AdminPost['status'],
    scheduledAt: p.scheduledAt?.toISOString() ?? null,
    publishedAt: p.publishedAt?.toISOString() ?? null,
    updatedAt: p.updatedAt?.toISOString() ?? null,
  }))
}
