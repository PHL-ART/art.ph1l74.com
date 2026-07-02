type BodyBlock = { type: string; html?: string; isLead?: boolean }
type PostBody = { blocks?: BodyBlock[] } | BodyBlock[]

/**
 * Извлекает текст лида из тела поста.
 * Сначала ищет блок с isLead=true, затем первый текстовый блок.
 * Возвращает чистый текст без HTML-тегов.
 */
export function extractLead(body: unknown): string | null {
  if (!body || typeof body !== 'object') return null

  const raw = body as PostBody
  const blocks: BodyBlock[] = Array.isArray(raw) ? raw : (raw.blocks ?? [])

  const leadBlock = blocks.find(bl => bl.type === 'text' && bl.isLead)
  const targetBlock = leadBlock ?? blocks.find(bl => bl.type === 'text')

  return targetBlock?.html?.replace(/<[^>]+>/g, '') ?? null
}
