import type { CrossPostProvider, CrossPostPayload, SocialConfig, CrossPostResult } from '../types'

const VK_API = 'https://api.vk.com/method'
const VK_V = '5.131'

function buildCaption(payload: CrossPostPayload, groupSlug: string): string {
  const hashtags = payload.tags.map(t => `#${t}@${groupSlug}`).join(' ')
  return `${payload.title}\n\n${payload.postUrl}\n\n${hashtags}`
}

async function vkGet(method: string, params: Record<string, string>): Promise<unknown> {
  const url = new URL(`${VK_API}/${method}`)
  Object.entries({ ...params, v: VK_V }).forEach(([k, v]) => url.searchParams.set(k, v))
  const res = await fetch(url.toString())
  const data = (await res.json()) as {
    response?: unknown
    error?: { error_msg: string }
  }
  if (data.error) throw new Error(`VK ${method}: ${data.error.error_msg}`)
  return data.response
}

async function vkPost(method: string, params: Record<string, string>): Promise<unknown> {
  const body = new URLSearchParams({ ...params, v: VK_V })
  const res = await fetch(`${VK_API}/${method}`, { method: 'POST', body })
  const data = (await res.json()) as {
    response?: unknown
    error?: { error_msg: string }
  }
  if (data.error) throw new Error(`VK ${method}: ${data.error.error_msg}`)
  return data.response
}

async function uploadPhoto(imageUrl: string, absGroupId: string, token: string): Promise<string> {
  // Get VK upload server URL
  const serverRes = (await vkGet('photos.getUploadServer', {
    group_id: absGroupId,
    access_token: token,
  })) as { upload_url: string }

  // Download image from S3
  const imgRes = await fetch(imageUrl)
  if (!imgRes.ok) throw new Error(`Failed to download image: ${imageUrl}`)
  const imgBuffer = await imgRes.arrayBuffer()
  const filename = imageUrl.split('/').pop()?.split('?')[0] ?? 'photo.jpg'

  // Upload to VK via multipart form
  const form = new FormData()
  form.append('photo', new Blob([imgBuffer], { type: 'image/jpeg' }), filename)
  const uploadRes = await fetch(serverRes.upload_url, { method: 'POST', body: form })
  const uploadData = (await uploadRes.json()) as {
    photo: string
    server: number
    hash: string
  }

  // Save photo and get attachment string
  const saved = (await vkPost('photos.saveWallPhoto', {
    group_id: absGroupId,
    photo: uploadData.photo,
    server: String(uploadData.server),
    hash: uploadData.hash,
    access_token: token,
  })) as Array<{ owner_id: number; id: number }>

  return `photo${saved[0].owner_id}_${saved[0].id}`
}

export const vkProvider: CrossPostProvider = {
  slug: 'vk',
  async post(payload: CrossPostPayload, config: SocialConfig): Promise<CrossPostResult> {
    const { apiToken: token } = config
    const { groupId, groupSlug } = config.config as { groupId: string; groupSlug: string }
    // groupId is stored as "-123456"; VK upload server needs the absolute value
    const absGroupId = groupId.replace(/^-/, '')
    const ownerId = groupId.startsWith('-') ? groupId : `-${groupId}`

    try {
      const attachments: string[] = []
      for (const imageUrl of payload.imageUrls.slice(0, 10)) {
        const attachment = await uploadPhoto(imageUrl, absGroupId, token)
        attachments.push(attachment)
      }

      const message = buildCaption(payload, groupSlug)
      const postRes = (await vkPost('wall.post', {
        owner_id: ownerId,
        message,
        attachments: attachments.join(','),
        access_token: token,
      })) as { post_id: number }

      return {
        slug: 'vk',
        success: true,
        externalUrl: `https://vk.com/wall${ownerId}_${postRes.post_id}`,
      }
    } catch (err) {
      return { slug: 'vk', success: false, error: (err as Error).message }
    }
  },
}
