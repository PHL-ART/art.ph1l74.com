import DOMPurify from 'dompurify'

export function TextBlock({ html }: { html: string }) {
  const clean = typeof window !== 'undefined' ? DOMPurify.sanitize(html) : html
  return (
    <div
      className="font-body font-light text-body leading-[1.72] text-[17px]"
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  )
}
