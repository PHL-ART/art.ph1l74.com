import type { Post, Category, Tag, Social, SocialLink } from '../../generated/prisma'

export type TextBlock      = { type: 'text';      html: string }
export type PhotoBlock     = { type: 'photo';     s3Key: string; caption?: string }
export type PhotoGridBlock = { type: 'photoGrid'; columns: 2 | 3; photos: { s3Key: string; caption?: string }[] }
export type PanoramaBlock  = { type: 'panorama';  s3Key: string; caption?: string }
export type EmbedBlock     = { type: 'embed';     html: string }
export type QuoteBlock     = { type: 'quote';     text: string; author?: string }
export type HeadingBlock   = { type: 'heading';   level: 2 | 3; text: string }

export type Block =
  | TextBlock | PhotoBlock | PhotoGridBlock | PanoramaBlock
  | EmbedBlock | QuoteBlock | HeadingBlock

export type PostPreview = Pick<Post, 'id' | 'title' | 'slug' | 'coverImageKey' | 'publishedAt' | 'isFeatured'> & {
  categories: Pick<Category, 'id' | 'name' | 'slug'>[]
  tags: Pick<Tag, 'id' | 'name' | 'slug'>[]
}

export type PostFull = Post & {
  categories: Pick<Category, 'id' | 'name' | 'slug'>[]
  tags: Pick<Tag, 'id' | 'name' | 'slug'>[]
  socialLinks: (SocialLink & { social: Pick<Social, 'id' | 'name' | 'iconUrl'> })[]
  body: Block[]
}
