/**
 * Hands a calendar file to the phone: the share sheet where there is one
 * (so you can open it in Calendar or save it to Files), otherwise a download.
 */
export async function saveCalendarFile(fileName: string, ics: string): Promise<boolean> {
  const file = new File([ics], fileName, { type: 'text/calendar' })
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: fileName })
      return true
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return false
    }
  }
  const url = URL.createObjectURL(file)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  return true
}

/** <input type="datetime-local"> wants "YYYY-MM-DDTHH:MM" in local time. */
export function toLocalInput(date: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}T${p(date.getHours())}:${p(date.getMinutes())}`
}

export function fromLocalInput(value: string): Date | undefined {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return undefined
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? undefined : d
}
