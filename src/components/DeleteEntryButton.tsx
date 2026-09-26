import { Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'

/** Asks first, then deletes and runs onDeleted. */
export function DeleteEntryButton({
  what,
  onDelete,
  onDeleted,
}: {
  what: string
  onDelete: () => Promise<void>
  onDeleted: () => void
}) {
  async function remove() {
    if (!confirm(`Delete this ${what}? This can't be undone.`)) return
    await onDelete()
    onDeleted()
  }
  return (
    <Button
      type="button"
      variant="ghost"
      className="w-full text-destructive hover:text-destructive"
      onClick={() => void remove()}
    >
      <Trash2 /> Delete {what}
    </Button>
  )
}
