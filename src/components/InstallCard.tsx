import { CircleCheck, Download, Share } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

// Chrome/Edge on Android offer their own install prompt, which we can trigger from a button.
interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function isInstalled() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent)
// An iPhone browser with Bluetooth is one of the add-on browsers like Bluefy (Safari has none).
const isBluetoothBrowserOnIOS = isIOS && !!navigator.bluetooth

/** Settings → how to put Aura on the home screen, or confirmation that it's there. */
export function InstallCard() {
  const [installed, setInstalled] = useState(isInstalled)
  const [prompt, setPrompt] = useState<InstallPromptEvent | null>(null)

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault()
      setPrompt(e as InstallPromptEvent)
    }
    const onInstalled = () => setInstalled(true)
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  if (installed) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CircleCheck className="size-5 text-primary" /> Installed
          </CardTitle>
          <CardDescription>Aura is on your home screen and works with no connection.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Install Aura</CardTitle>
        <CardDescription>
          Add it to your home screen to open it like an app — full screen, and working offline.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {prompt ? (
          <Button
            onClick={async () => {
              await prompt.prompt()
              if ((await prompt.userChoice).outcome === 'accepted') setPrompt(null)
            }}
          >
            <Download /> Install
          </Button>
        ) : isBluetoothBrowserOnIOS ? (
          <p className="text-sm">
            For a home-screen icon that opens here: in the <strong>Shortcuts</strong> app, make a shortcut with{' '}
            <strong>Open App → this browser</strong>, name it Aura, then <strong>Add to Home Screen</strong>.
          </p>
        ) : isIOS ? (
          <p className="flex flex-wrap items-center gap-1 text-sm">
            In Safari, tap <Share className="inline size-4 text-primary" aria-label="Share" /> Share, then{' '}
            <strong>Add to Home Screen</strong>.
          </p>
        ) : (
          <p className="text-sm">
            In your browser's menu (⋮), choose <strong>Install app</strong> or <strong>Add to Home screen</strong>.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
