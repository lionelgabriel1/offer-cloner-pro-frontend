const UNSAFE_CSS_VALUE = /(?:url\s*\(|expression\s*\(|javascript\s*:|@import|-moz-binding|behavior\s*:)/i

/** Permit only inert local paths/fragments and absolute HTTP(S) resources in previews. */
export function safePreviewUrl(value: unknown): string | undefined {
  if (typeof value !== 'string' || value.length === 0 || value.length > 4096) return undefined
  const candidate = value.trim()
  if (!candidate || /[\u0000-\u001f\\]/.test(candidate)) return undefined
  if (candidate.startsWith('#')) return candidate
  if (candidate.startsWith('/') && !candidate.startsWith('//')) return candidate
  try {
    const parsed = new URL(candidate)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? candidate : undefined
  } catch {
    return undefined
  }
}

/** Keep captured inline styles from initiating resource loads or executing legacy CSS. */
export function isSafePreviewCssValue(value: unknown): value is string {
  return typeof value === 'string' &&
    value.length <= 160 &&
    !/[<>;{}]/.test(value) &&
    !UNSAFE_CSS_VALUE.test(value)
}
