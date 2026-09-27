import { X } from 'lucide-react'

import { dismissToast, useToast } from '@/lib/toast'

export function ToastBanner() {
  const toast = useToast()
  if (!toast) return null
  return (
    <div
      key={toast.id}
      role="status"
      className="fixed inset-x-4 top-[max(1rem,env(safe-area-inset-top))] z-30 mx-auto flex max-w-sm animate-in items-start gap-3 rounded-lg border-l-4 border-l-fast bg-card px-4 py-3 text-sm shadow-soft fade-in slide-in-from-top-2"
    >
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{toast.title}</p>
        {toast.body && <p className="text-muted-foreground">{toast.body}</p>}
      </div>
      <button type="button" aria-label="Dismiss" onClick={dismissToast} className="text-muted-foreground">
        <X className="size-4" />
      </button>
    </div>
  )
}
