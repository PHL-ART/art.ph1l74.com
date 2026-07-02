import { NextRequest } from 'next/server'
import { prisma } from '@/shared/lib/prisma'

export async function POST(_req: NextRequest, { params }: { params: { postSlug: string } }) {
  try {
    await prisma.post.update({
      where: { slug: params.postSlug, status: 'PUBLISHED' },
      data: { viewCount: { increment: 1 } },
    })
    return new Response(null, { status: 204 })
  } catch {
    return new Response(null, { status: 404 })
  }
}
