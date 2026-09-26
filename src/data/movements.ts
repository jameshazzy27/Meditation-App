import type { Movement } from './types'

/**
 * Turns an old free-text movement (schema version 1) into its parts:
 * "Renegade rows × 6 per side" → { name: 'Renegade rows', reps: 6, eachArm: true }.
 * Text that doesn't fit the pattern is kept whole as the name.
 */
export function movementFromText(text: string): Movement {
  const trimmed = text.trim()
  const match = /^(.*?)\s*(?:[×xX*]\s*)(\d+)\s*(per side|each side|per arm|each arm|each|a side)?\s*$/.exec(trimmed)
  if (!match || !match[1]) return { name: trimmed }
  return { name: match[1], reps: Number(match[2]), ...(match[3] && { eachArm: true }) }
}
