import { cn } from '@/shared/lib/utils'
import type { PaymentStatus } from '../types'
import { PAYMENT_STATUS_CONFIG } from '../types'

interface PaymentIndicatorProps {
  status: PaymentStatus
  debt?: number
  compact?: boolean
}

export function PaymentIndicator({ status, debt, compact = false }: PaymentIndicatorProps) {
  const config = PAYMENT_STATUS_CONFIG[status]

  if (compact) {
    return (
      <span
        className={cn('inline-block size-2 rounded-full', {
          'bg-emerald-400': status === 'paid',
          'bg-amber-400': status === 'partial',
          'bg-red-400': status === 'overdue',
          'bg-muted-foreground': status === 'pending',
        })}
        title={`${config.label}${debt ? ` (${debt.toLocaleString('ru-RU')} ₽)` : ''}`}
      />
    )
  }

  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold', config.className)}>
      {config.label}
      {debt != null && debt > 0 && (
        <span className="tabular-nums">{debt.toLocaleString('ru-RU')}{'\u00a0'}₽</span>
      )}
    </span>
  )
}
