'use server'

import { getServerSession } from 'next-auth'
import { revalidatePath } from 'next/cache'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/shared/lib/prisma'

async function crossPostToChannels(
  postId: string,
  channels: Record<string, boolean>
): Promise<void> {
  console.log('[crosspost] postId=%s channels=%j', postId, channels)
}

export async function publishPost(
  postId: string,
  channels: Record<string, boolean>,
  scheduledAt?: string,
): Promise<{ success: boolean; error?: string }> {
  const session = await getServerSession(authOptions)
  if (!session) return { success: false, error: 'Unauthorized' }

  try {
    // Separate status check to avoid Prisma 7 P2025 bug with compound WHERE on update
    const existing = await prisma.post.findFirst({
      where: { id: postId, status: { not: 'PUBLISHED' } },
      select: { id: true },
    })
    if (!existing) return { success: false, error: 'Post not found or already published' }

    if (scheduledAt) {
      await prisma.post.update({
        where: { id: postId },
        data: {
          status: 'SCHEDULED',
          scheduledAt: new Date(scheduledAt),
        },
      })
      return { success: true }
    }

    const post = await prisma.post.update({
      where: { id: postId },
      data: {
        status: 'PUBLISHED',
        publishedAt: new Date(),
        scheduledAt: null,
      },
      select: {
        slug: true,
        categories: { select: { slug: true } },
      },
    })

    revalidatePath('/')
    revalidatePath(`/post/${post.slug}`)
    for (const cat of post.categories) {
      revalidatePath(`/${cat.slug}`)
    }

    await crossPostToChannels(postId, channels)

    return { success: true }
  } catch (err) {
    console.error('[publishPost]', err)
    return { success: false, error: 'Failed to publish post' }
  }
}
