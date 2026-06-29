'use server'

import { getServerSession } from 'next-auth'
import { revalidatePath } from 'next/cache'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/shared/lib/prisma'

interface PostData {
  title?: string
  slug?: string
  body?: { blocks: unknown[] }
  categoryIds?: string[]
  tagIds?: string[]
  isFeatured?: boolean
}

export async function updatePublished(
  postId: string,
  data: PostData,
): Promise<{ success: boolean; error?: string }> {
  const session = await getServerSession(authOptions)
  if (!session) return { success: false, error: 'Unauthorized' }

  try {
    const existing = await prisma.post.findFirst({
      where: { id: postId, status: 'PUBLISHED' },
      select: { id: true, slug: true },
    })
    if (!existing) return { success: false, error: 'Published post not found' }

    await prisma.post.update({
      where: { id: postId },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.slug !== undefined && { slug: data.slug }),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ...(data.body !== undefined && { body: data.body as any }),
        ...(data.isFeatured !== undefined && { isFeatured: data.isFeatured }),
        ...(data.categoryIds !== undefined && {
          categories: { set: data.categoryIds.map(id => ({ id })) },
        }),
        ...(data.tagIds !== undefined && {
          tags: { set: data.tagIds.map(id => ({ id })) },
        }),
      },
    })

    revalidatePath('/')
    revalidatePath(`/post/${existing.slug}`)

    return { success: true }
  } catch (err) {
    console.error('[updatePublished]', err)
    return { success: false, error: 'Failed to update post' }
  }
}
