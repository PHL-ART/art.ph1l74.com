import { prisma } from '@/shared/lib/prisma'
import type { AdminPost } from './types'

const adminPostSelect = {
  id: true, title: true, slug: true, status: true,
  scheduledAt: true, publishedAt: true, coverImageKey: true,
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
  }))
}
