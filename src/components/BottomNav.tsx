import { CalendarDays, ChartLine, History, PlusCircle, Settings, type LucideIcon } from 'lucide-react'
import { Link, useLocation } from 'react-router'

import { useIsFocusMode } from '@/lib/focusMode'
import { cn } from '@/lib/utils'

const tabs: { to: string; label: string; icon: LucideIcon }[] = [
  { to: '/', label: 'Today', icon: CalendarDays },
  { to: '/history', label: 'History', icon: History },
  { to: '/log', label: 'Log', icon: PlusCircle },
  { to: '/trends', label: 'Trends', icon: ChartLine },
  { to: '/settings', label: 'Settings', icon: Settings },
]

/** Which tab a page belongs to — other days count as Today, sub-pages as their section. */
function isTabActive(tab: string, pathname: string): boolean {
  if (tab === '/') return pathname === '/' || pathname.startsWith('/day/') || pathname.startsWith('/meditation/')
  return pathname === tab || pathname.startsWith(`${tab}/`)
}

export function BottomNav() {
  const { pathname } = useLocation()
  if (useIsFocusMode()) return null

  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 border-t bg-background/85 backdrop-blur-md">
      <ul className="mx-auto grid max-w-md grid-cols-5 pb-[env(safe-area-inset-bottom)]">
        {tabs.map(({ to, label, icon: Icon }) => {
          const active = isTabActive(to, pathname)
          return (
            <li key={to}>
              <Link
                to={to}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex flex-col items-center gap-1 pt-2.5 pb-3 text-[11px] font-medium transition-colors',
                  active ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <span
                  className={cn(
                    'grid h-8 w-12 place-items-center rounded-full transition-colors',
                    active && 'bg-primary/12',
                  )}
                >
                  <Icon className="size-5.5" strokeWidth={active ? 2.25 : 1.75} />
                </span>
                {label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
