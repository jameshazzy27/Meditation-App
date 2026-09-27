import { useSyncExternalStore } from 'react'

import { backupFileName, countBackup, exportBackup, type BackupCounts } from '@/data'

// Saving a backup file, and remembering (on this device) when that last happened.

const LAST_EXPORT_KEY = 'aura-last-export'
const SNOOZE_KEY = 'aura-backup-reminder-snoozed'
const listeners = new Set<() => void>()

function read(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {
    // Only used for reminders.
  }
  listeners.forEach((notify) => notify())
}

const subscribe = (notify: () => void) => {
  listeners.add(notify)
  return () => listeners.delete(notify)
}

/** When a backup was last saved on this device (ISO time), or null. */
export function useLastBackup(): string | null {
  return useSyncExternalStore(subscribe, () => read(LAST_EXPORT_KEY))
}

/** When the backup reminder was last dismissed with "Later" (ISO time), or null. */
export function useReminderSnoozedAt(): string | null {
  return useSyncExternalStore(subscribe, () => read(SNOOZE_KEY))
}

export function snoozeBackupReminder() {
  write(SNOOZE_KEY, new Date().toISOString())
}

/**
 * Saves everything as a backup file. Where the phone offers a share sheet
 * (iPhone, incl. browsers like Bluefy), that opens so you can pick "Save to
 * Files" or iCloud; otherwise the file downloads.
 * Returns what was saved, or null if you cancelled the share sheet.
 */
export async function saveBackupFile(): Promise<BackupCounts | null> {
  const backup = await exportBackup()
  const json = JSON.stringify(backup, null, 2)
  const name = backupFileName()
  const file = new File([json], name, { type: 'application/json' })

  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'Aura backup' })
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return null
      download(json, name) // sharing failed for another reason — fall back to a download
    }
  } else {
    download(json, name)
  }
  write(LAST_EXPORT_KEY, backup.exportedAt)
  return countBackup(backup.data)
}

function download(json: string, name: string) {
  const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }))
  const link = document.createElement('a')
  link.href = url
  link.download = name
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

const DAY_MS = 24 * 60 * 60 * 1000

/** Nudge after 14 days without a backup; "Later" quiets it for 3 days. */
export function backupReminderDue(lastBackup: string | null, snoozedAt: string | null, now = Date.now()): boolean {
  if (snoozedAt && now - Date.parse(snoozedAt) < 3 * DAY_MS) return false
  return !lastBackup || now - Date.parse(lastBackup) >= 14 * DAY_MS
}
