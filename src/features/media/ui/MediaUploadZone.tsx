'use client'

import { useRef, useState } from 'react'
import { uploadMedia } from '@/features/media/actions/uploadMedia'

interface Props {
  onUploaded: () => void
}

export function MediaUploadZone({ onUploaded }: Props) {
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return
    setUploading(true)
    const fd = new FormData()
    fd.append('file', files[0])
    await uploadMedia(fd)
    setUploading(false)
    onUploaded()
  }

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={e => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files) }}
      onClick={() => inputRef.current?.click()}
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
        accept="image/*,video/*,audio/*"
        style={{ display: 'none' }}
        onChange={e => handleFiles(e.target.files)}
      />
      <div className="font-body font-light text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
        {uploading ? 'Загрузка...' : 'Перетащите файл или нажмите для выбора'}
      </div>
    </div>
  )
}
