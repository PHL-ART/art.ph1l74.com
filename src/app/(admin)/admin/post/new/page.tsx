export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createDraft } from '@/features/admin/actions/createDraft'

export default async function NewPostPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/admin/login')

  const id = await createDraft()
  redirect(`/admin/post/${id}`)
}
