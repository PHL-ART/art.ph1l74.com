'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/shared/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function deleteDraft(postId: string): Promise<{ success: boolean; error?: string }> {
  const session = await getServerSession(authOptions)
  if (!session) return { success: false, error: 'Unauthorized' }

  try {
    const post = await prisma.post.findUnique({ where: { id: postId }, select: { status: true } })
    if (!post || post.status === 'PUBLISHED') {
      return { success: false, error: 'Cannot delete published post' }
    }
    await prisma.post.delete({ where: { id: postId } })
    revalidatePath('/admin/dashboard')
    return { success: true }
  } catch (err) {
    console.error('[deleteDraft]', err)
    return { success: false, error: 'Failed to delete' }
  }
}
