'use server'

import { getServerSession } from 'next-auth'
import { revalidatePath } from 'next/cache'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/shared/lib/prisma'

async function crossPostToChannels(
  postId: string,
  channels: { vk: boolean; tg: boolean }
): Promise<void> {
  // Future: dispatch to registered cross-posting providers
  console.log('[crosspost] postId=%s channels=%j', postId, channels)
}

export async function publishPost(
  postId: string,
  channels: { vk: boolean; tg: boolean }
): Promise<{ success: boolean; error?: string }> {
  const session = await getServerSession(authOptions)
  if (!session) return { success: false, error: 'Unauthorized' }

  try {
    const post = await prisma.post.update({
      where: { id: postId },
      data: {
        status: 'PUBLISHED',
        publishedAt: new Date(),
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
