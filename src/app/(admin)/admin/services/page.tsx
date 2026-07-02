export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ServicesPage } from '@/features/services/ui/ServicesPage'

export default async function ServicesRoute() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/admin/login')
  return <ServicesPage />
}
