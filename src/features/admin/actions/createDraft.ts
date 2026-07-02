'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/shared/lib/prisma'

export async function createDraft(): Promise<string> {
  const session = await getServerSession(authOptions)
  if (!session) throw new Error('Unauthorized')

  const post = await prisma.post.create({
    data: {
      title: '',
      slug: `draft-${Date.now()}`,
      body: { blocks: [] },
      status: 'DRAFT',
    },
    select: { id: true },
  })

  return post.id
}
