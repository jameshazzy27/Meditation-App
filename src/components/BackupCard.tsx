import { Download, FileUp, TriangleAlert } from 'lucide-react'
import { useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  backupFileName,
  checkBackup,
  countBackup,
  exportBackup,
  importBackup,
  type Backup,
  type BackupCounts,
  type ImportMode,
} from '@/data'

const LAST_EXPORT_KEY = 'aura-last-export'

const countLabels: [keyof BackupCounts, string, string][] = [
  ['moods', 'mood', 'moods'],
  ['runs', 'run', 'runs'],
  ['kettlebellSessions', 'kettlebell session', 'kettlebell sessions'],
  ['complexes', 'complex', 'complexes'],
  ['meditations', 'meditation', 'meditations'],
]

function describeCounts(counts: BackupCounts): string {
  const parts = countLabels
    .filter(([key]) => counts[key] > 0)
    .map(([key, one, many]) => `${counts[key]} ${counts[key] === 1 ? one : many}`)
  return parts.length ? parts.join(', ') : 'nothing'
}

function readLastExport(): string | null {
  try {
    return localStorage.getItem(LAST_EXPORT_KEY)
  } catch {
    return null
  }
}

type Status = { kind: 'info' | 'error'; text: string } | null

/** Settings → Backup: download everything as a file, or bring a file back in. */
export function BackupCard() {
  const fileInput = useRef<HTMLInputElement>(null)
  const [lastExport, setLastExport] = useState(readLastExport)
  const [pending, setPending] = useState<{ backup: Backup; fileName: string } | null>(null)
  const [status, setStatus] = useState<Status>(null)
  const [busy, setBusy] = useState(false)

  async function download() {
    const backup = await exportBackup()
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = backupFileName()
    link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    try {
      localStorage.setItem(LAST_EXPORT_KEY, backup.exportedAt)
    } catch {
      // Only used for the "last backup" reminder.
    }
    setLastExport(backup.exportedAt)
    setStatus({ kind: 'info', text: `Backup saved: ${describeCounts(countBackup(backup.data))}.` })
  }

  async function chooseFile(file: File | undefined) {
    setStatus(null)
    setPending(null)
    if (!file) return
    let parsed: unknown
    try {
      parsed = JSON.parse(await file.text())
    } catch {
      setStatus({ kind: 'error', text: "That file couldn't be read — is it an Aura backup (.json)?" })
      return
    }
    const result = checkBackup(parsed)
    if (!result.ok) setStatus({ kind: 'error', text: result.error })
    else setPending({ backup: result.backup, fileName: file.name })
  }

  async function runImport(mode: ImportMode) {
    if (!pending) return
    if (
      mode === 'replace' &&
      !confirm('Replace everything? All entries and complexes in Aura now will be removed and swapped for the backup.')
    )
      return
    setBusy(true)
    try {
      const { added, updated } = await importBackup(pending.backup, mode)
      setStatus({
        kind: 'info',
        text:
          mode === 'replace'
            ? `Restored ${describeCounts(countBackup(pending.backup.data))}.`
            : `Merged: ${added} added, ${updated} updated. Everything else was already up to date.`,
      })
      setPending(null)
    } catch {
      setStatus({ kind: 'error', text: 'Import failed, and nothing was changed. Please try again.' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Backup</CardTitle>
        <CardDescription>
          Everything lives on this device only. Save a backup file now and then — to your files, iCloud or
          Google Drive — so nothing is lost if the phone is.
          {lastExport && (
            <span className="mt-1 block">
              Last backup:{' '}
              {new Date(lastExport).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <Button onClick={() => void download()}>
            <Download /> Export
          </Button>
          <Button variant="outline" onClick={() => fileInput.current?.click()}>
            <FileUp /> Import
          </Button>
        </div>
        <input
          ref={fileInput}
          type="file"
          accept=".json,application/json"
          className="hidden"
          aria-label="Backup file"
          onChange={(e) => {
            void chooseFile(e.target.files?.[0])
            e.target.value = '' // allow picking the same file again
          }}
        />

        {pending && (
          <div className="space-y-3 rounded-xl bg-muted p-4">
            <div className="text-sm">
              <p className="font-medium">{pending.fileName}</p>
              <p className="text-muted-foreground">
                {pending.backup.exportedAt &&
                  `Made ${new Date(pending.backup.exportedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })} · `}
                {describeCounts(countBackup(pending.backup.data))}
              </p>
            </div>
            <div className="space-y-2">
              <Button className="w-full" disabled={busy} onClick={() => void runImport('merge')}>
                Merge with what's here
              </Button>
              <Button variant="outline" className="w-full" disabled={busy} onClick={() => void runImport('replace')}>
                Replace everything
              </Button>
              <Button variant="ghost" className="w-full" disabled={busy} onClick={() => setPending(null)}>
                Cancel
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Merge adds anything missing and keeps the most recently edited version of each entry. Replace makes
              Aura exactly match the backup.
            </p>
          </div>
        )}

        {status && (
          <p
            role="status"
            className={
              status.kind === 'error'
                ? 'flex items-start gap-2 rounded-xl bg-destructive/10 p-3 text-sm text-destructive'
                : 'rounded-xl bg-primary/10 p-3 text-sm'
            }
          >
            {status.kind === 'error' && <TriangleAlert className="mt-0.5 size-4 shrink-0" />}
            {status.text}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
