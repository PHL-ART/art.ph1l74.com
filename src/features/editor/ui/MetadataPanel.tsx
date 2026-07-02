'use client'

import { useEffect, useRef, useState } from 'react'
import { ComboboxSelect, type ComboboxOption } from './ComboboxSelect'

interface MediaFile { id: string; key: string; filename: string; type: string }

interface Props {
  status: string
  title: string
  slug: string
  isFeatured: boolean
  selectedCategoryIds: string[]
  selectedTagIds: string[]
  allCategories: ComboboxOption[]
  allTags: ComboboxOption[]
  saveStatus: 'saved' | 'saving' | 'unsaved'
  publishError: string | null
  scheduledAt: string
  onTitleChange: (v: string) => void
  onSlugChange: (v: string) => void
  onIsFeaturedChange: (v: boolean) => void
  onCategoryChange: (ids: string[]) => void
  onTagChange: (ids: string[]) => void
  onCreateCategory: (name: string) => Promise<ComboboxOption>
  onCreateTag: (name: string) => Promise<ComboboxOption>
  onSave: () => void
  onPublish: () => void
  onScheduledAtChange: (v: string) => void
}

const FIELD: React.CSSProperties = {
  width: '100%',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.12)',
  color: '#fff',
  padding: '9px 12px',
  fontSize: 14,
  fontFamily: 'inherit',
  outline: 'none',
}

const LABEL = 'font-nav font-bold text-[10px] tracking-[0.1em] uppercase'
const MUTED: React.CSSProperties = { color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 6 }

const S3_BASE = process.env.NEXT_PUBLIC_S3_BASE_URL ?? ''

export function MetadataPanel({
  status,
  title,
  slug,
  isFeatured,
  selectedCategoryIds,
  selectedTagIds,
  allCategories,
  allTags,
  saveStatus,
  publishError,
  scheduledAt,
  onTitleChange,
  onSlugChange,
  onIsFeaturedChange,
  onCategoryChange,
  onTagChange,
  onCreateCategory,
  onCreateTag,
  onSave,
  onPublish,
  onScheduledAtChange,
}: Props) {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([])
  const [publishing, setPublishing] = useState(false)
  const dragRef = useRef<string | null>(null)

  const isPublished = status === 'PUBLISHED'

  useEffect(() => {
    fetch('/api/admin/media?type=IMAGE')
      .then(r => r.json())
      .then(d => setMediaFiles((d.files ?? []).slice(0, 12)))
      .catch(() => {})
  }, [])

  const saveLabel =
    saveStatus === 'saving' ? 'Сохранение...' :
    saveStatus === 'unsaved' ? 'Не сохранено' : 'Сохранено'

  async function handlePublish() {
    setPublishing(true)
    await onPublish()
    setPublishing(false)
  }

  function handleDragStart(e: React.DragEvent, file: MediaFile) {
    dragRef.current = file.key
    e.dataTransfer.setData('text/plain', `${S3_BASE}/${file.key}`)
    e.dataTransfer.setData('application/x-media-key', file.key)
    e.dataTransfer.effectAllowed = 'copy'
  }

  return (
    <div
      style={{
        width: 300,
        flexShrink: 0,
        borderLeft: '1px solid rgba(255,255,255,0.08)',
        background: '#0a0708',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflowY: 'auto',
      }}
    >
      {/* Scrollable content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 20, padding: 20 }}>

        {/* Save status indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              width: 6, height: 6, borderRadius: '50%',
              background: saveStatus === 'saved' ? '#34c759' : saveStatus === 'saving' ? '#ff9500' : '#ff3b30',
              flexShrink: 0,
            }}
          />
          <span className="font-nav text-[10px] tracking-[0.08em] uppercase" style={{ color: 'rgba(255,255,255,0.45)' }}>
            {saveLabel}
          </span>
          {isPublished && (
            <span
              className="font-nav font-bold text-[9px] tracking-[0.06em] uppercase"
              style={{
                marginLeft: 'auto',
                background: 'rgba(52,199,89,0.15)',
                color: '#34c759',
                padding: '2px 6px',
                borderRadius: 3,
              }}
            >
              Опубликовано
            </span>
          )}
        </div>

        {/* Title */}
        <div>
          <span className={LABEL} style={MUTED}>Заголовок</span>
          <input
            value={title}
            onChange={e => onTitleChange(e.target.value)}
            placeholder="Без названия"
            style={FIELD}
            className="font-display font-bold"
          />
        </div>

        {/* Slug */}
        <div>
          <span className={LABEL} style={MUTED}>Slug</span>
          <input
            value={slug}
            onChange={e => onSlugChange(e.target.value)}
            style={{ ...FIELD, fontSize: 12 }}
            className="font-body"
          />
        </div>

        {/* Categories */}
        <div>
          <span className={LABEL} style={MUTED}>Категории</span>
          <ComboboxSelect
            value={selectedCategoryIds}
            onChange={onCategoryChange}
            options={allCategories}
            onCreateNew={onCreateCategory}
            placeholder="Поиск или создать категорию..."
          />
        </div>

        {/* Tags */}
        <div>
          <span className={LABEL} style={MUTED}>Теги</span>
          <ComboboxSelect
            value={selectedTagIds}
            onChange={onTagChange}
            options={allTags}
            onCreateNew={onCreateTag}
            placeholder="Поиск или создать тег..."
          />
        </div>

        {/* isFeatured toggle */}
        <div>
          <label
            style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', userSelect: 'none' }}
          >
            <div
              onClick={() => onIsFeaturedChange(!isFeatured)}
              style={{
                width: 36, height: 20, borderRadius: 10, flexShrink: 0,
                background: isFeatured ? '#ff3b30' : 'rgba(255,255,255,0.12)',
                position: 'relative',
                transition: 'background 0.2s',
                cursor: 'pointer',
              }}
            >
              <div style={{
                position: 'absolute',
                top: 3, left: isFeatured ? 18 : 3,
                width: 14, height: 14, borderRadius: '50%',
                background: '#fff',
                transition: 'left 0.2s',
              }} />
            </div>
            <span className={LABEL} style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 0 }}>
              На главной
            </span>
          </label>
        </div>

        {/* Media library */}
        {mediaFiles.length > 0 && (
          <div>
            <span className={LABEL} style={MUTED}>Медиатека</span>
            <p className="font-nav text-[9px]" style={{ color: 'rgba(255,255,255,0.3)', marginBottom: 8 }}>
              Перетащите изображение в редактор
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {mediaFiles.map(file => (
                <div
                  key={file.id}
                  draggable
                  onDragStart={e => handleDragStart(e, file)}
                  style={{
                    cursor: 'grab',
                    border: '1px solid rgba(255,255,255,0.1)',
                    position: 'relative',
                    userSelect: 'none',
                  }}
                  title={file.filename}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`${S3_BASE}/${file.key}`}
                    alt={file.filename}
                    style={{ width: '100%', height: 60, objectFit: 'cover', display: 'block', pointerEvents: 'none' }}
                  />
                  <div
                    style={{
                      position: 'absolute', top: 3, left: 3,
                      background: 'rgba(0,0,0,0.5)', borderRadius: 2, padding: '1px 3px',
                    }}
                  >
                    <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                      <path d="M1 3.5h7M1 5.5h7" stroke="rgba(255,255,255,0.7)" strokeWidth="1.2" strokeLinecap="round" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Scheduled publishing — hidden for already-published posts */}
        {!isPublished && (
          <div>
            <span className={LABEL} style={MUTED}>Публикация</span>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={e => onScheduledAtChange(e.target.value)}
              style={{ ...FIELD, fontSize: 12, colorScheme: 'dark' }}
              className="font-body"
            />
            <p className="font-nav text-[9px]" style={{ color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>
              {scheduledAt ? 'Запланировано' : 'Опубликовать сразу'}
            </p>
          </div>
        )}

      </div>

      {/* Action buttons */}
      <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {publishError && (
          <p className="font-nav text-[10px]" style={{ color: '#ff5a4a' }}>{publishError}</p>
        )}

        {/* Draft-only: show "Save Draft" button */}
        {!isPublished && (
          <button
            onClick={onSave}
            className="font-nav font-bold text-[11px] tracking-[0.06em] uppercase"
            style={{
              background: 'rgba(255,255,255,0.08)',
              color: '#fff',
              border: 'none',
              padding: '10px 16px',
              cursor: 'pointer',
              width: '100%',
            }}
          >
            Сохранить черновик
          </button>
        )}

        {/* For published posts: "Save"; for drafts: "Publish" / "Schedule" */}
        <button
          onClick={isPublished ? onSave : handlePublish}
          disabled={publishing}
          className="font-nav font-bold text-[11px] tracking-[0.06em] uppercase"
          style={{
            background: publishing ? 'rgba(255,59,48,0.5)' : '#ff3b30',
            color: '#fff',
            border: 'none',
            padding: '10px 16px',
            cursor: publishing ? 'default' : 'pointer',
            width: '100%',
          }}
        >
          {isPublished
            ? 'Сохранить'
            : scheduledAt
              ? 'Запланировать'
              : publishing
                ? 'Публикация...'
                : 'Опубликовать'}
        </button>
      </div>
    </div>
  )
}
