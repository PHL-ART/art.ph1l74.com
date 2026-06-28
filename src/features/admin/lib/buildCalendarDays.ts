import type { AdminPost } from '../types'

export interface CalendarDay {
  num: number
  isCurrentMonth: boolean
  posts: AdminPost[]
}

export function buildCalendarDays(year: number, month: number, posts: AdminPost[]): CalendarDay[] {
  const firstDay = new Date(year, month - 1, 1)
  const daysInMonth = new Date(year, month, 0).getDate()
  const daysInPrevMonth = new Date(year, month - 1, 0).getDate()
  // Convert JS day (0=Sun) to Monday-first (0=Mon, 6=Sun)
  const firstWeekday = (firstDay.getDay() + 6) % 7
  const days: CalendarDay[] = []
  // Previous month padding
  for (let i = firstWeekday - 1; i >= 0; i--) {
    days.push({ num: daysInPrevMonth - i, isCurrentMonth: false, posts: [] })
  }
  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    const dayPosts = posts.filter(post => {
      const iso = post.status === 'PUBLISHED' ? post.publishedAt : post.scheduledAt
      if (!iso) return false
      const dt = new Date(iso)
      return dt.getFullYear() === year && dt.getMonth() + 1 === month && dt.getDate() === d
    })
    days.push({ num: d, isCurrentMonth: true, posts: dayPosts })
  }
  // Next month padding — complete last row
  let nextDay = 1
  while (days.length % 7 !== 0) {
    days.push({ num: nextDay++, isCurrentMonth: false, posts: [] })
  }
  return days
}
