import { describe, it, expect } from 'vitest'
import { toSlug } from '../transliterate'

describe('toSlug', () => {
  it('транслитерирует русский текст', () => {
    expect(toSlug('Привет мир')).toBe('privet-mir')
  })
  it('строчные для латиницы', () => {
    expect(toSlug('Hello World')).toBe('hello-world')
  })
  it('смешанный текст с числами', () => {
    expect(toSlug('Топ фильмов 2025')).toBe('top-filmov-2025')
  })
  it('схлопывает пробелы', () => {
    expect(toSlug('Топ  фильмов')).toBe('top-filmov')
  })
  it('убирает дефисы по краям', () => {
    expect(toSlug(' привет ')).toBe('privet')
  })
  it('пустая строка', () => {
    expect(toSlug('')).toBe('')
  })
})
