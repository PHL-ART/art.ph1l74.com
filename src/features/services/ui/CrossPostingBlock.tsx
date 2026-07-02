'use client'

import { useState } from 'react'

interface Service {
  id: string
  name: string
  slug: string
  iconUrl: string | null
  type: string
}

interface Props {
  services: Service[]
  onAdd: (data: { name: string; slug: string; apiToken: string }) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

export function CrossPostingBlock({ services, onAdd, onDelete }: Props) {
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [token, setToken] = useState('')
  const [adding, setAdding] = useState(false)
  const [showForm, setShowForm] = useState(false)

  async function handleAdd() {
    if (!name || !slug) return
    setAdding(true)
    await onAdd({ name, slug, apiToken: token })
    setName('')
    setSlug('')
    setToken('')
    setShowForm(false)
    setAdding(false)
  }

  const fields: [string, string, (v: string) => void][] = [
    ['Название', name, setName],
    ['Slug', slug, setSlug],
    ['API токен', token, setToken],
  ]

  return (
    <div style={{ border: '1px solid rgba(255,255,255,0.1)', padding: 24 }}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display font-bold text-base m-0">Кросс-постинг</h2>
        <button
          onClick={() => setShowForm(v => !v)}
          className="font-nav font-bold text-[11px] tracking-[0.06em] uppercase"
          style={{ background: '#ff3b30', color: '#fff', border: 'none', padding: '8px 14px', cursor: 'pointer' }}
        >
          + Добавить
        </button>
      </div>

      {showForm && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            marginBottom: 20,
            padding: 16,
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          {fields.map(([label, val, setter]) => (
            <div key={label}>
              <div
                className="font-nav font-bold text-[10px] tracking-[0.08em] uppercase mb-1"
                style={{ color: 'rgba(255,255,255,0.45)' }}
              >
                {label}
              </div>
              <input
                value={val}
                onChange={e => setter(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: '#fff',
                  padding: '8px 10px',
                  fontSize: 13,
                  boxSizing: 'border-box',
                }}
              />
            </div>
          ))}
          <button
            onClick={handleAdd}
            disabled={adding}
            className="font-nav font-bold text-[11px] tracking-[0.06em] uppercase"
            style={{
              background: 'rgba(255,255,255,0.08)',
              color: '#fff',
              border: 'none',
              padding: '9px 0',
              cursor: 'pointer',
            }}
          >
            {adding ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      )}

      {services.length === 0 ? (
        <div
          className="font-body font-light text-sm"
          style={{ color: 'rgba(255,255,255,0.35)' }}
        >
          Нет подключённых сервисов
        </div>
      ) : (
        services.map(s => (
          <div
            key={s.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '11px 0',
              borderTop: '1px solid rgba(255,255,255,0.07)',
            }}
          >
            <div>
              <span className="font-display font-bold text-sm">{s.name}</span>
              <span className="font-nav text-[11px] ml-2" style={{ color: 'rgba(255,255,255,0.4)' }}>
                {s.slug}
              </span>
            </div>
            <button
              onClick={() => onDelete(s.id)}
              style={{ background: 'none', border: 'none', color: 'rgba(255,59,48,0.6)', cursor: 'pointer', fontSize: 13 }}
            >
              Удалить
            </button>
          </div>
        ))
      )}
    </div>
  )
}
