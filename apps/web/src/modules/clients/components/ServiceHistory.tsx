import { useMemo } from 'react'
import { History, Calendar, UserPen, UserPlus, UserX, Route } from 'lucide-react'
import { useServiceLogStore } from '@/shared/stores/serviceLogStore'
import type { ServiceEventType } from '@/shared/stores/serviceLogStore'
import { DAY_LABELS } from '@/shared/types'
import type { DayOfWeek } from '@/shared/types'

interface ServiceHistoryProps {
  clientId: string
}

const EVENT_CONFIG: Record<ServiceEventType, { label: string; className: string; icon: 'route' | 'schedule' | 'profile' | 'lifecycle' }> = {
  completed: { label: 'Выполнено', className: 'text-emerald-400', icon: 'route' },
  removed: { label: 'Убран из маршрута', className: 'text-red-400', icon: 'route' },
  transferred: { label: 'Перенесён', className: 'text-blue-400', icon: 'route' },
  paused: { label: 'Пауза', className: 'text-amber-400', icon: 'route' },
  unpaused: { label: 'Возврат с паузы', className: 'text-emerald-400', icon: 'route' },
  skipped: { label: 'Пропущен (неделя)', className: 'text-amber-400', icon: 'route' },
  schedule_changed: { label: 'Расписание изменено', className: 'text-violet-400', icon: 'schedule' },
  profile_changed: { label: 'Данные изменены', className: 'text-cyan-400', icon: 'profile' },
  client_created: { label: 'Клиент создан', className: 'text-emerald-400', icon: 'lifecycle' },
  client_deleted: { label: 'Клиент удалён', className: 'text-red-400', icon: 'lifecycle' },
}

const ICON_MAP = {
  route: Route,
  schedule: Calendar,
  profile: UserPen,
  lifecycle: UserPlus,
} as const

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function getEventDescription(type: ServiceEventType, targetDay?: DayOfWeek): string {
  const config = EVENT_CONFIG[type]
  if (type === 'transferred' && targetDay !== undefined) {
    return `${config.label} → ${DAY_LABELS[targetDay]}`
  }
  return config.label
}

export function ServiceHistory({ clientId }: ServiceHistoryProps) {
  const entries = useServiceLogStore((s) => s.entries)

  const clientEntries = useMemo(
    () => entries.filter((e) => e.clientId === clientId),
    [entries, clientId],
  )

  if (clientEntries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
        <History className="h-8 w-8" />
        <p className="text-sm">История обслуживания пока пуста</p>
        <p className="text-sm">Записи появятся при изменениях клиента или маршрутных событиях</p>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      <div className="grid grid-cols-[80px_36px_1fr] gap-x-3 px-2 pb-1 text-sm font-medium text-muted-foreground">
        <span>Дата</span>
        <span>День</span>
        <span>Событие</span>
      </div>
      <div className="max-h-[400px] space-y-0.5 overflow-y-auto">
        {clientEntries.map((entry) => {
          const config = EVENT_CONFIG[entry.type]
          const IconComponent = entry.type === 'client_deleted' ? UserX : ICON_MAP[config.icon]
          return (
            <div
              key={entry.id}
              className="grid grid-cols-[80px_36px_1fr] items-start gap-x-3 rounded-md px-2 py-1.5 text-sm hover:bg-muted/50"
            >
              <span className="text-muted-foreground">{formatDate(entry.timestamp)}</span>
              <span className="font-medium">{entry.day != null ? DAY_LABELS[entry.day] : '—'}</span>
              <div className="min-w-0">
                <div className={`flex items-center gap-1.5 ${config.className}`}>
                  <IconComponent className="h-3.5 w-3.5 shrink-0" />
                  <span>{getEventDescription(entry.type, entry.targetDay)}</span>
                  {entry.driverName && (
                    <span className="ml-auto shrink-0 text-muted-foreground">{entry.driverName}</span>
                  )}
                </div>
                {entry.details && (
                  <p className="mt-0.5 text-sm text-muted-foreground">{entry.details}</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
