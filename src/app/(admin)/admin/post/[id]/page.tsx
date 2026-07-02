export const dynamic = 'force-dynamic'

import { redirect, notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/shared/lib/prisma'
import { PostEditor } from '@/features/editor/ui/PostEditor'

export default async function PostEditorPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/admin/login')

  const [post, allCategories, allTags] = await Promise.all([
    prisma.post.findUnique({
      where: { id: params.id },
      include: {
        categories: { select: { id: true, name: true } },
        tags: { select: { id: true, name: true } },
      },
    }),
    prisma.category.findMany({ select: { id: true, name: true }, orderBy: { order: 'asc' } }),
    prisma.tag.findMany({ select: { id: true, name: true } }),
  ])

  if (!post) notFound()

  return (
    <PostEditor
      post={{
        id: post.id,
        title: post.title,
        slug: post.slug,
        body: post.body as { blocks: unknown[] },
        status: post.status,
        isFeatured: post.isFeatured,
        coverImageKey: post.coverImageKey,
        categories: post.categories,
        tags: post.tags,
      }}
      allCategories={allCategories}
      allTags={allTags}
    />
  )
}
