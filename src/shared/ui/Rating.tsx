export function Rating({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-1 font-body text-sm text-caption">
      <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden>
        <path d="M6 0l1.35 4.15H12L8.33 6.72l1.35 4.15L6 8.3l-3.68 2.57 1.35-4.15L0 4.15h4.65L6 0z" />
      </svg>
      {value}
    </span>
  )
}
