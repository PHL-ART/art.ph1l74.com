import { describe, it, expect } from 'vitest'
import { blocksToHtml, tiptapJsonToBlocks } from '../tiptapConverter'

describe('blocksToHtml', () => {
  it('passes through html of a text block', () => {
    const result = blocksToHtml({ blocks: [{ type: 'text', html: '<p>Hello world</p>' }] })
    expect(result).toBe('<p>Hello world</p>')
  })

  it('wraps lead text block with data-is-lead', () => {
    const result = blocksToHtml({ blocks: [{ type: 'text', html: '<p>Lead</p>', isLead: true }] })
    expect(result).toContain('data-is-lead="true"')
    expect(result).toContain('Lead')
  })

  it('converts heading block to h2', () => {
    const result = blocksToHtml({ blocks: [{ type: 'heading', level: 2, text: 'My Title' }] })
    expect(result).toBe('<h2>My Title</h2>')
  })

  it('converts heading block to h3', () => {
    const result = blocksToHtml({ blocks: [{ type: 'heading', level: 3, text: 'Sub' }] })
    expect(result).toBe('<h3>Sub</h3>')
  })

  it('converts image block with S3 URL and data-key', () => {
    process.env.NEXT_PUBLIC_S3_BASE_URL = 'https://cdn.example.com'
    const result = blocksToHtml({ blocks: [{ type: 'image', key: 'photos/img.jpg' }] })
    expect(result).toContain('src="https://cdn.example.com/photos/img.jpg"')
    expect(result).toContain('data-key="photos/img.jpg"')
  })

  it('handles multiple blocks in order', () => {
    const result = blocksToHtml({
      blocks: [
        { type: 'text', html: '<p>First</p>' },
        { type: 'heading', level: 2, text: 'Second' },
      ],
    })
    expect(result).toBe('<p>First</p><h2>Second</h2>')
  })

  it('returns empty string for empty blocks', () => {
    expect(blocksToHtml({ blocks: [] })).toBe('')
  })
})

describe('tiptapJsonToBlocks', () => {
  it('converts paragraph node to text block', () => {
    const result = tiptapJsonToBlocks({
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Hello' }] }],
    })
    expect(result.blocks).toEqual([{ type: 'text', html: '<p>Hello</p>', isLead: false }])
  })

  it('reads isLead from data-is-lead attr', () => {
    const result = tiptapJsonToBlocks({
      type: 'doc',
      content: [{ type: 'paragraph', attrs: { 'data-is-lead': 'true' }, content: [{ type: 'text', text: 'Lead' }] }],
    })
    expect(result.blocks[0]).toMatchObject({ isLead: true })
  })

  it('converts heading node', () => {
    const result = tiptapJsonToBlocks({
      type: 'doc',
      content: [{ type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Title' }] }],
    })
    expect(result.blocks).toEqual([{ type: 'heading', level: 2, text: 'Title' }])
  })

  it('converts image node extracting data-key', () => {
    const result = tiptapJsonToBlocks({
      type: 'doc',
      content: [{ type: 'image', attrs: { src: 'https://cdn.example.com/k.jpg', 'data-key': 'k.jpg' } }],
    })
    expect(result.blocks).toEqual([{ type: 'image', key: 'k.jpg' }])
  })

  it('applies bold mark', () => {
    const result = tiptapJsonToBlocks({
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Bold', marks: [{ type: 'bold' }] }] }],
    })
    expect(result.blocks[0]).toMatchObject({ html: '<p><strong>Bold</strong></p>' })
  })

  it('applies italic mark', () => {
    const result = tiptapJsonToBlocks({
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Ital', marks: [{ type: 'italic' }] }] }],
    })
    expect(result.blocks[0]).toMatchObject({ html: '<p><em>Ital</em></p>' })
  })

  it('returns empty blocks for empty doc', () => {
    expect(tiptapJsonToBlocks({ type: 'doc', content: [] }).blocks).toEqual([])
  })
})
