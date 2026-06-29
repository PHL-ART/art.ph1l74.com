'use client'

import { useState } from 'react'
import { deleteMedia } from '@/features/media/actions/deleteMedia'
import { uploadMedia } from '@/features/media/actions/uploadMedia'

interface MediaFileDetail {
  id: string
  key: string
  filename: string
  size: number
  type: string
  uploadedAt: string
  posts: { id: string; title: string; slug?: string }[]
}

interface Props {
  file: MediaFileDetail | null
  onClose: () => void
  onDeleted: () => void
  onReplaced: () => void
}

export function MediaSidebar({ file, onClose, onDeleted, onReplaced }: Props) {
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [replacing, setReplacing] = useState(false)

  if (!file) return null

  const s3Base = process.env.NEXT_PUBLIC_S3_BASE_URL ?? ''
  const url = `${s3Base}/${file.key}`

  async function handleDelete() {
    setDeleting(true)
    setDeleteError(null)
    const result = await deleteMedia(file!.id)
    setDeleting(false)
    if (result.success) {
      onDeleted()
      onClose()
    } else {
      setDeleteError(result.error ?? 'Ошибка')
    }
  }

  async function handleReplace(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setReplacing(true)
    // Upload a new file to a new key; old file remains in S3 / DB
    const fd = new FormData()
    fd.append('file', f)
    await uploadMedia(fd)
    setReplacing(false)
    onReplaced()
  }

  const sizeKb = Math.round(file.size / 1024)

  return (
    <div
      style={{
        width: 280,
        flexShrink: 0,
        borderLeft: '1px solid rgba(255,255,255,0.08)',
        background: '#0a0708',
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        overflowY: 'auto',
      }}
    >
      {/* Header */}
      <div className="flex justify-between items-start">
        <span
          className="font-nav font-bold text-[11px] tracking-[0.08em] uppercase"
          style={{ color: 'rgba(255,255,255,0.5)' }}
        >
          Детали
        </span>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: 'rgba(255,255,255,0.4)',
            cursor: 'pointer',
            fontSize: 18,
            lineHeight: 1,
          }}
        >
          ×
        </button>
      </div>

      {/* Preview */}
      {file.type === 'IMAGE' && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt={file.filename}
          style={{ width: '100%', height: 160, objectFit: 'cover' }}
        />
      )}
      {file.type === 'VIDEO' && (
        <div
          style={{
            width: '100%',
            height: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(255,255,255,0.04)',
            color: 'rgba(255,255,255,0.3)',
            fontSize: 28,
          }}
        >
          ▶
        </div>
      )}
      {file.type === 'AUDIO' && (
        <div
          style={{
            width: '100%',
            height: 60,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(255,255,255,0.04)',
            color: 'rgba(255,255,255,0.3)',
            fontSize: 24,
          }}
        >
          ♪
        </div>
      )}

      {/* Meta */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div
          className="font-display font-bold text-sm"
          style={{ wordBreak: 'break-all' }}
        >
          {file.filename}
        </div>
        <div
          className="font-body font-light text-xs"
          style={{ color: 'rgba(255,255,255,0.45)' }}
        >
          {sizeKb} KB · {file.type}
        </div>
      </div>

      {/* Usage in posts */}
      {file.posts.length > 0 && (
        <div>
          <div
            className="font-nav font-bold text-[10px] tracking-[0.08em] uppercase"
            style={{ color: 'rgba(255,255,255,0.45)', marginBottom: 8 }}
          >
            Используется в статьях
          </div>
          {file.posts.map(p => (
            <div
              key={p.id}
              className="font-body font-light text-xs"
              style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 4 }}
            >
              {p.title || 'Без названия'}
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 'auto' }}>
        <button
          onClick={() => navigator.clipboard.writeText(url)}
          className="font-nav font-bold text-[11px] tracking-[0.05em] uppercase"
          style={{
            padding: '9px 0',
            background: 'rgba(255,255,255,0.06)',
            border: 'none',
            color: '#fff',
            cursor: 'pointer',
            width: '100%',
          }}
        >
          Скопировать ссылку
        </button>

        <label
          className="font-nav font-bold text-[11px] tracking-[0.05em] uppercase"
          style={{
            padding: '9px 0',
            background: 'rgba(255,255,255,0.06)',
            color: '#fff',
            cursor: 'pointer',
            width: '100%',
            textAlign: 'center',
            display: 'block',
          }}
        >
          {replacing ? 'Загрузка...' : 'Загрузить новый'}
          <input
            type="file"
            accept="image/*,video/*,audio/*"
            style={{ display: 'none' }}
            onChange={handleReplace}
          />
        </label>

        {deleteError && (
          <div
            className="font-body font-light text-xs"
            style={{ color: '#ff5a4a' }}
          >
            {deleteError}
          </div>
        )}

        <button
          onClick={handleDelete}
          disabled={deleting}
          className="font-nav font-bold text-[11px] tracking-[0.05em] uppercase"
          style={{
            padding: '9px 0',
            background: 'rgba(255,59,48,0.12)',
            border: '1px solid rgba(255,59,48,0.3)',
            color: '#ff5a4a',
            cursor: deleting ? 'default' : 'pointer',
            width: '100%',
            opacity: deleting ? 0.6 : 1,
          }}
        >
          {deleting ? 'Удаление...' : 'Удалить'}
        </button>
      </div>
    </div>
  )
}
