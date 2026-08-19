import type { CrossPostProvider, CrossPostPayload, SocialConfig, CrossPostResult } from '../types'

export const tiktokProvider: CrossPostProvider = {
  slug: 'tiktok',
  // TikTok Content Posting API requires manual app approval from TikTok Developer Platform.
  // See: https://developers.tiktok.com/products/content-posting-api/
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async post(_payload: CrossPostPayload, _config: SocialConfig): Promise<CrossPostResult> {
    return {
      slug: 'tiktok',
      success: false,
      error: 'TikTok: manual setup required — app approval needed from TikTok Developer Platform',
    }
  },
}
