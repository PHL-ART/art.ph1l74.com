import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ErrorContent } from '../ErrorContent'

describe('ErrorContent', () => {
  const defaultProps = {
    code: '404',
    label: 'страница не найдена',
    message: 'такой страницы не существует',
    action: <a href="/">на главную</a>,
  }

  it('рендерит код ошибки', () => {
    render(<ErrorContent {...defaultProps} />)
    expect(screen.getByText('404')).toBeInTheDocument()
  })

  it('рендерит лейбл', () => {
    render(<ErrorContent {...defaultProps} />)
    expect(screen.getByText('страница не найдена')).toBeInTheDocument()
  })

  it('рендерит сообщение', () => {
    render(<ErrorContent {...defaultProps} />)
    expect(screen.getByText('такой страницы не существует')).toBeInTheDocument()
  })

  it('рендерит action-элемент', () => {
    render(<ErrorContent {...defaultProps} />)
    expect(screen.getByRole('link', { name: 'на главную' })).toBeInTheDocument()
  })

  it('рендерит кастомный код (восклицательный знак)', () => {
    render(<ErrorContent {...defaultProps} code="!" label="что-то пошло не так" />)
    expect(screen.getByText('!')).toBeInTheDocument()
  })
})
