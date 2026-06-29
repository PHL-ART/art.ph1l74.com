import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/shared/lib/prisma'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

export const dynamic = 'force-dynamic'

const s3 = new S3Client({
  region: process.env.S3_REGION ?? 'default',
  endpoint: process.env.S3_ENDPOINT ? `https://${process.env.S3_ENDPOINT}` : undefined,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: true,
  requestChecksumCalculation: 'WHEN_REQUIRED',
  responseChecksumValidation: 'WHEN_REQUIRED',
})

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { filename, contentType, existingKey } = await req.json()
  if (!filename || !contentType) {
    return Response.json({ error: 'filename and contentType are required' }, { status: 400 })
  }

  // If replacing an existing file, verify it belongs to a tracked MediaFile
  if (existingKey) {
    const owned = await prisma.mediaFile.findUnique({ where: { key: existingKey }, select: { id: true } })
    if (!owned) return Response.json({ error: 'Media file not found' }, { status: 404 })
  }

  const ext = filename.split('.').pop()?.toLowerCase() ?? 'bin'
  const key = existingKey ?? `media/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const command = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET!,
    Key: key,
    ContentType: contentType,
  })

  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 3600 })
  return Response.json({ uploadUrl, key })
}
