// System notifications, where the browser allows them. They only work while
// Aura is open (in the background or on screen) — for alerts when it's
// closed, use the calendar reminders instead.

export type NotifyAvailability = 'unsupported' | 'default' | 'granted' | 'denied'

export function notifyAvailability(): NotifyAvailability {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported'
  return Notification.permission as NotifyAvailability
}

export async function askToNotify(): Promise<NotifyAvailability> {
  if (notifyAvailability() === 'unsupported') return 'unsupported'
  try {
    return (await Notification.requestPermission()) as NotifyAvailability
  } catch {
    return notifyAvailability()
  }
}

export async function notify(title: string, body: string) {
  if (notifyAvailability() !== 'granted') return
  const options = { body, icon: `${import.meta.env.BASE_URL}pwa-192.png`, tag: 'aura-fast' }
  try {
    // Android Chrome only allows notifications through the service worker.
    const registration = await navigator.serviceWorker?.getRegistration()
    if (registration) return await registration.showNotification(title, options)
    new Notification(title, options)
  } catch {
    // Not allowed here — the in-app banner still shows.
  }
}
