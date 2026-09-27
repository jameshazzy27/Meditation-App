import { useEffect } from 'react'

/** Keeps the screen on while `active` is true (where the browser allows it). */
export function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active || !('wakeLock' in navigator)) return
    let lock: WakeLockSentinel | null = null
    let cancelled = false
    const request = async () => {
      try {
        lock = await navigator.wakeLock.request('screen')
      } catch {
        // Not allowed right now (e.g. low battery) — the timer still works.
      }
    }
    // The browser drops the lock when you switch away; take it again on return.
    const onVisible = () => {
      if (document.visibilityState === 'visible' && !cancelled) void request()
    }
    void request()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisible)
      void lock?.release()
    }
  }, [active])
}
