'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import { Paragraph } from '@tiptap/extension-paragraph'
import Placeholder from '@tiptap/extension-placeholder'
import {
  blocksToHtml,
  tiptapJsonToBlocks,
  type Block,
  type TiptapDoc,
} from '@/features/editor/lib/tiptapConverter'
import { saveDraft } from '@/features/admin/actions/saveDraft'
import { publishPost } from '@/features/admin/actions/publishPost'
import { AdminSidebar } from '@/features/admin/ui/AdminSidebar'
import { EditorToolbar } from './EditorToolbar'
import { MetadataPanel } from './MetadataPanel'
import { ImagePickerModal } from './ImagePickerModal'

interface PostData {
  id: string
  title: string
  slug: string
  body: { blocks: unknown[] }
  status: string
  coverImageKey: string | null
  categories: { id: string; name: string }[]
  tags: { id: string; name: string }[]
}

interface Props {
  post: PostData
  allCategories: { id: string; name: string }[]
  allTags: { id: string; name: string }[]
}

// Extend Paragraph to support data-is-lead so the converter round-trips correctly
const CustomParagraph = Paragraph.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      'data-is-lead': {
        default: null,
        parseHTML: (el: Element) => el.getAttribute('data-is-lead'),
        renderHTML: (attrs: Record<string, unknown>) =>
          attrs['data-is-lead'] ? { 'data-is-lead': attrs['data-is-lead'] } : {},
      },
    }
  },
})

// Extend Image to carry the S3 object key alongside the src URL
const ImageWithKey = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      'data-key': { default: null },
    }
  },
})

function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

export function PostEditor({ post, allCategories, allTags }: Props) {
  const [title, setTitle] = useState(post.title)
  const [slug, setSlug] = useState(post.slug)
  const [selectedCategoryIds, setSelectedCategoryIds] = useState(post.categories.map(c => c.id))
  const [selectedTagIds, setSelectedTagIds] = useState(post.tags.map(t => t.id))
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved')
  const [publishError, setPublishError] = useState<string | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const editor = useEditor({
    extensions: [
      // Disable default paragraph so CustomParagraph takes over
      StarterKit.configure({ paragraph: false }),
      CustomParagraph,
      ImageWithKey,
      Placeholder.configure({ placeholder: 'Начните писать...' }),
    ],
    content: blocksToHtml(post.body as { blocks: Block[] }),
    editorProps: {
      attributes: {
        style: 'outline: none; min-height: 400px;',
      },
    },
    onUpdate: () => {
      setSaveStatus('unsaved')
      scheduleAutoSave()
    },
  })

  const doSave = useCallback(async () => {
    if (!editor) return
    setSaveStatus('saving')
    const body = tiptapJsonToBlocks(editor.getJSON() as unknown as TiptapDoc)
    const result = await saveDraft(post.id, {
      title,
      slug,
      body,
      categoryIds: selectedCategoryIds,
      tagIds: selectedTagIds,
    })
    setSaveStatus(result.success ? 'saved' : 'unsaved')
  }, [editor, post.id, title, slug, selectedCategoryIds, selectedTagIds])

  // Always points to the latest doSave so the onUpdate closure stays fresh
  const doSaveRef = useRef(doSave)
  useEffect(() => { doSaveRef.current = doSave }, [doSave])

  // Schedules an auto-save 30 s after the last change
  function scheduleAutoSave() {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => doSaveRef.current(), 30_000)
  }

  // Cancel pending auto-save on unmount
  useEffect(() => () => { if (saveTimer.current) clearTimeout(saveTimer.current) }, [])

  async function handlePublish() {
    setPublishError(null)
    // Save latest state first so the published snapshot is current
    await doSave()
    const result = await publishPost(post.id, { vk: true, tg: true })
    if (!result.success) setPublishError(result.error ?? 'Ошибка публикации')
  }

  function handleTitleChange(value: string) {
    setTitle(value)
    // Auto-generate slug only while the post has no real title yet (first edit)
    if (!post.title) setSlug(slugify(value))
    setSaveStatus('unsaved')
    scheduleAutoSave()
  }

  function handleCategoryToggle(id: string) {
    setSelectedCategoryIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]))
    setSaveStatus('unsaved')
    scheduleAutoSave()
  }

  function handleTagToggle(id: string) {
    setSelectedTagIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]))
    setSaveStatus('unsaved')
    scheduleAutoSave()
  }

  return (
    <div className="flex min-h-screen" style={{ background: '#0e0a0b', color: '#fff' }}>
      <AdminSidebar />

      <div className="flex flex-col flex-1 min-w-0">
        {/* Top action bar */}
        <div
          className="flex items-center justify-between px-6 py-4 flex-shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
        >
          <span
            className="font-nav font-bold text-[11px] tracking-[0.08em] uppercase"
            style={{ color: 'rgba(255,255,255,0.5)' }}
          >
            {saveStatus === 'saving'
              ? 'Сохранение...'
              : saveStatus === 'unsaved'
                ? 'Не сохранено'
                : 'Сохранено'}
          </span>

          <div className="flex gap-2 items-center">
            {publishError && (
              <span className="text-[11px]" style={{ color: '#ff5a4a' }}>
                {publishError}
              </span>
            )}
            <button
              onClick={doSave}
              className="font-nav font-bold text-[11px] tracking-[0.06em] uppercase"
              style={{
                background: 'rgba(255,255,255,0.08)',
                color: '#fff',
                border: 'none',
                padding: '9px 16px',
                cursor: 'pointer',
              }}
            >
              Сохранить черновик
            </button>
            <button
              onClick={handlePublish}
              className="font-nav font-bold text-[11px] tracking-[0.06em] uppercase"
              style={{
                background: '#ff3b30',
                color: '#fff',
                border: 'none',
                padding: '9px 16px',
                cursor: 'pointer',
              }}
            >
              Опубликовать
            </button>
          </div>
        </div>

        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Main editor area */}
          <div className="flex flex-col flex-1 min-w-0 overflow-auto">
            {/* Formatting toolbar */}
            <EditorToolbar editor={editor} onInsertImage={() => setPickerOpen(true)} />

            <div
              style={{ padding: '32px 48px', maxWidth: 800, margin: '0 auto', width: '100%' }}
            >
              <EditorContent editor={editor} />
            </div>
          </div>

          {/* Right-side metadata panel */}
          <MetadataPanel
            title={title}
            slug={slug}
            selectedCategoryIds={selectedCategoryIds}
            selectedTagIds={selectedTagIds}
            allCategories={allCategories}
            allTags={allTags}
            onTitleChange={handleTitleChange}
            onSlugChange={setSlug}
            onCategoryToggle={handleCategoryToggle}
            onTagToggle={handleTagToggle}
          />
        </div>
      </div>

      <ImagePickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(key, src) => {
          editor?.chain().focus().setImage({ src, 'data-key': key } as never).run()
          setPickerOpen(false)
        }}
      />
    </div>
  )
}
