import { useEffect } from 'react'
import { cn } from '@/shared/lib/utils'
import { type DayOfWeek, DAY_LABELS } from '@/shared/types'
import { useRouteStore } from '../store'
import { useClientStore } from '@/modules/clients'

const DAYS: DayOfWeek[] = [0, 1, 2, 3, 4]

function getTodayAsDay(): DayOfWeek {
  const jsDay = new Date().getDay()
  // JS: 0=Sun, 1=Mon ... 6=Sat → DayOfWeek: 0=Mon ... 4=Fri
  if (jsDay >= 1 && jsDay <= 5) return (jsDay - 1) as DayOfWeek
  return 0 // weekends → Monday
}

export function DaySwitcher() {
  const selectedDay = useRouteStore((s) => s.selectedDay)
  const selectDay = useRouteStore((s) => s.selectDay)
  const clients = useClientStore((s) => s.clients)

  useEffect(() => {
    selectDay(getTodayAsDay())
  }, [selectDay])

  return (
    <nav className="flex gap-1" aria-label="Дни недели">
      {DAYS.map((day) => {
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
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-300',
            )}
            aria-current={isActive ? 'true' : undefined}
          >
            {DAY_LABELS[day]}
            {count > 0 && (
              <span
                className={cn(
                  'text-xs font-semibold',
                  isActive ? 'text-blue-200' : 'text-slate-500',
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
