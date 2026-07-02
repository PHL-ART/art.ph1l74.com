'use client'

import { useEffect, useRef, useState } from 'react'
import { uploadToS3 } from '@/features/media/lib/uploadToS3'

interface MediaFile { id: string; key: string; filename: string; type: string }

interface Props {
  open: boolean
  onClose: () => void
  /** Called with all selected images at once. */
  onInsert: (items: { key: string; src: string }[]) => void
}

export function ImagePickerModal({ open, onClose, onInsert }: Props) {
  const [files, setFiles] = useState<MediaFile[]>([])
  const [tab, setTab] = useState<'library' | 'upload'>('library')
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set())
  const inputRef = useRef<HTMLInputElement>(null)

  const s3Base = process.env.NEXT_PUBLIC_S3_BASE_URL ?? ''

  useEffect(() => {
    if (!open) return
    setError(null)
    setSelectedKeys(new Set())
    fetch('/api/admin/media?type=IMAGE').then(r => r.json()).then(d => setFiles(d.files ?? []))
  }, [open])

  if (!open) return null

  function toggleSelect(key: string) {
    setSelectedKeys(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  function handleInsertSelected() {
    const items = files
      .filter(f => selectedKeys.has(f.key))
      .map(f => ({ key: f.key, src: `${s3Base}/${f.key}` }))
    if (items.length === 0) return
    onInsert(items)
    onClose()
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files
    if (!selected?.length) return
    setError(null)
    const arr = Array.from(selected)
    const inserted: { key: string; src: string }[] = []
    for (let i = 0; i < arr.length; i++) {
      setProgress({ current: i + 1, total: arr.length })
      const result = await uploadToS3(arr[i])
      if (result.success && result.key) {
        inserted.push({ key: result.key, src: `${s3Base}/${result.key}` })
      }
    }
    setProgress(null)
    if (inputRef.current) inputRef.current.value = ''
    if (inserted.length > 0) {
      onInsert(inserted)
      onClose()
    }
  }

  const uploading = progress !== null

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div style={{ background: '#0e0a0b', border: '1px solid rgba(255,255,255,0.12)', width: 640, maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
        <div className="flex items-center justify-between p-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex gap-1">
            {(['library', 'upload'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="font-nav font-bold text-[11px] tracking-[0.06em] uppercase"
                style={{ padding: '6px 12px', background: tab === t ? 'rgba(255,255,255,0.08)' : 'transparent', border: 'none', color: tab === t ? '#fff' : 'rgba(255,255,255,0.45)', cursor: 'pointer' }}
              >
                {t === 'library' ? 'Медиатека' : 'Загрузить'}
              </button>
            ))}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 20 }}>×</button>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
          {tab === 'library' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 10 }}>
              {files.map(file => {
                const isSelected = selectedKeys.has(file.key)
                return (
                  <div
                    key={file.id}
                    onClick={() => toggleSelect(file.key)}
                    style={{
                      cursor: 'pointer',
                      border: isSelected ? '2px solid #ff3b30' : '2px solid rgba(255,255,255,0.1)',
                      position: 'relative',
                      transition: 'border-color 0.15s',
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`${s3Base}/${file.key}`} alt={file.filename} style={{ width: '100%', height: 90, objectFit: 'cover', display: 'block' }} />
                    {isSelected && (
                      <div style={{
                        position: 'absolute', top: 6, right: 6,
                        width: 20, height: 20, borderRadius: '50%',
                        background: '#ff3b30', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <path d="M2 5l2 2 4-4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    )}
                    <div className="font-nav text-[9px]" style={{ padding: '4px 6px', color: 'rgba(255,255,255,0.5)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {file.filename}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {tab === 'upload' && (
            <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 200, border: '2px dashed rgba(255,255,255,0.2)', cursor: uploading ? 'default' : 'pointer', gap: 12 }}>
              <span className="font-body font-light text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                {uploading
                  ? `Загрузка ${progress.current} из ${progress.total}...`
                  : 'Нажмите для выбора файлов'}
              </span>
              {error && (
                <span className="font-body font-light text-xs" style={{ color: '#ff5a4a' }}>{error}</span>
              )}
              <input
                ref={inputRef}
                type="file"
                multiple
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleUpload}
                disabled={uploading}
              />
            </label>
          )}
        </div>

        {/* Footer: insert selected button */}
        {tab === 'library' && selectedKeys.size > 0 && (
          <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={handleInsertSelected}
              className="font-nav font-bold text-[11px] tracking-[0.06em] uppercase"
              style={{ background: '#ff3b30', color: '#fff', border: 'none', padding: '9px 20px', cursor: 'pointer' }}
            >
              Вставить {selectedKeys.size > 1 ? `(${selectedKeys.size})` : ''}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
