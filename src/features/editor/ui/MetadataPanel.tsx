'use client'

interface Category {
  id: string
  name: string
}

interface Tag {
  id: string
  name: string
}

interface Props {
  title: string
  slug: string
  selectedCategoryIds: string[]
  selectedTagIds: string[]
  allCategories: Category[]
  allTags: Tag[]
  onTitleChange: (v: string) => void
  onSlugChange: (v: string) => void
  onCategoryToggle: (id: string) => void
  onTagToggle: (id: string) => void
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
  onCategoryToggle,
  onTagToggle,
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
        <span className={LABEL} style={LABEL_COLOR}>
          Заголовок
        </span>
        <input
          value={title}
          onChange={e => onTitleChange(e.target.value)}
          placeholder="Без названия"
          style={FIELD_STYLE}
          className="font-display font-bold"
        />
      </div>

      <div>
        <span className={LABEL} style={LABEL_COLOR}>
          Slug
        </span>
        <input
          value={slug}
          onChange={e => onSlugChange(e.target.value)}
          style={{ ...FIELD_STYLE, fontSize: 12 }}
          className="font-body"
        />
      </div>

      <div>
        <span className={LABEL} style={LABEL_COLOR}>
          Категории
        </span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {allCategories.map(cat => {
            const active = selectedCategoryIds.includes(cat.id)
            return (
              <button
                key={cat.id}
                onClick={() => onCategoryToggle(cat.id)}
                className="font-nav font-bold text-[11px] tracking-[0.05em] uppercase text-left"
                style={{
                  padding: '7px 12px',
                  background: active ? 'rgba(255,59,48,0.14)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${active ? 'rgba(255,59,48,0.4)' : 'rgba(255,255,255,0.1)'}`,
                  color: active ? '#ff5a4a' : 'rgba(255,255,255,0.7)',
                  cursor: 'pointer',
                }}
              >
                {cat.name}
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <span className={LABEL} style={LABEL_COLOR}>
          Теги
        </span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {allTags.map(tag => {
            const active = selectedTagIds.includes(tag.id)
            return (
              <button
                key={tag.id}
                onClick={() => onTagToggle(tag.id)}
                className="font-nav font-bold text-[10px] tracking-[0.05em] uppercase"
                style={{
                  padding: '4px 9px',
                  background: active ? 'rgba(255,59,48,0.14)' : 'transparent',
                  border: `1px solid ${active ? 'rgba(255,59,48,0.4)' : 'rgba(255,255,255,0.15)'}`,
                  color: active ? '#ff5a4a' : 'rgba(255,255,255,0.55)',
                  cursor: 'pointer',
                }}
              >
                {tag.name}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
