import Image from 'next/image'

interface SocialLinkItem {
  id: string
  url: string
  social: { id: string; name: string; iconUrl: string | null }
}

function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' || parsed.protocol === 'http:'
  } catch {
    return false
  }
}

export function SocialLinks({ links }: { links: SocialLinkItem[] }) {
  if (links.length === 0) return null
  return (
    <aside className="mt-12 pt-8 border-t border-hairline">
      <p className="font-nav uppercase tracking-widest text-[11px] text-caption mb-4">Доступно также в</p>
      <ul className="flex flex-wrap gap-3">
        {links.filter(({ url }) => isSafeUrl(url)).map(({ id, url, social }) => (
          <li key={id}>
            <a href={url} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-[4px] border border-hairline text-caption hover:text-text hover:border-text/30 transition-colors min-h-[44px]">
              {social.iconUrl && <Image src={social.iconUrl} alt="" width={16} height={16} />}
              <span className="font-nav font-semibold uppercase tracking-widest text-[11px]">{social.name}</span>
            </a>
          </li>
        ))}
      </ul>
    </aside>
  )
}
