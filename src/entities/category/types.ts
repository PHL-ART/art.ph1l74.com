import type { Category } from '../../generated/prisma'

export type { Category }

export type CategoryHeroBg =
  | { type: 'image';    s3Key: string }
  | { type: 'gradient'; css: string }
  | { type: 'default' }
