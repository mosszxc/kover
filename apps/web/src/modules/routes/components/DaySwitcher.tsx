import { useEffect } from 'react'
import { cn } from '@/shared/lib/utils'
import { type DayOfWeek, DAY_LABELS, DAY_LABELS_FULL } from '@/shared/types'
import { useVisibleDays } from '@/shared/hooks/useVisibleDays'
import { useRouteStore } from '../store'
import { useClientStore } from '@/modules/clients'

function getTodayAsDay(): DayOfWeek {
  const jsDay = new Date().getDay()
  // JS: 0=Sun, 1=Mon ... 6=Sat → DayOfWeek: 0=Mon ... 6=Sun
  return (jsDay === 0 ? 6 : jsDay - 1) as DayOfWeek
}

export function DaySwitcher() {
  const selectedDay = useRouteStore((s) => s.selectedDay)
  const selectDay = useRouteStore((s) => s.selectDay)
  const clients = useClientStore((s) => s.clients)
  const visibleDays = useVisibleDays()

  useEffect(() => {
    const today = getTodayAsDay()
    selectDay(visibleDays.includes(today) ? today : (visibleDays[0] ?? 0))
  }, [selectDay, visibleDays])

  useEffect(() => {
    if (!visibleDays.includes(selectedDay)) {
      selectDay(visibleDays[0] ?? 0)
    }
  }, [visibleDays, selectedDay, selectDay])

  return (
    <nav className="flex gap-1 print:hidden" aria-label="Дни недели">
      {visibleDays.map((day) => {
        const isActive = selectedDay === day
        const count = clients.filter((c) => c.isActive && c.days.includes(day)).length

        return (
          <button
            key={day}
            type="button"
            onClick={() => selectDay(day)}
            className={cn(
              'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors min-w-[44px] min-h-[44px] justify-center',
              isActive
                ? 'bg-blue-600 text-white'
                : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground',
            )}
            aria-current={isActive ? 'true' : undefined}
          >
            <span className="lg:hidden">{DAY_LABELS[day]}</span>
            <span className="hidden lg:inline">{DAY_LABELS_FULL[day]}</span>
            {count > 0 && (
              <span
                className={cn(
                  'text-xs font-semibold',
                  isActive ? 'text-blue-200' : 'text-muted-foreground',
                )}
              >
                {count}
              </span>
            )}
          </button>
        )
      })}
    </nav>
  )
}
