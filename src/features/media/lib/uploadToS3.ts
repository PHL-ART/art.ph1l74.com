import { registerMedia } from '@/features/media/actions/registerMedia'

/**
 * Upload a file directly from the browser to S3 via presigned URL,
 * then register it in the database.
 *
 * Returns the S3 key on success.
 */
export async function uploadToS3(
  file: File,
  existingKey?: string,
): Promise<{ success: boolean; key?: string; error?: string }> {
  // 1. Get presigned URL from server
  const presignRes = await fetch('/api/admin/media/presign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filename: file.name,
      contentType: file.type,
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
    headers: { 'Content-Type': file.type },
    body: file,
  })

  if (!s3Res.ok) {
    return { success: false, error: `S3 upload failed (${s3Res.status})` }
  }

  // 3. Register the file in the database
  return registerMedia({ key, filename: file.name, size: file.size, contentType: file.type })
}
