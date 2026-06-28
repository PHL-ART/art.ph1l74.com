'use client'

import type { Editor } from '@tiptap/react'

interface Props {
  editor: Editor | null
  onInsertImage: () => void
}

const BTN = 'flex items-center justify-center w-8 h-8 text-sm'
const ACTIVE = { background: 'rgba(255,59,48,0.18)', color: '#ff3b30' }
const INACTIVE = { color: 'rgba(255,255,255,0.7)' }

export function EditorToolbar({ editor, onInsertImage }: Props) {
  if (!editor) return null

  const actions = [
    {
      label: 'B',
      title: 'Bold',
      action: () => editor.chain().focus().toggleBold().run(),
      active: editor.isActive('bold'),
    },
    {
      label: 'I',
      title: 'Italic',
      action: () => editor.chain().focus().toggleItalic().run(),
      active: editor.isActive('italic'),
    },
    {
      label: 'H2',
      title: 'Heading 2',
      action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      active: editor.isActive('heading', { level: 2 }),
    },
    {
      label: 'H3',
      title: 'Heading 3',
      action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
      active: editor.isActive('heading', { level: 3 }),
    },
    {
      label: '❝',
      title: 'Blockquote',
      action: () => editor.chain().focus().toggleBlockquote().run(),
      active: editor.isActive('blockquote'),
    },
    {
      label: 'L',
      title: 'Lead paragraph',
      action: () => {
        const isLead = editor.isActive('paragraph', { 'data-is-lead': 'true' })
        editor
          .chain()
          .focus()
          .updateAttributes('paragraph', { 'data-is-lead': isLead ? null : 'true' })
          .run()
      },
      active: editor.isActive('paragraph', { 'data-is-lead': 'true' }),
    },
  ]

  return (
    <div
      className="flex items-center gap-1 flex-wrap"
      style={{
        padding: '8px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        background: '#0a0708',
      }}
    >
      {actions.map(({ label, title, action, active }) => (
        <button
          key={title}
          title={title}
          onClick={action}
          className={`${BTN} font-nav font-bold text-[12px]`}
          style={active ? ACTIVE : INACTIVE}
        >
          {label}
        </button>
      ))}
      <div
        style={{
          width: 1,
          height: 20,
          background: 'rgba(255,255,255,0.12)',
          margin: '0 4px',
        }}
      />
      <button
        title="Вставить изображение"
        onClick={onInsertImage}
        className={BTN}
        style={INACTIVE}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="M21 15l-5-5L5 21" />
        </svg>
      </button>
    </div>
  )
}
