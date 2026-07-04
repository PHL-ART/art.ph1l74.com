import type { CrossPostProvider, CrossPostPayload, SocialConfig, CrossPostResult } from '../types'

const THREADS = 'https://graph.threads.net/v1.0'

function buildCaption(payload: CrossPostPayload): string {
  const hashtags = payload.tags.map(t => `#${t}`).join(' ')
  const raw = `${payload.title}\n\n${payload.postUrl}\n\n${hashtags}`
  return raw.length > 500 ? raw.slice(0, 499) + '…' : raw
}

async function threadsPost(path: string, params: Record<string, string>): Promise<unknown> {
  const body = new URLSearchParams(params)
  const res = await fetch(`${THREADS}${path}`, { method: 'POST', body })
  const data = (await res.json()) as {
    id?: string
    error?: { message: string }
  }
  if (data.error) throw new Error(`Threads ${path}: ${data.error.message}`)
  return data
}

export const threadsProvider: CrossPostProvider = {
  slug: 'threads',
  async post(payload: CrossPostPayload, config: SocialConfig): Promise<CrossPostResult> {
    const { apiToken: token } = config
    const { threadsUserId } = config.config as { threadsUserId: string }
    const text = buildCaption(payload)

    try {
      let creationId: string

      if (payload.imageUrls.length <= 1) {
        const imageUrl = payload.imageUrls[0]
        if (!imageUrl) throw new Error('Threads: no images provided')
        const res = (await threadsPost(`/${threadsUserId}/threads`, {
          media_type: 'IMAGE',
          image_url: imageUrl,
          text,
          access_token: token,
        })) as { id: string }
        creationId = res.id
      } else {
        // Carousel items
        const childIds: string[] = []
        for (const imageUrl of payload.imageUrls.slice(0, 10)) {
          const item = (await threadsPost(`/${threadsUserId}/threads`, {
            media_type: 'IMAGE',
            image_url: imageUrl,
            is_carousel_item: 'true',
            access_token: token,
          })) as { id: string }
          childIds.push(item.id)
        }
        const carousel = (await threadsPost(`/${threadsUserId}/threads`, {
          media_type: 'CAROUSEL',
          children: childIds.join(','),
          text,
          access_token: token,
        })) as { id: string }
        creationId = carousel.id
      }

      // Publish
      const published = (await threadsPost(`/${threadsUserId}/threads_publish`, {
        creation_id: creationId,
        access_token: token,
      })) as { id: string }

      return {
        slug: 'threads',
        success: true,
        externalUrl: `https://www.threads.net/t/${published.id}`,
      }
    } catch (err) {
      return { slug: 'threads', success: false, error: (err as Error).message }
    }
  },
}
