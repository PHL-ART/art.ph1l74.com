'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import { Paragraph } from '@tiptap/extension-paragraph'
import Placeholder from '@tiptap/extension-placeholder'
import { Extension } from '@tiptap/core'
import { Plugin, PluginKey, TextSelection } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import {
  blocksToHtml,
  tiptapJsonToBlocks,
  type Block,
  type TiptapDoc,
} from '@/features/editor/lib/tiptapConverter'
import { saveDraft } from '@/features/admin/actions/saveDraft'
import { publishPost } from '@/features/admin/actions/publishPost'
import { updatePublished } from '@/features/admin/actions/updatePublished'
import { createCategory } from '@/features/admin/actions/createCategory'
import { createTag } from '@/features/admin/actions/createTag'
import type { ComboboxOption } from './ComboboxSelect'
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
  isFeatured: boolean
  coverImageKey: string | null
  categories: { id: string; name: string }[]
  tags: { id: string; name: string }[]
}

interface Props {
  post: PostData
  allCategories: { id: string; name: string }[]
  allTags: { id: string; name: string }[]
}

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

const ImageWithKey = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      'data-key': { default: null },
    }
  },
})

// Highlights image nodes that fall within the current selection range.
// Also intercepts Shift+Arrow to move the selection head through block images one at a time.
const selectionPluginKey = new PluginKey('imageSelection')

const ImageSelectionExtension = Extension.create({
  name: 'imageSelection',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: selectionPluginKey,
        props: {
          decorations(state) {
            const { selection, doc } = state
            if (selection.empty) return DecorationSet.empty
            const decorations: Decoration[] = []
            doc.nodesBetween(selection.from, selection.to, (node, pos) => {
              if (node.type.name === 'image') {
                decorations.push(
                  Decoration.node(pos, pos + node.nodeSize, {
                    class: 'phl-image-in-selection',
                  })
                )
              }
            })
            return DecorationSet.create(doc, decorations)
          },
        },
      }),
    ]
  },

  addKeyboardShortcuts() {
    return {
      'Shift-ArrowUp': () => {
        const { state } = this.editor
        const { selection, doc } = state
        const { $head, anchor } = selection

        // Case 1: cursor at start of a block — check if node before that block is an image
        if ($head.depth > 0 && $head.parentOffset === 0) {
          const blockStart = $head.before($head.depth)
          if (blockStart > 0) {
            const nodeBeforeBlock = doc.resolve(blockStart).nodeBefore
            if (nodeBeforeBlock?.type.name === 'image') {
              const newSel = TextSelection.create(doc, anchor, blockStart - nodeBeforeBlock.nodeSize)
              this.editor.view.dispatch(state.tr.setSelection(newSel))
              return true
            }
          }
        }

        // Case 2: between blocks — check if the previous sibling is an image
        const nodeBefore = $head.nodeBefore
        if (nodeBefore?.type.name === 'image') {
          const newSel = TextSelection.create(doc, anchor, $head.pos - nodeBefore.nodeSize)
          this.editor.view.dispatch(state.tr.setSelection(newSel))
          return true
        }

        return false
      },

      'Shift-ArrowDown': () => {
        const { state } = this.editor
        const { selection, doc } = state
        const { $head, anchor } = selection

        // Case 1: cursor at end of a block — check if node after that block is an image
        if ($head.depth > 0 && $head.parentOffset === $head.parent.content.size) {
          const blockEnd = $head.after($head.depth)
          if (blockEnd < doc.content.size) {
            const nodeAfterBlock = doc.resolve(blockEnd).nodeAfter
            if (nodeAfterBlock?.type.name === 'image') {
              const newSel = TextSelection.create(doc, anchor, blockEnd + nodeAfterBlock.nodeSize)
              this.editor.view.dispatch(state.tr.setSelection(newSel))
              return true
            }
          }
        }

        // Case 2: between blocks — check if the next sibling is an image
        const nodeAfter = $head.nodeAfter
        if (nodeAfter?.type.name === 'image') {
          const newSel = TextSelection.create(doc, anchor, $head.pos + nodeAfter.nodeSize)
          this.editor.view.dispatch(state.tr.setSelection(newSel))
          return true
        }

        return false
      },
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

export function PostEditor({ post, allCategories: initCategories, allTags: initTags }: Props) {
  const isPublished = post.status === 'PUBLISHED'

  const [title, setTitle] = useState(post.title)
  const [slug, setSlug] = useState(post.slug)
  const [isFeatured, setIsFeatured] = useState(post.isFeatured)
  const [selectedCategoryIds, setSelectedCategoryIds] = useState(post.categories.map(c => c.id))
  const [selectedTagIds, setSelectedTagIds] = useState(post.tags.map(t => t.id))
  const [allCategories, setAllCategories] = useState<ComboboxOption[]>(initCategories)
  const [allTags, setAllTags] = useState<ComboboxOption[]>(initTags)
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved')
  const [publishError, setPublishError] = useState<string | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [channelMap, setChannelMap] = useState<Record<string, boolean>>({})
  const [scheduledAt, setScheduledAt] = useState<string>('')

  useEffect(() => {
    fetch('/api/admin/services?type=CROSS_POSTING')
      .then(r => r.json())
      .then(data => {
        const map: Record<string, boolean> = {}
        for (const s of data.services ?? []) map[s.slug] = true
        setChannelMap(map)
      })
      .catch(() => {})
  }, [])

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ paragraph: false }),
      CustomParagraph,
      ImageWithKey,
      Placeholder.configure({ placeholder: 'Начните писать...' }),
      ImageSelectionExtension,
    ],
    content: blocksToHtml(post.body as { blocks: Block[] }),
    editorProps: {
      attributes: {
        style: 'outline: none; min-height: 400px;',
        class: 'phl-editor',
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

    let result: { success: boolean; error?: string }
    if (isPublished) {
      result = await updatePublished(post.id, {
        title, slug, body, isFeatured,
        categoryIds: selectedCategoryIds,
        tagIds: selectedTagIds,
      })
    } else {
      result = await saveDraft(post.id, {
        title, slug, body, isFeatured,
        categoryIds: selectedCategoryIds,
        tagIds: selectedTagIds,
        scheduledAt: scheduledAt || undefined,
      })
    }
    setSaveStatus(result.success ? 'saved' : 'unsaved')
  }, [editor, post.id, isPublished, title, slug, isFeatured, selectedCategoryIds, selectedTagIds, scheduledAt])

  const doSaveRef = useRef(doSave)
  useEffect(() => { doSaveRef.current = doSave }, [doSave])

  function scheduleAutoSave() {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => doSaveRef.current(), 30_000)
  }

  useEffect(() => () => { if (saveTimer.current) clearTimeout(saveTimer.current) }, [])

  async function handlePublish() {
    setPublishError(null)
    await doSave()
    const result = await publishPost(post.id, channelMap, scheduledAt || undefined)
    if (!result.success) setPublishError(result.error ?? 'Ошибка публикации')
  }

  function handleTitleChange(value: string) {
    setTitle(value)
    if (!post.title) setSlug(slugify(value))
    setSaveStatus('unsaved')
    scheduleAutoSave()
  }

  function handleCategoryChange(ids: string[]) {
    setSelectedCategoryIds(ids)
    setSaveStatus('unsaved')
    scheduleAutoSave()
  }

  function handleTagChange(ids: string[]) {
    setSelectedTagIds(ids)
    setSaveStatus('unsaved')
    scheduleAutoSave()
  }

  async function handleCreateCategory(name: string): Promise<ComboboxOption> {
    const created = await createCategory(name)
    setAllCategories(prev => [...prev, created].sort((a, b) => a.name.localeCompare(b.name, 'ru')))
    return created
  }

  async function handleCreateTag(name: string): Promise<ComboboxOption> {
    const created = await createTag(name)
    setAllTags(prev => [...prev, created].sort((a, b) => a.name.localeCompare(b.name, 'ru')))
    return created
  }

  function handleInsertImages(items: { key: string; src: string }[]) {
    if (!editor) return
    let chain = editor.chain().focus()
    for (const { src, key } of items) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      chain = chain.setImage({ src, 'data-key': key } as any)
    }
    chain.run()
  }

  const s3Base = process.env.NEXT_PUBLIC_S3_BASE_URL ?? ''

  function handleEditorDrop(e: React.DragEvent) {
    const key = e.dataTransfer.getData('application/x-media-key')
    if (!key || !editor) return
    e.preventDefault()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    editor.chain().focus().setImage({ src: `${s3Base}/${key}`, 'data-key': key } as any).run()
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#0e0a0b', color: '#fff' }}>
      <AdminSidebar />

      <div className="flex flex-1 min-w-0 min-h-0">
        {/* Scrollable editor area */}
        <div
          className="flex flex-col flex-1 min-w-0 overflow-auto"
          onDragOver={e => { if (e.dataTransfer.types.includes('application/x-media-key')) e.preventDefault() }}
          onDrop={handleEditorDrop}
        >
          <EditorToolbar editor={editor} onInsertImage={() => setPickerOpen(true)} />

          <div style={{ padding: '32px 48px', maxWidth: 800, margin: '0 auto', width: '100%' }}>
            <EditorContent editor={editor} />
          </div>
        </div>

        {/* Right sidebar */}
        <MetadataPanel
          status={post.status}
          title={title}
          slug={slug}
          isFeatured={isFeatured}
          selectedCategoryIds={selectedCategoryIds}
          selectedTagIds={selectedTagIds}
          allCategories={allCategories}
          allTags={allTags}
          saveStatus={saveStatus}
          publishError={publishError}
          scheduledAt={scheduledAt}
          onTitleChange={handleTitleChange}
          onSlugChange={setSlug}
          onIsFeaturedChange={setIsFeatured}
          onCategoryChange={handleCategoryChange}
          onTagChange={handleTagChange}
          onCreateCategory={handleCreateCategory}
          onCreateTag={handleCreateTag}
          onSave={doSave}
          onPublish={handlePublish}
          onScheduledAtChange={setScheduledAt}
        />
      </div>

      <ImagePickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onInsert={handleInsertImages}
      />
    </div>
  )
}
