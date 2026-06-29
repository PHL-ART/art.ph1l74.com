'use client'

import { useCallback, useEffect, useState } from 'react'
import { AdminSidebar } from '@/features/admin/ui/AdminSidebar'
import { MediaUploadZone } from './MediaUploadZone'
import { MediaSidebar } from './MediaSidebar'

type MediaType = 'ALL' | 'IMAGE' | 'VIDEO' | 'AUDIO'

interface MediaFile {
  id: string
  key: string
  filename: string
  size: number
  type: string
  uploadedAt: string
  posts: { id: string; title: string; slug?: string }[]
}

const FILTERS: { label: string; value: MediaType }[] = [
  { label: 'Все', value: 'ALL' },
  { label: 'Фото', value: 'IMAGE' },
  { label: 'Видео', value: 'VIDEO' },
  { label: 'Аудио', value: 'AUDIO' },
]

export function MediaLibrary() {
  const [files, setFiles] = useState<MediaFile[]>([])
  const [filter, setFilter] = useState<MediaType>('ALL')
  const [selectedFile, setSelectedFile] = useState<MediaFile | null>(null)
  const [loading, setLoading] = useState(false)

  const s3Base = process.env.NEXT_PUBLIC_S3_BASE_URL ?? ''

  const fetchFiles = useCallback(async () => {
    setLoading(true)
    const params = filter !== 'ALL' ? `?type=${filter}` : ''
    const data = await fetch(`/api/admin/media${params}`).then(r => r.json())
    setFiles(data.files ?? [])
    setLoading(false)
  }, [filter])

  useEffect(() => {
    fetchFiles()
  }, [fetchFiles])

  // When a file is deleted, clear selection if it was selected
  function handleDeleted() {
    setSelectedFile(null)
    fetchFiles()
  }

  // After replace, refresh and clear selection (the old file still exists)
  function handleReplaced() {
    setSelectedFile(null)
    fetchFiles()
  }

  return (
    <div className="flex min-h-screen" style={{ background: '#0e0a0b', color: '#fff' }}>
      <AdminSidebar />

      <div className="flex flex-col flex-1 min-w-0">
        {/* Topbar */}
        <div
          className="flex items-center justify-between px-8 py-5"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
        >
          <h1 className="font-display font-bold m-0" style={{ fontSize: 24 }}>
            Медиатека
          </h1>

          {/* Type filter buttons */}
          <div className="flex gap-1">
            {FILTERS.map(({ label, value }) => (
              <button
                key={value}
                onClick={() => setFilter(value)}
                className="font-nav font-bold text-[11px] tracking-[0.06em] uppercase"
                style={{
                  padding: '7px 14px',
                  background: filter === value ? 'rgba(255,255,255,0.08)' : 'transparent',
                  color: filter === value ? '#fff' : 'rgba(255,255,255,0.45)',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Body: grid + optional sidebar */}
        <div className="flex flex-1 min-h-0">
          <div className="flex flex-col flex-1 overflow-auto p-8 gap-6">
            <MediaUploadZone onUploaded={fetchFiles} />

            {loading ? (
              <div
                className="font-body font-light text-sm"
                style={{ color: 'rgba(255,255,255,0.4)' }}
              >
                Загрузка...
              </div>
            ) : files.length === 0 ? (
              <div
                className="font-body font-light text-sm"
                style={{ color: 'rgba(255,255,255,0.3)', marginTop: 8 }}
              >
                Нет файлов
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                  gap: 12,
                }}
              >
                {files.map(file => {
                  const src = `${s3Base}/${file.key}`
                  const isSelected = selectedFile?.id === file.id

                  return (
                    <div
                      key={file.id}
                      onClick={() => setSelectedFile(isSelected ? null : file)}
                      style={{
                        cursor: 'pointer',
                        border: isSelected
                          ? '2px solid #ff3b30'
                          : '1px solid rgba(255,255,255,0.1)',
                        background: 'rgba(255,255,255,0.03)',
                        transition: 'border-color 0.12s',
                      }}
                    >
                      {file.type === 'IMAGE' ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={src}
                          alt={file.filename}
                          style={{ width: '100%', height: 100, objectFit: 'cover', display: 'block' }}
                        />
                      ) : (
                        <div
                          style={{
                            width: '100%',
                            height: 100,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'rgba(255,255,255,0.3)',
                            fontSize: 28,
                          }}
                        >
                          {file.type === 'VIDEO' ? '▶' : '♪'}
                        </div>
                      )}
                      <div style={{ padding: '6px 8px' }}>
                        <div
                          className="font-nav font-bold text-[10px]"
                          style={{
                            color: 'rgba(255,255,255,0.7)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {file.filename}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Detail sidebar — only visible when a file is selected */}
          <MediaSidebar
            file={selectedFile}
            onClose={() => setSelectedFile(null)}
            onDeleted={handleDeleted}
            onReplaced={handleReplaced}
          />
        </div>
      </div>
    </div>
  )
}
