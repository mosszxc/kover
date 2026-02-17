import { AlertTriangle, Package, CreditCard, CalendarClock, ArrowRight } from 'lucide-react'
import { Link } from 'react-router'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import type { Alert } from '../types'

const ALERT_CONFIG = {
  overload: { icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-600/10 border-red-600/20' },
  shortage: { icon: Package, color: 'text-amber-400', bg: 'bg-amber-600/10 border-amber-600/20' },
  overdue: { icon: CreditCard, color: 'text-red-400', bg: 'bg-red-600/10 border-red-600/20' },
  exceptions: { icon: CalendarClock, color: 'text-blue-400', bg: 'bg-blue-600/10 border-blue-600/20' },
} as const

interface AlertsListProps {
  alerts: Alert[]
}

export function AlertsList({ alerts }: AlertsListProps) {
  if (alerts.length === 0) {
    return (
      <div className="rounded-lg border border-emerald-600/20 bg-emerald-600/10 p-4">
        <p className="text-sm font-medium text-emerald-400">
          Проблем не обнаружено
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {alerts.map((alert) => {
        const config = ALERT_CONFIG[alert.type]
        const Icon = config.icon
        return (
          <div
            key={alert.id}
            className={cn('flex items-center gap-3 rounded-lg border p-3', config.bg)}
          >
            <Icon className={cn('size-5 shrink-0', config.color)} />
            <div className="flex-1 min-w-0">
              <div className={cn('text-sm font-medium', config.color)}>
                {alert.title}
              </div>
              <div className="text-sm text-muted-foreground">
                {alert.description}
              </div>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to={alert.actionUrl}>
                {alert.actionLabel}
                <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </div>
        )
      })}
    </div>
  )
}
