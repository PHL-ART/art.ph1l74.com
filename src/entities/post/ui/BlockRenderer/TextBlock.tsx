import DOMPurify from 'isomorphic-dompurify'

interface TextBlockProps {
  html: string
  isLead?: boolean
}

export function TextBlock({ html, isLead }: TextBlockProps) {
  const clean = DOMPurify.sanitize(html, { ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'br', 'p', 'span'], ALLOWED_ATTR: ['href', 'target', 'rel'] })

  if (isLead) {
    return (
      <p
        className="font-display font-bold lowercase"
        style={{
          fontSize: 'clamp(20px, 2vw, 26px)',
          lineHeight: '1.3',
          letterSpacing: '-0.01em',
          color: 'var(--color-text)',
          marginBottom: '28px',
        }}
        dangerouslySetInnerHTML={{ __html: clean }}
      />
    )
  }

  const bodyClean = DOMPurify.sanitize(html, { ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'br', 'p', 'span', 'ul', 'ol', 'li'], ALLOWED_ATTR: ['href', 'target', 'rel'] })
  return (
    <div
      className="font-body"
      style={{
        fontWeight: 300,
        fontSize: '17px',
        lineHeight: '1.72',
        color: 'var(--color-text-body)',
        marginBottom: '20px',
      }}
      dangerouslySetInnerHTML={{ __html: bodyClean }}
    />
  )
}
