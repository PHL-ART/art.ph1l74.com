'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Lightbox } from '@/shared/ui/Lightbox'

interface Props {
  src: string
  caption?: string
}

export function PhotoClickable({ src, caption }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <div
        className="relative w-full aspect-[3/2] rounded-[2px] overflow-hidden cursor-zoom-in"
        onClick={() => setOpen(true)}
      >
        <Image
          src={src}
          alt={caption ?? ''}
          fill
          className="object-cover transition-transform duration-300 hover:scale-[1.02]"
          sizes="(max-width: 768px) 100vw, 860px"
        />
      </div>

      {open && (
        <Lightbox src={src} alt={caption} onClose={() => setOpen(false)} />
      )}
    </>
  )
}
