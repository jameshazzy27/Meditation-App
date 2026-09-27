import { ShieldCheck } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { hasAnyEntries, useLiveData } from '@/data'
import { backupReminderDue, saveBackupFile, snoozeBackupReminder, useLastBackup, useReminderSnoozedAt } from '@/lib/backupFile'

/** A gentle nudge on Today when it's been two weeks (or ever) since the last backup. */
export function BackupReminder() {
  const lastBackup = useLastBackup()
  const snoozedAt = useReminderSnoozedAt()
  const hasData = useLiveData(() => hasAnyEntries())
  const [busy, setBusy] = useState(false)
  const [now] = useState(() => Date.now())

  if (!hasData || !backupReminderDue(lastBackup, snoozedAt, now)) return null

  const days = lastBackup ? Math.floor((now - Date.parse(lastBackup)) / 86400000) : undefined
  return (
    <div className="flex gap-3 rounded-2xl border border-primary/30 bg-primary/8 p-4">
      <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" />
      <div className="min-w-0 flex-1 space-y-3 text-sm">
        <div>
          <p className="font-semibold">Guard your saga</p>
          <p className="text-muted-foreground">
            {days === undefined ? 'You haven’t saved a backup yet.' : `Your last backup was ${days} days ago.`} Your
            journal lives only in this app on this phone — save a copy to Files or iCloud.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            disabled={busy}
            onClick={async () => {
              setBusy(true)
              try {
                await saveBackupFile()
              } finally {
                setBusy(false)
              }
            }}
          >
            Back up now
          </Button>
          <Button size="sm" variant="ghost" onClick={snoozeBackupReminder}>
            Later
          </Button>
        </div>
      </div>
    </div>
  )
}
