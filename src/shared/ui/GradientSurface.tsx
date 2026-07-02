'use client'

import { useId } from 'react'
import { cn } from '@/shared/lib/cn'

interface GradientSurfaceProps {
  gradient?: string
  children: React.ReactNode
  className?: string
}

export function GradientSurface({ gradient, children, className }: GradientSurfaceProps) {
  const filterId = useId()

  return (
    <div
      className={cn('relative overflow-hidden', className)}
      style={gradient ? { background: gradient } : undefined}
    >
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.07] pointer-events-none mix-blend-soft-light"
        aria-hidden
      >
        <filter id={filterId}>
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#${filterId})`} />
      </svg>
      {children}
    </div>
  )
}
