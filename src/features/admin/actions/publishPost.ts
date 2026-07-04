'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/shared/lib/prisma'
import { revalidatePath } from 'next/cache'
import { crossPostToChannels } from '@/features/crossposting/crossPostToChannels'
import type { CrossPostResult } from '@/features/crossposting/types'

export async function publishPost(
  postId: string,
  channels: Record<string, boolean>,
  scheduledAt?: string,
): Promise<{ success: boolean; error?: string; results?: CrossPostResult[] }> {
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

    const results = await crossPostToChannels(postId, channels)

    return { success: true, results }
  } catch (err) {
    console.error('[publishPost]', err)
    return { success: false, error: 'Failed to publish post' }
  }
}
