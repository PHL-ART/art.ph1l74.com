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
  onAdd: (data: { name: string; slug: string; apiToken: string; config: Record<string, string> | null }) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

const SLUG_CONFIG_FIELDS: Record<string, { key: string; label: string; placeholder: string }[]> = {
  telegram: [
    { key: 'channelId', label: 'Channel ID', placeholder: '@channel или -100...' },
  ],
  vk: [
    { key: 'groupId', label: 'Group ID', placeholder: '-123456' },
    { key: 'groupSlug', label: 'Group Slug', placeholder: 'phlart' },
  ],
  instagram: [
    { key: 'instagramAccountId', label: 'Instagram Account ID', placeholder: '17841...' },
    { key: 'pageId', label: 'Facebook Page ID', placeholder: '12345...' },
  ],
  threads: [
    { key: 'threadsUserId', label: 'Threads User ID', placeholder: '12345...' },
  ],
  tiktok: [
    { key: 'openId', label: 'Open ID', placeholder: '...' },
  ],
}

export function CrossPostingBlock({ services, onAdd, onDelete }: Props) {
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [token, setToken] = useState('')
  const [adding, setAdding] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [selectedSlug, setSelectedSlug] = useState('')
  const [configValues, setConfigValues] = useState<Record<string, string>>({})

  async function handleAdd() {
    if (!name || !slug) return
    setAdding(true)
    const body = {
      name,
      slug,
      type: 'CROSS_POSTING',
      apiToken: token || null,
      config: Object.keys(configValues).length > 0 ? configValues : null,
    }
    await onAdd({ name, slug, apiToken: token, config: body.config })
    setName('')
    setSlug('')
    setToken('')
    setShowForm(false)
    setAdding(false)
    setSelectedSlug('')
    setConfigValues({})
  }

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
          {/* Название */}
          <div>
            <div
              className="font-nav font-bold text-[10px] tracking-[0.08em] uppercase mb-1"
              style={{ color: 'rgba(255,255,255,0.45)' }}
            >
              Название
            </div>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
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

          {/* Slug — wired to selectedSlug */}
          <div>
            <div
              className="font-nav font-bold text-[10px] tracking-[0.08em] uppercase mb-1"
              style={{ color: 'rgba(255,255,255,0.45)' }}
            >
              Slug
            </div>
            <input
              value={slug}
              onChange={e => {
                setSlug(e.target.value)
                setSelectedSlug(e.target.value)
                setConfigValues({})
              }}
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

          {/* API токен */}
          <div>
            <div
              className="font-nav font-bold text-[10px] tracking-[0.08em] uppercase mb-1"
              style={{ color: 'rgba(255,255,255,0.45)' }}
            >
              API токен
            </div>
            <input
              value={token}
              onChange={e => setToken(e.target.value)}
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

          {/* Dynamic platform-specific config fields */}
          {selectedSlug && SLUG_CONFIG_FIELDS[selectedSlug]?.map(field => (
            <div key={field.key} style={{ marginBottom: 8 }}>
              <label
                className="font-nav font-bold text-[11px] tracking-[0.1em] uppercase"
                style={{ color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 4 }}
              >
                {field.label}
              </label>
              <input
                type="text"
                value={configValues[field.key] ?? ''}
                onChange={e => setConfigValues(prev => ({ ...prev, [field.key]: e.target.value }))}
                placeholder={field.placeholder}
                className="font-body font-light text-[13px]"
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: '#fff',
                  padding: '8px 10px',
                  outline: 'none',
                  boxSizing: 'border-box' as const,
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
