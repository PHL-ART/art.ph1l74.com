'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/shared/lib/prisma'

interface DraftData {
  title?: string
  slug?: string
  body?: { blocks: unknown[] }
  categoryIds?: string[]
  tagIds?: string[]
  coverImageKey?: string | null
  scheduledAt?: string
  isFeatured?: boolean
}

export async function saveDraft(
  postId: string,
  data: DraftData,
): Promise<{ success: boolean; error?: string }> {
  const session = await getServerSession(authOptions)
  if (!session) return { success: false, error: 'Unauthorized' }

  try {
    // Separate status check to avoid Prisma 7 P2025 bug with compound WHERE + many-to-many set
    const existing = await prisma.post.findFirst({
      where: { id: postId, status: { not: 'PUBLISHED' } },
      select: { id: true },
    })
    if (!existing) return { success: false, error: 'Post not found or already published' }

    if (data.isFeatured === true) {
      await prisma.post.updateMany({
        where: { id: { not: postId }, isFeatured: true },
        data: { isFeatured: false },
      })
    }

    await prisma.post.update({
      where: { id: postId },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.slug !== undefined && { slug: data.slug }),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ...(data.body !== undefined && { body: data.body as any }),
        ...(data.coverImageKey !== undefined && { coverImageKey: data.coverImageKey }),
        ...(data.isFeatured !== undefined && { isFeatured: data.isFeatured }),
        ...(data.scheduledAt !== undefined && {
          scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
          status: data.scheduledAt ? 'SCHEDULED' : 'DRAFT',
        }),
        ...(data.categoryIds !== undefined && {
          categories: { set: data.categoryIds.map(id => ({ id })) },
        }),
        ...(data.tagIds !== undefined && {
          tags: { set: data.tagIds.map(id => ({ id })) },
        }),
      },
    })
    return { success: true }
  } catch (err) {
    console.error('[saveDraft]', err)
    return { success: false, error: 'Failed to save draft' }
  }
}
