export function formatDate(date: Date | string | null | undefined): string | null {
  if (!date) return null
  const d = new Date(date)
  const dayMonth = new Intl.DateTimeFormat('ru', { day: 'numeric', month: 'long' }).format(d)
  return `${dayMonth} ${d.getFullYear()}`
}
