'use client'

import { useEffect, useCallback } from 'react'
import Image from 'next/image'

interface Props {
  src: string
  alt?: string
  onClose: () => void
}

export function Lightbox({ src, alt, onClose }: Props) {
  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
  }, [onClose])

  useEffect(() => {
    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [handleKey])

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.92)' }}
      onClick={onClose}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        aria-label="Закрыть"
        className="absolute top-5 right-5 flex items-center justify-center"
        style={{
          width: 40,
          height: 40,
          background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.15)',
          color: 'rgba(255,255,255,0.7)',
          cursor: 'pointer',
          fontSize: 20,
          lineHeight: 1,
        }}
      >
        ×
      </button>

      {/* Image — stop propagation so clicking the image itself doesn't close */}
      <div
        className="relative"
        style={{ maxWidth: 'min(92vw, 1200px)', maxHeight: '90vh', width: '100%' }}
        onClick={e => e.stopPropagation()}
      >
        <Image
          src={src}
          alt={alt ?? ''}
          width={1200}
          height={800}
          className="object-contain"
          style={{ width: '100%', height: 'auto', maxHeight: '90vh', display: 'block' }}
          priority
        />
        {alt && (
          <p
            className="font-body text-center"
            style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginTop: 10 }}
          >
            {alt}
          </p>
        )}
      </div>
    </div>
  )
}
