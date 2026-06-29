'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/shared/lib/prisma'

type MediaType = 'IMAGE' | 'VIDEO' | 'AUDIO'

function inferType(contentType: string): MediaType {
  if (contentType.startsWith('video/')) return 'VIDEO'
  if (contentType.startsWith('audio/')) return 'AUDIO'
  return 'IMAGE'
}

/** Called after the client has successfully PUT the file directly to S3. */
export async function registerMedia(params: {
  key: string
  filename: string
  size: number
  contentType: string
}): Promise<{ success: boolean; key?: string; error?: string }> {
  const session = await getServerSession(authOptions)
  if (!session) return { success: false, error: 'Unauthorized' }

  const { key, filename, size, contentType } = params

  try {
    const existing = await prisma.mediaFile.findUnique({ where: { key }, select: { id: true } })

    if (existing) {
      // Replace flow: update metadata only, the S3 object is already overwritten
      await prisma.mediaFile.update({
        where: { key },
        data: { filename, size },
      })
    } else {
      await prisma.mediaFile.create({
        data: { key, filename, size, type: inferType(contentType) },
      })
    }

    return { success: true, key }
  } catch (err) {
    console.error('[registerMedia]', err)
    return { success: false, error: 'Failed to register media file' }
  }
}
