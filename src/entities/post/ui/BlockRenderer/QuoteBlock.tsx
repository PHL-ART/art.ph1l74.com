export function QuoteBlock({ text, author }: { text: string; author?: string }) {
  return (
    <blockquote className="pl-5 border-l-[4px] border-accent my-6">
      <p className="font-editorial italic text-body text-[19px] leading-[1.6]">{text}</p>
      {author && (
        <cite className="block mt-2 font-body text-[13px] text-caption not-italic">
          — {author}
        </cite>
      )}
    </blockquote>
  )
}
