import { Outlet } from 'react-router'

import { BottomNav } from '@/components/BottomNav'
import { ToastBanner } from '@/components/ToastBanner'
import { useFastAlerts } from '@/lib/fastAlerts'

export function AppShell() {
  useFastAlerts()
  return (
    <div className="relative mx-auto flex min-h-dvh max-w-md flex-col">
      <ToastBanner />
      <main className="flex-1 px-4 pt-[max(2rem,env(safe-area-inset-top))] pb-28">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
