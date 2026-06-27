import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MediaCard } from '../MediaCard'

vi.mock('@/shared/lib/getPostUrl', () => ({
  getPostUrl: (key: string) => `https://s3.example.com/bucket/${key}`,
}))

const baseProps = {
  title: 'Тест заголовок',
  slug: 'test-slug',
  coverImageKey: null,
  publishedAt: new Date('2026-01-15'),
  categories: [{ id: '1', name: 'Фото', slug: 'photo' }],
}

describe('MediaCard', () => {
  it('рендерит заголовок', () => {
    render(<MediaCard {...baseProps} />)
    expect(screen.getByText('Тест заголовок')).toBeInTheDocument()
  })
  it('рендерит категорию', () => {
    render(<MediaCard {...baseProps} />)
    expect(screen.getByText('Фото')).toBeInTheDocument()
  })
  it('ссылка ведёт на /post/[slug]', () => {
    render(<MediaCard {...baseProps} />)
    expect(screen.getByRole('link')).toHaveAttribute('href', '/post/test-slug')
  })
  it('без обложки нет img', () => {
    render(<MediaCard {...baseProps} coverImageKey={null} />)
    expect(screen.queryByRole('img')).toBeNull()
  })
})
