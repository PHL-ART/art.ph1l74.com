import Image from 'next/image'
import Link from 'next/link'

interface LogoProps {
  variant?: 'white' | 'black'
  size?: number
  href?: string
}

export function Logo({ variant = 'white', size = 36, href = '/' }: LogoProps) {
  const src = variant === 'white' ? '/logo-white.svg' : '/logo-black.svg'
  const img = <Image src={src} alt="PHL·ART" width={size} height={size} priority />
  return href ? <Link href={href}>{img}</Link> : img
}
