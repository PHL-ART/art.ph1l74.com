'use client'

import { useEffect } from 'react'

export function ViewCounter({ postSlug }: { postSlug: string }) {
  useEffect(() => {
    fetch(`/api/views/${postSlug}`, { method: 'POST' })
  }, [postSlug])
  return null
}
