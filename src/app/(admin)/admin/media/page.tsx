import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { MediaLibrary } from '@/features/media/ui/MediaLibrary'

export default async function MediaPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/admin/login')
  return <MediaLibrary />
}
