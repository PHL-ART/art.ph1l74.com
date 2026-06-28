import { describe, it, expect, vi, afterEach } from 'vitest'
import { blocksToHtml, tiptapJsonToBlocks } from '../tiptapConverter'

// I2: clean up stubbed env vars after each test
afterEach(() => vi.unstubAllEnvs())

describe('blocksToHtml', () => {
  it('passes through html of a text block', () => {
    const result = blocksToHtml({ blocks: [{ type: 'text', html: '<p>Hello world</p>', isLead: false }] })
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
    // I2: use vi.stubEnv instead of direct process.env assignment
    vi.stubEnv('NEXT_PUBLIC_S3_BASE_URL', 'https://cdn.example.com')
    const result = blocksToHtml({ blocks: [{ type: 'image', key: 'photos/img.jpg' }] })
    expect(result).toContain('src="https://cdn.example.com/photos/img.jpg"')
    expect(result).toContain('data-key="photos/img.jpg"')
  })

  it('handles multiple blocks in order', () => {
    const result = blocksToHtml({
      blocks: [
        { type: 'text', html: '<p>First</p>', isLead: false },
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
    // C2: This test assumes the CustomParagraph TipTap extension (Task 5) stores
    // data-is-lead as a node attribute. The test uses the expected output format directly.
    const result = tiptapJsonToBlocks({
      type: 'doc',
      content: [{ type: 'paragraph', attrs: { 'data-is-lead': 'true' }, content: [{ type: 'text', text: 'Lead' }] }],
    })
    expect(result.blocks[0]).toMatchObject({ isLead: true })
  })

  it('returns isLead false when attrs is absent', () => {
    // C2: When attrs is not set at all, isLead should default to false
    const result = tiptapJsonToBlocks({
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'No attrs' }] }],
    })
    expect(result.blocks[0]).toMatchObject({ isLead: false })
  })

  it('returns isLead false when data-is-lead is not set', () => {
    // C2: When attrs exists but data-is-lead is absent, isLead should be false
    const result = tiptapJsonToBlocks({
      type: 'doc',
      content: [{ type: 'paragraph', attrs: {}, content: [{ type: 'text', text: 'Other attrs' }] }],
    })
    expect(result.blocks[0]).toMatchObject({ isLead: false })
  })

  it('returns isLead false when data-is-lead is string "false"', () => {
    // C3: The string 'false' should produce isLead: false (not truthy)
    const result = tiptapJsonToBlocks({
      type: 'doc',
      content: [{ type: 'paragraph', attrs: { 'data-is-lead': 'false' }, content: [{ type: 'text', text: 'Not lead' }] }],
    })
    expect(result.blocks[0]).toMatchObject({ isLead: false })
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

  it('applies bold+italic combined marks as <strong><em>text</em></strong>', () => {
    // C1: italic is applied first (inner), bold second (outer) → <strong><em>text</em></strong>
    const result = tiptapJsonToBlocks({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'BoldItal', marks: [{ type: 'bold' }, { type: 'italic' }] },
          ],
        },
      ],
    })
    expect(result.blocks[0]).toMatchObject({ html: '<p><strong><em>BoldItal</em></strong></p>' })
  })

  it('returns empty blocks for empty doc', () => {
    expect(tiptapJsonToBlocks({ type: 'doc', content: [] }).blocks).toEqual([])
  })
})
