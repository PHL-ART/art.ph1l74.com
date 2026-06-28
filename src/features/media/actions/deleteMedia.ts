'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/shared/lib/prisma'
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3'

// S3-compatible client configured for custom endpoint (firstvds / other providers)
const s3 = new S3Client({
  region: process.env.S3_REGION ?? 'default',
  endpoint: process.env.S3_ENDPOINT
    ? `https://${process.env.S3_ENDPOINT}`
    : undefined,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
  },
  // Required for non-AWS S3-compatible services
  forcePathStyle: true,
})

export async function deleteMedia(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  const session = await getServerSession(authOptions)
  if (!session) return { success: false, error: 'Unauthorized' }

  // Load the file with its linked posts to check for usage
  const file = await prisma.mediaFile.findUnique({
    where: { id },
    include: { posts: { select: { id: true } } },
  })

  if (!file) return { success: false, error: 'Not found' }

  if (file.posts.length > 0) {
    return {
      success: false,
      error: `Используется в ${file.posts.length} статьях`,
    }
  }

  await s3.send(
    new DeleteObjectCommand({
      Bucket: process.env.S3_BUCKET!,
      Key: file.key,
    }),
  )

  await prisma.mediaFile.delete({ where: { id } })
  return { success: true }
}
