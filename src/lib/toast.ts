import { useSyncExternalStore } from 'react'

// A single app-wide banner at the top of the screen (e.g. "12 h — Metabolic switch").

export interface Toast {
  id: number
  title: string
  body?: string
}

let current: Toast | null = null
let nextId = 1
let timer: ReturnType<typeof setTimeout> | undefined
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((notify) => notify())

export function showToast(title: string, body?: string, ms = 6000) {
  current = { id: nextId++, title, body }
  emit()
  clearTimeout(timer)
  timer = setTimeout(dismissToast, ms)
}

export function dismissToast() {
  current = null
  emit()
}

export function useToast(): Toast | null {
  return useSyncExternalStore(
    (notify) => {
      listeners.add(notify)
      return () => listeners.delete(notify)
    },
    () => current,
  )
}
