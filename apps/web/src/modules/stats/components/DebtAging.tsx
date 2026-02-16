import { AlertTriangle, TrendingDown, User } from 'lucide-react'
import { useDebtAging } from '../hooks/useDebtAging'

export function DebtAging() {
  const { totalDebt, totalDebtors, buckets, topDebtors } = useDebtAging()

  if (totalDebtors === 0) {
    return (
      <div className="rounded-lg border border-border bg-card/50 p-4 text-center text-sm text-muted-foreground">
        Нет просроченных оплат
      </div>
    )
  }

  const maxBucketDebt = Math.max(...buckets.map((b) => b.totalDebt), 1)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <TrendingDown className="h-4 w-4 text-red-400" />
          Дебиторская задолженность
        </h3>
        <div className="text-right">
          <p className="text-lg font-bold tabular-nums text-red-400">
            {totalDebt.toLocaleString('ru-RU')} ₽
          </p>
          <p className="text-xs text-muted-foreground">
            {totalDebtors} должник{totalDebtors === 1 ? '' : totalDebtors < 5 ? 'а' : 'ов'}
          </p>
        </div>
      </div>

      {/* Aging buckets */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">По срокам</p>
        {buckets.map((bucket) => (
          <div key={bucket.label} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{bucket.label}</span>
              <span className="tabular-nums text-foreground">
                {bucket.totalDebt > 0
                  ? `${bucket.totalDebt.toLocaleString('ru-RU')} ₽ (${bucket.clientCount})`
                  : '—'}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full transition-all ${
                  bucket.label.includes('90')
                    ? 'bg-red-500'
                    : bucket.label.includes('60')
                      ? 'bg-orange-500'
                      : bucket.label.includes('30')
                        ? 'bg-amber-500'
                        : 'bg-yellow-500'
                }`}
                style={{ width: `${(bucket.totalDebt / maxBucketDebt) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Top debtors */}
      {topDebtors.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Топ должников</p>
          <div className="space-y-1.5">
            {topDebtors.map((debtor) => (
              <div
                key={debtor.clientId}
                className="flex items-center gap-2 rounded-md border border-border bg-card/50 px-3 py-2"
              >
                <User className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                  {debtor.clientName}
                </span>
                <span className="shrink-0 text-sm font-semibold tabular-nums text-red-400">
                  {debtor.totalDebt.toLocaleString('ru-RU')} ₽
                </span>
                {debtor.oldestDays >= 60 && (
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-red-400" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
