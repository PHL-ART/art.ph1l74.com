import type { Metadata } from 'next'
import { ReduxProvider } from '@/shared/store/provider'

export const metadata: Metadata = {
  title: 'Студия публикаций — PHL·ART',
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-theme="dark" className="min-h-screen" style={{ background: '#0e0a0b', color: '#fff' }}>
      <ReduxProvider>
        {children}
      </ReduxProvider>
    </div>
  )
}
