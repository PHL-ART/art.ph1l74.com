'use client'

import { useCallback, useEffect, useState } from 'react'
import { AdminSidebar } from '@/features/admin/ui/AdminSidebar'
import { CrossPostingBlock } from './CrossPostingBlock'
import { AfterPostingBlock } from './AfterPostingBlock'

interface Service {
  id: string
  name: string
  slug: string
  iconUrl: string | null
  type: string
}

export function ServicesPage() {
  const [crossServices, setCrossServices] = useState<Service[]>([])
  const [afterServices, setAfterServices] = useState<Service[]>([])

  const fetchAll = useCallback(async () => {
    const [cross, after] = await Promise.all([
      fetch('/api/admin/services?type=CROSS_POSTING').then(r => r.json()),
      fetch('/api/admin/services?type=AFTER_POSTING').then(r => r.json()),
    ])
    setCrossServices(cross.services ?? [])
    setAfterServices(after.services ?? [])
  }, [])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  async function handleAddCross(data: { name: string; slug: string; apiToken: string }) {
    await fetch('/api/admin/services', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, type: 'CROSS_POSTING' }),
    })
    fetchAll()
  }

  async function handleAddAfter(data: { name: string; slug: string; iconUrl?: string }) {
    await fetch('/api/admin/services', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, type: 'AFTER_POSTING' }),
    })
    fetchAll()
  }

  async function handleDelete(id: string) {
    await fetch(`/api/admin/services/${id}`, { method: 'DELETE' })
    fetchAll()
  }

  return (
    <div className="flex min-h-screen" style={{ background: '#0e0a0b', color: '#fff' }}>
      <AdminSidebar />
      <div className="flex flex-col flex-1 min-w-0">
        {/* Page header */}
        <div
          className="px-8 py-5"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
        >
          <h1 className="font-display font-bold m-0" style={{ fontSize: 24 }}>
            Сервисы
          </h1>
        </div>

        {/* Two-column grid: CrossPosting | AfterPosting */}
        <div
          style={{
            padding: '24px 32px',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 24,
            alignItems: 'start',
          }}
        >
          <CrossPostingBlock
            services={crossServices}
            onAdd={handleAddCross}
            onDelete={handleDelete}
          />
          <AfterPostingBlock
            services={afterServices}
            onAdd={handleAddAfter}
            onDelete={handleDelete}
          />
        </div>
      </div>
    </div>
  )
}
