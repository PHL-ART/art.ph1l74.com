import imageCompression from 'browser-image-compression'
import { registerMedia } from '@/features/media/actions/registerMedia'

const COMPRESS_OPTIONS = {
  maxSizeMB: 1.5,
  maxWidthOrHeight: 2400,
  useWebWorker: true,
  fileType: 'image/jpeg' as const,
}

async function maybeCompress(file: File): Promise<File> {
  if (!file.type.startsWith('image/') || file.type === 'image/gif') return file
  try {
    const compressed = await imageCompression(file, COMPRESS_OPTIONS)
    // Only use compressed version if it's actually smaller
    return compressed.size < file.size ? compressed : file
  } catch {
    return file
  }
}

export async function uploadToS3(
  file: File,
  existingKey?: string,
): Promise<{ success: boolean; key?: string; error?: string }> {
  const uploadFile = await maybeCompress(file)

  // 1. Get presigned URL from server
  const presignRes = await fetch('/api/admin/media/presign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filename: file.name,
      contentType: uploadFile.type,
      ...(existingKey ? { existingKey } : {}),
    }),
  })

  if (!presignRes.ok) {
    const { error } = await presignRes.json().catch(() => ({}))
    return { success: false, error: error ?? 'Failed to get upload URL' }
  }

  const { uploadUrl, key } = await presignRes.json()

  // 2. PUT the file directly to S3 (browser → S3, bypasses Next.js)
  const s3Res = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': uploadFile.type },
    body: uploadFile,
  })

  if (!s3Res.ok) {
    return { success: false, error: `S3 upload failed (${s3Res.status})` }
  }

  // 3. Register the file in the database
  return registerMedia({ key, filename: file.name, size: uploadFile.size, contentType: uploadFile.type })
}
