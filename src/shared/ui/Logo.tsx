import Link from 'next/link'

interface LogoProps {
  size?: number
  href?: string
}

export function Logo({ size = 36, href = '/' }: LogoProps) {
  const img = (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo-white.svg" alt="PHL·ART" width={size} height={size} className="logo-dark" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo-black.svg" alt="" width={size} height={size} aria-hidden className="logo-light" />
    </>
  )
  return href ? <Link href={href} className="flex-shrink-0">{img}</Link> : <>{img}</>
}
