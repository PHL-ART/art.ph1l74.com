import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/shared/lib/prisma'

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { name, slug, iconUrl, type, apiToken, config } = body
  if (!name || !slug || !type) return Response.json({ error: 'Missing fields' }, { status: 400 })

  const service = await prisma.social.update({
    where: { id: params.id },
    data: {
      name,
      slug,
      iconUrl: iconUrl ?? null,
      type,
      apiToken: apiToken ?? null,
      config: config ?? null,
    },
  })
  return Response.json({ service })
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  await prisma.social.delete({ where: { id: params.id } })
  return new Response(null, { status: 204 })
}
