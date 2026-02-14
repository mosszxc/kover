import { useMemo } from 'react'
import { History } from 'lucide-react'
import { useServiceLogStore } from '@/shared/stores/serviceLogStore'
import type { ServiceEventType } from '@/shared/stores/serviceLogStore'
import { DAY_LABELS } from '@/shared/types'
import type { DayOfWeek } from '@/shared/types'

interface ServiceHistoryProps {
  clientId: string
}

const EVENT_CONFIG: Record<ServiceEventType, { label: string; className: string }> = {
  completed: { label: 'Выполнено', className: 'text-emerald-400' },
  removed: { label: 'Убран из маршрута', className: 'text-red-400' },
  transferred: { label: 'Перенесён', className: 'text-blue-400' },
  paused: { label: 'Пауза', className: 'text-amber-400' },
  unpaused: { label: 'Возврат с паузы', className: 'text-emerald-400' },
  skipped: { label: 'Пропущен (неделя)', className: 'text-amber-400' },
}

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
        <p className="text-xs">Записи появятся при выполнении, удалении или переносе точки</p>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      <div className="grid grid-cols-[80px_36px_1fr_auto] gap-x-3 px-2 pb-1 text-xs font-medium text-muted-foreground">
        <span>Дата</span>
        <span>День</span>
        <span>Статус</span>
        <span>Водитель</span>
      </div>
      <div className="max-h-[400px] space-y-0.5 overflow-y-auto">
        {clientEntries.map((entry) => {
          const config = EVENT_CONFIG[entry.type]
          return (
            <div
              key={entry.id}
              className="grid grid-cols-[80px_36px_1fr_auto] items-center gap-x-3 rounded-md px-2 py-1.5 text-sm hover:bg-muted/50"
            >
              <span className="text-muted-foreground">{formatDate(entry.timestamp)}</span>
              <span className="font-medium">{DAY_LABELS[entry.day]}</span>
              <span className={config.className}>
                {getEventDescription(entry.type, entry.targetDay)}
              </span>
              <span className="text-muted-foreground">{entry.driverName ?? '—'}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
