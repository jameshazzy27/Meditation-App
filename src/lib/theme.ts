import { useSyncExternalStore } from 'react'

// Light/dark preference. It's a per-device display setting rather than journal
// data, so it lives in localStorage instead of the data layer.
// index.html applies the saved choice before first paint; keep the key in sync.
export type ThemePreference = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'aura-theme'
const systemDark = window.matchMedia('(prefers-color-scheme: dark)')
const listeners = new Set<() => void>()

let preference: ThemePreference = readSaved()

function readSaved(): ThemePreference {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'light' || saved === 'dark') return saved
  } catch {
    // Storage unavailable (e.g. private mode) — fall back to the device setting.
  }
  return 'system'
}

function apply() {
  const dark = preference === 'dark' || (preference === 'system' && systemDark.matches)
  document.documentElement.classList.toggle('dark', dark)
}

export function initTheme() {
  apply()
  systemDark.addEventListener('change', apply)
}

export function setThemePreference(next: ThemePreference) {
  preference = next
  try {
    if (next === 'system') localStorage.removeItem(STORAGE_KEY)
    else localStorage.setItem(STORAGE_KEY, next)
  } catch {
    // Ignore — the theme still applies for this visit.
  }
  apply()
  listeners.forEach((notify) => notify())
}

export function useThemePreference() {
  return useSyncExternalStore(
    (notify) => {
      listeners.add(notify)
      return () => listeners.delete(notify)
    },
    () => preference,
  )
}
