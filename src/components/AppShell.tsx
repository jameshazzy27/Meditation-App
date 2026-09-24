import { Outlet } from 'react-router'

import { BottomNav } from '@/components/BottomNav'

export function AppShell() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col">
      <main className="flex-1 px-4 pt-[max(1.5rem,env(safe-area-inset-top))] pb-28">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
