import { prisma } from '@/shared/lib/prisma'
import type { Category, CategoryHeroBg } from './types'

export async function getPublicCategories(): Promise<Category[]> {
  return prisma.category.findMany({ orderBy: { order: 'asc' } })
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  return prisma.category.findUnique({ where: { slug } })
}

export async function getCategoryHeroBg(category: Category): Promise<CategoryHeroBg> {
  const post = await prisma.post.findFirst({
    where: {
      status: 'PUBLISHED',
      categories: { some: { id: category.id } },
    },
    orderBy: { publishedAt: 'desc' },
    select: { body: true },
  })

  if (post) {
    const body = post.body as { blocks?: { type: string; s3Key?: string; photos?: { s3Key: string }[] }[] }
    const blocks = Array.isArray(body) ? body : (body?.blocks ?? [])

    const photoBlock = blocks.find(b => b.type === 'photo' || b.type === 'panorama')
    const gridBlock = blocks.find(b => b.type === 'photoGrid')

    if (photoBlock?.s3Key) return { type: 'image', s3Key: photoBlock.s3Key }
    if (gridBlock?.photos?.[0]?.s3Key) return { type: 'image', s3Key: gridBlock.photos[0].s3Key }
  }

  if (category.gradientCss) return { type: 'gradient', css: category.gradientCss }
  return { type: 'default' }
}
