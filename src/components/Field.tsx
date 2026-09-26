import type { ReactNode } from 'react'

import { Label } from '@/components/ui/label'

/** A form field: label on top, the input, then an error message if there is one. */
export function Field({
  label,
  hint,
  htmlFor,
  error,
  children,
}: {
  label: string
  hint?: string
  htmlFor?: string
  error?: string
  children: ReactNode
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>
        {label}
        {hint && <span className="font-normal text-muted-foreground">{hint}</span>}
      </Label>
      {children}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
