import { getServerSession } from 'next-auth'
import { NextRequest } from 'next/server'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/shared/lib/prisma'

export const dynamic = 'force-dynamic'

const VALID_TYPES = ['IMAGE', 'VIDEO', 'AUDIO'] as const
type ValidType = (typeof VALID_TYPES)[number]

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const type = new URL(req.url).searchParams.get('type')
  const where = type && (VALID_TYPES as readonly string[]).includes(type)
    ? { type: type as ValidType }
    : {}

  const files = await prisma.mediaFile.findMany({
    where,
    orderBy: { uploadedAt: 'desc' },
    include: { posts: { select: { id: true, title: true } } },
    take: 200,
  })

  return Response.json({ files })
}
