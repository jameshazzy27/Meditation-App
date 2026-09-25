import { Outlet } from 'react-router'

import { BottomNav } from '@/components/BottomNav'

export function AppShell() {
  return (
    <div className="relative mx-auto flex min-h-dvh max-w-md flex-col">
      {/* The soft "aura" glow behind the top of every screen */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-80 bg-[radial-gradient(ellipse_80%_70%_at_50%_-10%,var(--glow),transparent)]"
      />
      <main className="flex-1 px-4 pt-[max(2rem,env(safe-area-inset-top))] pb-28">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
