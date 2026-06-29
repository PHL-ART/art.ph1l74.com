'use client'

import { useEffect, useState } from 'react'
import { uploadMedia } from '@/features/media/actions/uploadMedia'

interface MediaFile { id: string; key: string; filename: string; type: string }

interface Props {
  open: boolean
  onClose: () => void
  onSelect: (key: string, src: string) => void
}

export function ImagePickerModal({ open, onClose, onSelect }: Props) {
  const [files, setFiles] = useState<MediaFile[]>([])
  const [tab, setTab] = useState<'library' | 'upload'>('library')
  const [uploading, setUploading] = useState(false)

  const s3Base = process.env.NEXT_PUBLIC_S3_BASE_URL ?? ''

  useEffect(() => {
    if (!open) return
    fetch('/api/admin/media?type=IMAGE').then(r => r.json()).then(d => setFiles(d.files ?? []))
  }, [open])

  if (!open) return null

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    const result = await uploadMedia(fd)
    setUploading(false)
    if (result.success && result.key) {
      const src = `${s3Base}/${result.key}`
      onSelect(result.key, src)
      onClose()
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div style={{ background: '#0e0a0b', border: '1px solid rgba(255,255,255,0.12)', width: 640, maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
        <div className="flex items-center justify-between p-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex gap-1">
            {(['library', 'upload'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} className="font-nav font-bold text-[11px] tracking-[0.06em] uppercase" style={{ padding: '6px 12px', background: tab === t ? 'rgba(255,255,255,0.08)' : 'transparent', border: 'none', color: tab === t ? '#fff' : 'rgba(255,255,255,0.45)', cursor: 'pointer' }}>
                {t === 'library' ? 'Медиатека' : 'Загрузить'}
              </button>
            ))}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 20 }}>×</button>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
          {tab === 'library' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 10 }}>
              {files.map(file => (
                <div key={file.id} onClick={() => { onSelect(file.key, `${s3Base}/${file.key}`); onClose() }} style={{ cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <img src={`${s3Base}/${file.key}`} alt={file.filename} style={{ width: '100%', height: 90, objectFit: 'cover', display: 'block' }} />
                  <div className="font-nav text-[9px]" style={{ padding: '4px 6px', color: 'rgba(255,255,255,0.5)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.filename}</div>
                </div>
              ))}
            </div>
          )}
          {tab === 'upload' && (
            <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 200, border: '2px dashed rgba(255,255,255,0.2)', cursor: 'pointer', gap: 12 }}>
              <span className="font-body font-light text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>{uploading ? 'Загрузка...' : 'Нажмите для выбора файла'}</span>
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleUpload} disabled={uploading} />
            </label>
          )}
        </div>
      </div>
    </div>
  )
}
