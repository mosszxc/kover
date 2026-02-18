import { cn } from '@/shared/lib/utils'
import { StatusHint } from '@/shared/ui/status-hint'
import type { PaymentStatus } from '../types'
import { PAYMENT_STATUS_CONFIG } from '../types'

const PAYMENT_HINTS: Record<PaymentStatus, { title: string; action?: string; variant: 'info' | 'warning' | 'error' | 'muted' }> = {
  paid: { title: 'Оплачен', variant: 'info' },
  partial: { title: 'Частично оплачен', action: 'Зафиксируйте остаток оплаты.', variant: 'warning' },
  overdue: { title: 'Просрочена оплата', action: 'Свяжитесь с клиентом или зафиксируйте оплату.', variant: 'error' },
  pending: { title: 'Ожидает оплаты', variant: 'muted' },
}

interface PaymentIndicatorProps {
  status: PaymentStatus
  debt?: number
  compact?: boolean
}

export function PaymentIndicator({ status, debt, compact = false }: PaymentIndicatorProps) {
  const config = PAYMENT_STATUS_CONFIG[status]
  const hint = PAYMENT_HINTS[status]

  if (compact) {
    return (
      <StatusHint
        title={hint.title}
        description={debt && debt > 0 ? `Долг: ${debt.toLocaleString('ru-RU')} ₽` : status === 'paid' ? 'Все платежи внесены.' : 'Платёж ещё не зафиксирован.'}
        action={hint.action}
        variant={hint.variant}
      >
        <span
          className={cn('inline-block size-2 rounded-full', {
            'bg-emerald-400': status === 'paid',
            'bg-amber-400': status === 'partial',
            'bg-red-400': status === 'overdue',
            'bg-muted-foreground': status === 'pending',
          })}
        />
      </StatusHint>
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
