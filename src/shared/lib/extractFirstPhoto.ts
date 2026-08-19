type AnyBlock = {
  type: string
  s3Key?: string
  key?: string
  photos?: { s3Key?: string; key?: string }[]
}
type PostBody = { blocks?: AnyBlock[] } | AnyBlock[]

/** Returns the image key of the first photo block found in post body. Supports both old (photo/s3Key) and new (image/key) formats. */
export function extractFirstPhotoKey(body: unknown): string | null {
  if (!body || typeof body !== 'object') return null
  const raw = body as PostBody
  const blocks: AnyBlock[] = Array.isArray(raw) ? raw : (raw.blocks ?? [])

  for (const block of blocks) {
    if (block.type === 'photo' || block.type === 'panorama' || block.type === 'image') {
      const k = block.s3Key ?? block.key
      if (k) return k
    }
    if (block.type === 'photoGrid') {
      const first = block.photos?.[0]
      const k = first?.s3Key ?? first?.key
      if (k) return k
    }
  }
  return null
}
