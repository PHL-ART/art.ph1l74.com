import { getServerSession } from 'next-auth'
import { NextRequest } from 'next/server'
import { authOptions } from '@/lib/auth'
import { getCalendarPosts, getArchivePosts, getAllPostsForArchive, type ArchiveFilters } from '@/features/admin/queries'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const mode = searchParams.get('mode')

  if (mode === 'archive') {
    const filters: ArchiveFilters = {
      search: searchParams.get('search') ?? undefined,
      status: searchParams.get('status') ?? undefined,
      categorySlug: searchParams.get('category') ?? undefined,
      tagSlug: searchParams.get('tag') ?? undefined,
    }
    const posts = await getAllPostsForArchive(filters)
    return Response.json({ posts })
  }

  const yearRaw = searchParams.get('year')
  const monthRaw = searchParams.get('month')

  const year = yearRaw ? parseInt(yearRaw, 10) : new Date().getFullYear()
  const month = monthRaw ? parseInt(monthRaw, 10) : new Date().getMonth() + 1

  if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
    return Response.json({ error: 'Invalid year or month' }, { status: 400 })
  }

  const [calendarPosts, archivePosts] = await Promise.all([
    getCalendarPosts(year, month),
    getArchivePosts(),
  ])

  return Response.json({ calendarPosts, archivePosts })
}
