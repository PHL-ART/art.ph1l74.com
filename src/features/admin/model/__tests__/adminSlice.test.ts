import { describe, it, expect } from 'vitest'
import adminReducer, { setMonth, setSelectedPostId, setChannelOverride } from '../adminSlice'

const today = new Date()

describe('adminSlice', () => {
  it('начальное состояние — текущий месяц и год', () => {
    const state = adminReducer(undefined, { type: '@@INIT' })
    expect(state.currentYear).toBe(today.getFullYear())
    expect(state.currentMonth).toBe(today.getMonth() + 1)
    expect(state.selectedPostId).toBeNull()
    expect(state.channelOverrides).toEqual({})
  })
  it('setMonth обновляет год и месяц', () => {
    const state = adminReducer(undefined, setMonth({ year: 2027, month: 3 }))
    expect(state.currentYear).toBe(2027)
    expect(state.currentMonth).toBe(3)
  })
  it('setSelectedPostId выбирает пост', () => {
    const state = adminReducer(undefined, setSelectedPostId('abc-123'))
    expect(state.selectedPostId).toBe('abc-123')
  })
  it('setSelectedPostId(null) снимает выбор', () => {
    const s1 = adminReducer(undefined, setSelectedPostId('abc'))
    const s2 = adminReducer(s1, setSelectedPostId(null))
    expect(s2.selectedPostId).toBeNull()
  })
  it('setChannelOverride устанавливает отдельный канал', () => {
    const state = adminReducer(undefined, setChannelOverride({ postId: 'p1', channel: 'vk', enabled: false }))
    expect(state.channelOverrides['p1'].vk).toBe(false)
  })
  it('setChannelOverride не затирает другой канал того же поста', () => {
    const s1 = adminReducer(undefined, setChannelOverride({ postId: 'p1', channel: 'vk', enabled: true }))
    const s2 = adminReducer(s1, setChannelOverride({ postId: 'p1', channel: 'tg', enabled: false }))
    expect(s2.channelOverrides['p1'].vk).toBe(true)
    expect(s2.channelOverrides['p1'].tg).toBe(false)
  })
  it('setChannelOverride разные посты независимы', () => {
    const s1 = adminReducer(undefined, setChannelOverride({ postId: 'p1', channel: 'vk', enabled: true }))
    const s2 = adminReducer(s1, setChannelOverride({ postId: 'p2', channel: 'vk', enabled: false }))
    expect(s2.channelOverrides['p1'].vk).toBe(true)
    expect(s2.channelOverrides['p2'].vk).toBe(false)
  })
})
