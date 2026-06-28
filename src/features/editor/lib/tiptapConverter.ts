export type Block =
  | { type: 'text'; html: string; isLead: boolean }
  | { type: 'heading'; level: 2 | 3; text: string }
  | { type: 'image'; key: string; alt?: string }

export interface TiptapTextNode {
  type: 'text'
  text: string
  marks?: { type: string }[]
}

export interface TiptapNode {
  type: string
  attrs?: Record<string, unknown>
  content?: TiptapNode[]
  text?: string
  marks?: { type: string }[]
}

export interface TiptapDoc {
  type: 'doc'
  content: TiptapNode[]
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function inlineNodesToHtml(nodes: TiptapNode[]): string {
  return nodes
    .map(n => {
      if (n.type !== 'text') return ''
      let text = escapeHtml(n.text ?? '')
      // Apply italic first, then bold — so the output is <strong><em>text</em></strong>
      if (n.marks?.some(m => m.type === 'italic')) text = `<em>${text}</em>`
      if (n.marks?.some(m => m.type === 'bold')) text = `<strong>${text}</strong>`
      return text
    })
    .join('')
}

// Security note: blocksToHtml output is fed to TipTap's setContent() (admin-only editor).
// TipTap/ProseMirror sanitises HTML through its schema before rendering.
// block.html originates from tiptapJsonToBlocks, which only builds HTML from escaped text nodes.
export function blocksToHtml(body: { blocks: Block[] }): string {
  const s3Base = process.env.NEXT_PUBLIC_S3_BASE_URL ?? ''
  return body.blocks
    .map(block => {
      if (block.type === 'text') {
        if (block.isLead) {
          // Inject data-is-lead into the first opening standard HTML tag (e.g. <p>)
          return block.html.replace(/^<(\w+)/, '<$1 data-is-lead="true"')
        }
        return block.html
      }
      if (block.type === 'heading') {
        return `<h${block.level}>${escapeHtml(block.text)}</h${block.level}>`
      }
      if (block.type === 'image') {
        const src = `${s3Base}/${block.key}`
        const alt = block.alt ? ` alt="${escapeHtml(block.alt)}"` : ''
        return `<img src="${src}" data-key="${escapeHtml(block.key)}"${alt} />`
      }
      return ''
    })
    .join('')
}

export function tiptapJsonToBlocks(doc: TiptapDoc): { blocks: Block[] } {
  const blocks: Block[] = (doc.content ?? []).flatMap((node): Block[] => {
    if (node.type === 'paragraph') {
      const isLead =
        node.attrs?.['data-is-lead'] === 'true' || node.attrs?.['data-is-lead'] === true
      const inner = inlineNodesToHtml(node.content ?? [])
      return [{ type: 'text' as const, html: `<p>${inner}</p>`, isLead }]
    }
    if (node.type === 'heading') {
      const level = (node.attrs?.level as 2 | 3) ?? 2
      const text = (node.content ?? []).map(n => n.text ?? '').join('')
      return [{ type: 'heading' as const, level, text }]
    }
    if (node.type === 'image') {
      const key = (node.attrs?.['data-key'] as string) ?? ''
      return [{ type: 'image' as const, key }]
    }
    if (node.type === 'blockquote') {
      const inner = (node.content ?? [])
        .map(n => `<p>${inlineNodesToHtml(n.content ?? [])}</p>`)
        .join('')
      return [{ type: 'text' as const, html: `<blockquote>${inner}</blockquote>`, isLead: false }]
    }
    return []
  })
  return { blocks }
}
