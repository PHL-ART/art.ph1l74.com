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
}

export async function saveDraft(
  postId: string,
  data: DraftData,
): Promise<{ success: boolean; error?: string }> {
  const session = await getServerSession(authOptions)
  if (!session) return { success: false, error: 'Unauthorized' }

  try {
    await prisma.post.update({
      where: { id: postId, status: { not: 'PUBLISHED' } },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.slug !== undefined && { slug: data.slug }),
        // Cast needed: Prisma expects InputJsonValue; { blocks: unknown[] } satisfies that at runtime
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ...(data.body !== undefined && { body: data.body as any }),
        ...(data.coverImageKey !== undefined && { coverImageKey: data.coverImageKey }),
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
