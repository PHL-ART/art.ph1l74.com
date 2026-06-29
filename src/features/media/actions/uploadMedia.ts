'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/shared/lib/prisma'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

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
  // Required for non-AWS S3-compatible services (firstvds etc.)
  forcePathStyle: true,
  // Disable automatic checksum calculation — many S3-compatible services
  // don't support it and reset the connection mid-upload
  requestChecksumCalculation: 'WHEN_REQUIRED',
  responseChecksumValidation: 'WHEN_REQUIRED',
})

export async function uploadMedia(
  formData: FormData,
  existingKey?: string,
): Promise<{ success: boolean; key?: string; error?: string }> {
  const session = await getServerSession(authOptions)
  if (!session) return { success: false, error: 'Unauthorized' }

  const file = formData.get('file') as File | null
  if (!file) return { success: false, error: 'No file' }

  // Verify existingKey belongs to a tracked MediaFile before allowing overwrite
  if (existingKey) {
    const owned = await prisma.mediaFile.findUnique({ where: { key: existingKey }, select: { id: true } })
    if (!owned) return { success: false, error: 'Media file not found' }
  }

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'bin'
  // Reuse existing key when replacing, otherwise generate a new unique key
  const randomHex = Math.random().toString(36).slice(2)
  const key = existingKey ?? `media/${Date.now()}-${randomHex}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())

  const type = file.type.startsWith('video/')
    ? 'VIDEO'
    : file.type.startsWith('audio/')
      ? 'AUDIO'
      : 'IMAGE'

  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.S3_BUCKET!,
      Key: key,
      Body: buffer,
      ContentType: file.type,
    }),
  )

  if (existingKey) {
    // Update existing DB record metadata — S3 object is overwritten in place
    await prisma.mediaFile.update({
      where: { key: existingKey },
      data: { filename: file.name, size: file.size },
    })
  } else {
    await prisma.mediaFile.create({
      data: { key, type, filename: file.name, size: file.size },
    })
  }

  return { success: true, key }
}
