import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const title = searchParams.get('title') ?? 'PHL·ART'
  const category = searchParams.get('category') ?? ''

  return new ImageResponse(
    (
      <div
        style={{
          background: '#0e0a0b',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          padding: '60px',
          position: 'relative',
        }}
      >
        {/* Brand accent gradient */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(80% 80% at 10% 0%, rgba(255,59,47,0.22) 0%, transparent 60%)',
          }}
        />

        {/* Site name — top right */}
        <div
          style={{
            position: 'absolute',
            top: '48px',
            right: '60px',
            color: 'rgba(255,255,255,0.38)',
            fontSize: '18px',
            fontWeight: 700,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
          }}
        >
          PHL·ART
        </div>

        {/* Category */}
        {category ? (
          <div
            style={{
              color: '#ff3b30',
              fontSize: '16px',
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              marginBottom: '20px',
            }}
          >
            {category}
          </div>
        ) : null}

        {/* Title */}
        <div
          style={{
            color: '#ffffff',
            fontSize: title.length > 60 ? '44px' : '56px',
            fontWeight: 700,
            lineHeight: 1.05,
            letterSpacing: '-0.02em',
            maxWidth: '900px',
          }}
        >
          {title}
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  )
}
