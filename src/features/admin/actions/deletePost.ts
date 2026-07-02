'use server'

import { getServerSession } from 'next-auth'
import { revalidatePath } from 'next/cache'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/shared/lib/prisma'

export async function deletePost(
  postId: string,
): Promise<{ success: boolean; error?: string }> {
  const session = await getServerSession(authOptions)
  if (!session) return { success: false, error: 'Unauthorized' }

  try {
    const post = await prisma.post.delete({
      where: { id: postId },
      select: { slug: true, categories: { select: { slug: true } } },
    })

    revalidatePath('/')
    revalidatePath(`/post/${post.slug}`)
    for (const cat of post.categories) revalidatePath(`/${cat.slug}`)

    return { success: true }
  } catch (err) {
    console.error('[deletePost]', err)
    return { success: false, error: 'Не удалось удалить статью' }
  }
}
