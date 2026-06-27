import { revalidatePath } from 'next/cache'
import { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token || token !== process.env.REVALIDATE_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  let paths: string[]
  try {
    const body = await req.json()
    paths = body.paths
    if (!Array.isArray(paths)) throw new Error()
  } catch {
    return Response.json({ error: 'Invalid body. Expected { paths: string[] }' }, { status: 400 })
  }
  for (const path of paths) revalidatePath(path)
  return Response.json({ revalidated: true, paths })
}
