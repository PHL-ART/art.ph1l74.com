// Characters that would break out of an HTML attribute or inject markup
const DANGEROUS_CHARS = /["'<>`\s]/

/** Accepted raster image extensions — SVG intentionally excluded (can embed JS). */
const SAFE_EXTS = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif'])

/**
 * Returns true only for http/https URLs pointing to safe raster image extensions
 * that contain no characters that could break HTML attribute quoting.
 */
export function isSafeImageUrl(raw: string): boolean {
  if (DANGEROUS_CHARS.test(raw)) return false
  try {
    const parsed = new URL(raw)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false
    const ext = parsed.pathname.split('.').pop()?.toLowerCase() ?? ''
    return SAFE_EXTS.has(ext)
  } catch {
    return false
  }
}
