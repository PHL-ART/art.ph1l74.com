import { NextRequest } from 'next/server'
import { searchPosts } from '@/shared/lib/search'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q') ?? ''
  const posts = await searchPosts(q)
  return Response.json({ posts, total: posts.length })
}
