import { useEffect, useSyncExternalStore } from 'react'

// "Focus mode" hides the bottom navigation — used during a meditation so a
// stray tap can't leave the session.

let on = false
const listeners = new Set<() => void>()

function set(value: boolean) {
  on = value
  listeners.forEach((notify) => notify())
}

export function useFocusMode(active: boolean) {
  useEffect(() => {
    if (!active) return
    set(true)
    return () => set(false)
  }, [active])
}

export function useIsFocusMode() {
  return useSyncExternalStore(
    (notify) => {
      listeners.add(notify)
      return () => listeners.delete(notify)
    },
    () => on,
  )
}
