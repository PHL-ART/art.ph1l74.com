import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/shared/lib/prisma'
import { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const type = new URL(req.url).searchParams.get('type')
  const VALID_SERVICE_TYPES = ['CROSS_POSTING', 'AFTER_POSTING'] as const
  type ValidServiceType = typeof VALID_SERVICE_TYPES[number]
  const where: { type?: ValidServiceType } = type && (VALID_SERVICE_TYPES as readonly string[]).includes(type)
    ? { type: type as ValidServiceType }
    : {}
  const services = await prisma.social.findMany({
    where,
    orderBy: { createdAt: 'asc' },
    select: { id: true, name: true, slug: true, iconUrl: true, type: true, createdAt: true },
  })
  return Response.json({ services })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { name, slug, iconUrl, type, apiToken } = body
  if (!name || !slug || !type) return Response.json({ error: 'Missing fields' }, { status: 400 })

  const service = await prisma.social.create({ data: { name, slug, iconUrl, type, apiToken } })
  return Response.json({ service }, { status: 201 })
}
