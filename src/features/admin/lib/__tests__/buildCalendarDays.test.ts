import { describe, it, expect } from 'vitest'
import { buildCalendarDays } from '../buildCalendarDays'
import type { AdminPost } from '../../types'

function makePost(overrides: Partial<AdminPost> = {}): AdminPost {
  return {
    id: 'p1', title: 'тест', slug: 'test', status: 'SCHEDULED',
    scheduledAt: '2026-06-15T12:00:00.000Z', publishedAt: null,
    coverImageKey: null, viewCount: 0, categories: [],
    ...overrides,
  }
}

describe('buildCalendarDays', () => {
  it('возвращает длину кратную 7', () => {
    const days = buildCalendarDays(2026, 6, [])
    expect(days.length % 7).toBe(0)
    expect(days.length).toBeGreaterThanOrEqual(28)
  })
  it('июнь 2026 начинается с понедельника — нет отступа', () => {
    const days = buildCalendarDays(2026, 6, [])
    expect(days[0]).toMatchObject({ num: 1, isCurrentMonth: true })
  })
  it('январь 2026 начинается с четверга — 3 дня отступа', () => {
    const days = buildCalendarDays(2026, 1, [])
    expect(days[0]).toMatchObject({ isCurrentMonth: false })
    expect(days[3]).toMatchObject({ num: 1, isCurrentMonth: true })
  })
  it('SCHEDULED пост размещается по scheduledAt', () => {
    const post = makePost({ scheduledAt: '2026-06-15T12:00:00.000Z', status: 'SCHEDULED' })
    const days = buildCalendarDays(2026, 6, [post])
    const day15 = days.find(d => d.num === 15 && d.isCurrentMonth)
    expect(day15?.posts).toHaveLength(1)
    expect(day15?.posts[0].id).toBe('p1')
  })
  it('PUBLISHED пост размещается по publishedAt, не scheduledAt', () => {
    const post = makePost({ status: 'PUBLISHED', scheduledAt: '2026-06-10T12:00:00.000Z', publishedAt: '2026-06-22T12:00:00.000Z' })
    const days = buildCalendarDays(2026, 6, [post])
    const day22 = days.find(d => d.num === 22 && d.isCurrentMonth)
    const day10 = days.find(d => d.num === 10 && d.isCurrentMonth)
    expect(day22?.posts).toHaveLength(1)
    expect(day10?.posts).toHaveLength(0)
  })
  it('пост без даты не появляется ни в одном дне', () => {
    const post = makePost({ scheduledAt: null, publishedAt: null, status: 'DRAFT' })
    const days = buildCalendarDays(2026, 6, [post])
    expect(days.every(d => d.posts.length === 0)).toBe(true)
  })
  it('дим-дни имеют пустой массив постов', () => {
    const days = buildCalendarDays(2026, 1, [])
    const dimDays = days.filter(d => !d.isCurrentMonth)
    expect(dimDays.every(d => d.posts.length === 0)).toBe(true)
  })
})
