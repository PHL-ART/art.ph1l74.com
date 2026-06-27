import { NextRequest } from 'next/server'
import { getRecentPosts } from '@/entities/post/queries'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const page = Math.min(1000, Math.max(1, Number(searchParams.get('page') ?? 1)))
  const limit = Math.min(40, Math.max(1, Number(searchParams.get('limit') ?? 12)))
  const offset = (page - 1) * limit

  // Fetch one extra to know if more pages exist
  const all = await getRecentPosts(limit + 1, offset)
  const hasMore = all.length > limit
  const posts = all.slice(0, limit)

  return Response.json({ posts, hasMore })
}
