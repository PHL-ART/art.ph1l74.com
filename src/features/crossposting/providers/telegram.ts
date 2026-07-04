import type { CrossPostProvider, CrossPostPayload, SocialConfig, CrossPostResult } from '../types'

const API_BASE = 'https://api.telegram.org/bot'

function buildCaption(payload: CrossPostPayload): string {
  const hashtags = payload.tags.map(t => `#${t}`).join(' ')
  const raw = `${payload.title}\n\n${payload.postUrl}\n\n${hashtags}`
  return raw.slice(0, 1024)
}

async function apiCall(
  token: string,
  method: string,
  body: Record<string, unknown>,
): Promise<unknown> {
  const res = await fetch(`${API_BASE}${token}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = (await res.json()) as {
    ok: boolean
    result?: unknown
    description?: string
  }
  if (!data.ok) throw new Error(`Telegram ${method}: ${data.description}`)
  return data.result
}

export const telegramProvider: CrossPostProvider = {
  slug: 'telegram',
  async post(payload: CrossPostPayload, config: SocialConfig): Promise<CrossPostResult> {
    const { apiToken: token } = config
    const channelId = config.config.channelId

    try {
      const caption = buildCaption(payload)

      if (payload.imageUrls.length === 0) {
        await apiCall(token, 'sendMessage', { chat_id: channelId, text: caption })
        return { slug: 'telegram', success: true, externalUrl: '' }
      }

      if (payload.imageUrls.length === 1) {
        const result = (await apiCall(token, 'sendPhoto', {
          chat_id: channelId,
          photo: payload.imageUrls[0],
          caption,
        })) as { message_id: number }
        const username = channelId.startsWith('@') ? channelId.slice(1) : ''
        const externalUrl = username ? `https://t.me/${username}/${result.message_id}` : ''
        return { slug: 'telegram', success: true, externalUrl }
      }

      // Multiple images: sendMediaGroup
      const media = payload.imageUrls.slice(0, 10).map((url, i) => ({
        type: 'photo' as const,
        media: url,
        ...(i === 0 ? { caption } : {}),
      }))
      const results = (await apiCall(token, 'sendMediaGroup', {
        chat_id: channelId,
        media,
      })) as Array<{ message_id: number }>
      const firstId = results[0]?.message_id
      const username = channelId.startsWith('@') ? channelId.slice(1) : ''
      const externalUrl = username && firstId ? `https://t.me/${username}/${firstId}` : ''
      return { slug: 'telegram', success: true, externalUrl }
    } catch (err) {
      return { slug: 'telegram', success: false, error: (err as Error).message }
    }
  },
}
