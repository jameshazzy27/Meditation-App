/** "12" → 12; anything else (blank, "2.5", "abc") → undefined. */
export function parseWholeNumber(text: string): number | undefined {
  const trimmed = text.trim()
  return /^\d+$/.test(trimmed) ? Number(trimmed) : undefined
}

/** "12.5" or "12,5" (some phone keyboards) → 12.5; anything else → undefined. */
export function parseDecimal(text: string): number | undefined {
  const trimmed = text.trim().replace(',', '.')
  return /^\d+(\.\d+)?$|^\.\d+$/.test(trimmed) ? Number(trimmed) : undefined
}
