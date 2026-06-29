'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/shared/lib/prisma'

function toSlug(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
  return base ? `${base}-${Date.now()}` : `tag-${Date.now()}`
}

export async function createTag(
  name: string,
): Promise<{ id: string; name: string }> {
  const session = await getServerSession(authOptions)
  if (!session) throw new Error('Unauthorized')

  const trimmed = name.trim()
  if (!trimmed) throw new Error('Name is required')

  const tag = await prisma.tag.create({
    data: { name: trimmed, slug: toSlug(trimmed) },
    select: { id: true, name: true },
  })
  return tag
}
