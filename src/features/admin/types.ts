export type AdminPostStatus = 'DRAFT' | 'SCHEDULED' | 'PUBLISHED'

export interface AdminPost {
  id: string
  title: string
  slug: string
  status: AdminPostStatus
  scheduledAt: string | null   // ISO 8601
  publishedAt: string | null   // ISO 8601
  coverImageKey: string | null
  viewCount: number
  updatedAt: string | null      // ISO 8601
  categories: { name: string; slug: string }[]
}
