import type { CrossPostProvider, CrossPostPayload, SocialConfig, CrossPostResult } from '../types'

const GRAPH = 'https://graph.facebook.com/v19.0'

function buildCaption(payload: CrossPostPayload): string {
  const hashtags = payload.tags.map(t => `#${t}`).join(' ')
  return `${payload.title}\n\n${payload.postUrl}\n\n${hashtags}`
}

async function graphPost(path: string, params: Record<string, string>): Promise<unknown> {
  const body = new URLSearchParams(params)
  const res = await fetch(`${GRAPH}${path}`, { method: 'POST', body })
  const data = (await res.json()) as {
    id?: string
    error?: { message: string }
  }
  if (data.error) throw new Error(`Instagram ${path}: ${data.error.message}`)
  return data
}

export const instagramProvider: CrossPostProvider = {
  slug: 'instagram',
  async post(payload: CrossPostPayload, config: SocialConfig): Promise<CrossPostResult> {
    const { apiToken: token } = config
    const { instagramAccountId } = config.config as {
      instagramAccountId: string
      pageId: string
    }
    const caption = buildCaption(payload)

    try {
      let creationId: string

      if (payload.imageUrls.length <= 1) {
        const imageUrl = payload.imageUrls[0]
        if (!imageUrl) throw new Error('Instagram: no images provided')
        const res = (await graphPost(`/${instagramAccountId}/media`, {
          image_url: imageUrl,
          caption,
          access_token: token,
        })) as { id: string }
        creationId = res.id
      } else {
        // Carousel: create items then container
        const childIds: string[] = []
        for (const imageUrl of payload.imageUrls.slice(0, 10)) {
          const item = (await graphPost(`/${instagramAccountId}/media`, {
            image_url: imageUrl,
            is_carousel_item: 'true',
            access_token: token,
          })) as { id: string }
          childIds.push(item.id)
        }
        const carousel = (await graphPost(`/${instagramAccountId}/media`, {
          media_type: 'CAROUSEL',
          children: childIds.join(','),
          caption,
          access_token: token,
        })) as { id: string }
        creationId = carousel.id
      }

      // Publish
      const published = (await graphPost(`/${instagramAccountId}/media_publish`, {
        creation_id: creationId,
        access_token: token,
      })) as { id: string }

      // Fetch permalink
      const permaRes = await fetch(
        `${GRAPH}/${published.id}?fields=permalink&access_token=${token}`,
      )
      const permaData = (await permaRes.json()) as { permalink?: string }

      return {
        slug: 'instagram',
        success: true,
        externalUrl: permaData.permalink ?? '',
      }
    } catch (err) {
      return { slug: 'instagram', success: false, error: (err as Error).message }
    }
  },
}
