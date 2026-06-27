import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

describe('getPostUrl', () => {
  beforeEach(() => {
    vi.stubEnv('S3_ENDPOINT', 's3.firstvds.ru')
    vi.stubEnv('S3_BUCKET', 'phlart')
  })
  afterEach(() => vi.unstubAllEnvs())

  it('строит path-style URL', async () => {
    const { getPostUrl } = await import('../getPostUrl')
    expect(getPostUrl('photos/abc123.jpg')).toBe('https://s3.firstvds.ru/phlart/photos/abc123.jpg')
  })
  it('работает с вложенными путями', async () => {
    const { getPostUrl } = await import('../getPostUrl')
    expect(getPostUrl('media/2026/cover.png')).toBe('https://s3.firstvds.ru/phlart/media/2026/cover.png')
  })
})
