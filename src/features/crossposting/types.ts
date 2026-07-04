export interface CrossPostPayload {
  title: string
  tags: string[]      // raw tag slugs from DB
  imageUrls: string[] // full S3 URLs, max 10
  postUrl: string     // https://ph1l74.art/post/{slug}
}

export interface SocialConfig {
  apiToken: string
  config: Record<string, string>
}

export interface CrossPostResult {
  slug: string
  success: boolean
  externalUrl?: string
  error?: string
}

export interface CrossPostProvider {
  slug: string
  post(payload: CrossPostPayload, config: SocialConfig): Promise<CrossPostResult>
}
