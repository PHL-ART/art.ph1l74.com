'use client'

import { ComboboxSelect, type ComboboxOption } from './ComboboxSelect'

interface Props {
  title: string
  slug: string
  selectedCategoryIds: string[]
  selectedTagIds: string[]
  allCategories: ComboboxOption[]
  allTags: ComboboxOption[]
  onTitleChange: (v: string) => void
  onSlugChange: (v: string) => void
  onCategoryChange: (ids: string[]) => void
  onTagChange: (ids: string[]) => void
  onCreateCategory: (name: string) => Promise<ComboboxOption>
  onCreateTag: (name: string) => Promise<ComboboxOption>
}

const FIELD_STYLE: React.CSSProperties = {
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
const LABEL_COLOR: React.CSSProperties = {
  color: 'rgba(255,255,255,0.5)',
  display: 'block',
  marginBottom: 6,
}

export function MetadataPanel({
  title,
  slug,
  selectedCategoryIds,
  selectedTagIds,
  allCategories,
  allTags,
  onTitleChange,
  onSlugChange,
  onCategoryChange,
  onTagChange,
  onCreateCategory,
  onCreateTag,
}: Props) {
  return (
    <div
      style={{
        width: 300,
        flexShrink: 0,
        borderLeft: '1px solid rgba(255,255,255,0.08)',
        background: '#0a0708',
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
        overflowY: 'auto',
      }}
    >
      <div>
        <span className={LABEL} style={LABEL_COLOR}>Заголовок</span>
        <input
          value={title}
          onChange={e => onTitleChange(e.target.value)}
          placeholder="Без названия"
          style={FIELD_STYLE}
          className="font-display font-bold"
        />
      </div>

      <div>
        <span className={LABEL} style={LABEL_COLOR}>Slug</span>
        <input
          value={slug}
          onChange={e => onSlugChange(e.target.value)}
          style={{ ...FIELD_STYLE, fontSize: 12 }}
          className="font-body"
        />
      </div>

      <div>
        <span className={LABEL} style={LABEL_COLOR}>Категории</span>
        <ComboboxSelect
          value={selectedCategoryIds}
          onChange={onCategoryChange}
          options={allCategories}
          onCreateNew={onCreateCategory}
          placeholder="Поиск или создать категорию..."
        />
      </div>

      <div>
        <span className={LABEL} style={LABEL_COLOR}>Теги</span>
        <ComboboxSelect
          value={selectedTagIds}
          onChange={onTagChange}
          options={allTags}
          onCreateNew={onCreateTag}
          placeholder="Поиск или создать тег..."
        />
      </div>
    </div>
  )
}
