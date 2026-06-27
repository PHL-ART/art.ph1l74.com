import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BlockRenderer } from '../BlockRenderer'
import type { Block } from '@/entities/post/types'

vi.mock('@/shared/lib/getPostUrl', () => ({
  getPostUrl: (key: string) => `https://cdn.example.com/${key}`,
}))

describe('BlockRenderer', () => {
  it('рендерит text блок', () => {
    render(<BlockRenderer blocks={[{ type: 'text', html: '<p>Привет мир</p>' }]} />)
    expect(screen.getByText('Привет мир')).toBeInTheDocument()
  })
  it('рендерит quote с автором', () => {
    render(<BlockRenderer blocks={[{ type: 'quote', text: 'Цитата', author: 'Автор' }]} />)
    expect(screen.getByText('Цитата')).toBeInTheDocument()
    expect(screen.getByText('— Автор')).toBeInTheDocument()
  })
  it('рендерит heading h2', () => {
    render(<BlockRenderer blocks={[{ type: 'heading', level: 2, text: 'Заголовок' }]} />)
    expect(screen.getByRole('heading', { level: 2, name: 'Заголовок' })).toBeInTheDocument()
  })
  it('рендерит photo с img', () => {
    render(<BlockRenderer blocks={[{ type: 'photo', s3Key: 'photos/test.jpg', caption: 'Подпись' }]} />)
    expect(screen.getByRole('img')).toBeInTheDocument()
    expect(screen.getByText('Подпись')).toBeInTheDocument()
  })
  it('не падает на пустом массиве', () => {
    render(<BlockRenderer blocks={[]} />)
  })
})
