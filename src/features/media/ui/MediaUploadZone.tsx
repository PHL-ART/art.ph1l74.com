'use client'

import { useRef, useState } from 'react'
import { uploadMedia } from '@/features/media/actions/uploadMedia'

interface Props {
  onUploaded: () => void
}

export function MediaUploadZone({ onUploaded }: Props) {
  const [dragging, setDragging] = useState(false)
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return
    setError(null)
    const arr = Array.from(files)
    let failed = 0
    for (let i = 0; i < arr.length; i++) {
      setProgress({ current: i + 1, total: arr.length })
      const fd = new FormData()
      fd.append('file', arr[i])
      const result = await uploadMedia(fd)
      if (!result.success) failed++
    }
    setProgress(null)
    if (failed > 0) setError(`Не удалось загрузить ${failed} из ${arr.length} файлов`)
    onUploaded()
    // Reset so same files can be re-selected if needed
    if (inputRef.current) inputRef.current.value = ''
  }

  const uploading = progress !== null

  return (
    <div>
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => {
          e.preventDefault()
          setDragging(false)
          if (!uploading) handleFiles(e.dataTransfer.files)
        }}
        onClick={() => !uploading && inputRef.current?.click()}
        style={{
          border: `2px dashed ${dragging ? '#ff3b30' : 'rgba(255,255,255,0.2)'}`,
          padding: '32px 24px',
          textAlign: 'center',
          cursor: uploading ? 'default' : 'pointer',
          background: dragging ? 'rgba(255,59,48,0.06)' : 'transparent',
          transition: 'all 0.15s',
        }}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*,video/*,audio/*"
          style={{ display: 'none' }}
          onChange={e => handleFiles(e.target.files)}
        />
        <div className="font-body font-light text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
          {uploading
            ? `Загрузка ${progress.current} из ${progress.total}...`
            : 'Перетащите файлы или нажмите для выбора'}
        </div>
      </div>
      {error && (
        <div className="font-body font-light text-xs mt-2" style={{ color: '#ff5a4a' }}>
          {error}
        </div>
      )}
    </div>
  )
}
