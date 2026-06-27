// EmbedBlock intentionally skips sanitization: embeds are author-controlled
// (iframes, oEmbed HTML) and must render verbatim. Only use with trusted CMS content.
export function EmbedBlock({ html }: { html: string }) {
  return (
    <div
      className="w-full overflow-hidden rounded-[4px]"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
