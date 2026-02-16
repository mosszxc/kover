import { useMemo } from 'react'
import { usePaymentStore } from '../store'
import { formatPeriod, getPaymentStatus, PAYMENT_STATUS_CONFIG } from '../types'
import { cn } from '@/shared/lib/utils'

interface PaymentHistoryProps {
  clientId: string
}

export function PaymentHistory({ clientId }: PaymentHistoryProps) {
  const payments = usePaymentStore((s) => s.payments)

  const clientPayments = useMemo(
    () =>
      payments
        .filter((p) => p.clientId === clientId)
        .sort((a, b) => b.period.localeCompare(a.period)),
    [payments, clientId],
  )

  if (clientPayments.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">Нет записей об оплате</p>
    )
  }

  return (
    <div className="space-y-2">
      {clientPayments.map((payment) => {
        const status = getPaymentStatus(payment)
        const config = PAYMENT_STATUS_CONFIG[status]
        return (
          <div
            key={payment.id}
            className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
          >
            <div>
              <p className="text-sm font-medium">{formatPeriod(payment.period)}</p>
              {payment.notes && (
                <p className="text-xs text-muted-foreground">{payment.notes}</p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm tabular-nums text-foreground">
                {payment.paidAmount.toLocaleString('ru-RU')}{' / '}
                {payment.expectedAmount.toLocaleString('ru-RU')}{'\u00a0'}₽
              </span>
              <span className={cn('rounded-full px-2 py-0.5 text-xs font-semibold', config.className)}>
                {config.label}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
