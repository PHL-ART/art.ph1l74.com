export const dynamic = 'force-dynamic'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/shared/lib/prisma'

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const file = await prisma.mediaFile.findUnique({
    where: { id: params.id },
    include: { posts: { select: { id: true, title: true, slug: true } } },
  })

  if (!file) return Response.json({ error: 'Not found' }, { status: 404 })
  return Response.json({ file })
}
