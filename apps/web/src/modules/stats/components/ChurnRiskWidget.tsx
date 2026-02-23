import { ShieldAlert, CheckCircle2 } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { useChurnRisk, CHURN_REASON_LABELS } from '../hooks/useChurnRisk'
import type { ChurnRiskInfo } from '../hooks/useChurnRisk'
import { useChurnDismissStore } from '@/shared/stores/churnDismissStore'
import { Button } from '@/shared/ui/button'

function RiskRow({ info }: { info: ChurnRiskInfo }) {
  const dismiss = useChurnDismissStore((s) => s.dismiss)

  return (
    <div
      className={cn(
        'flex items-start justify-between gap-3 rounded-md border px-3 py-2',
        info.level === 'high'
          ? 'border-red-500/30 bg-red-500/5'
          : 'border-amber-500/30 bg-amber-500/5',
      )}
    >
      <div className="min-w-0">
        <p className="truncate font-medium text-foreground">{info.clientName}</p>
        <div className="mt-0.5 flex flex-wrap gap-1">
          {info.reasons.map((r) => (
            <span
              key={r}
              className={cn(
                'rounded-full px-2 py-0.5 text-xs font-medium',
                info.level === 'high'
                  ? 'bg-red-600/20 text-red-400'
                  : 'bg-amber-600/20 text-amber-400',
              )}
            >
              {CHURN_REASON_LABELS[r]}
            </span>
          ))}
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => dismiss(info.clientId)}
        className="shrink-0 gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <CheckCircle2 className="size-3.5" />
        Обработано
      </Button>
    </div>
  )
}

export function ChurnRiskWidget() {
  const { activeAtRisk, highCount, mediumCount } = useChurnRisk()

  if (activeAtRisk.length === 0) return null

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-3 flex items-center gap-2">
        <ShieldAlert className="size-5 text-amber-400" />
        <h3 className="text-lg font-semibold text-foreground">Клиенты в зоне риска</h3>
        <div className="flex gap-1.5">
          {highCount > 0 && (
            <span className="rounded-full bg-red-600/20 px-2 py-0.5 text-xs font-semibold text-red-400">
              {highCount} крит.
            </span>
          )}
          {mediumCount > 0 && (
            <span className="rounded-full bg-amber-600/20 px-2 py-0.5 text-xs font-semibold text-amber-400">
              {mediumCount} сред.
            </span>
          )}
        </div>
      </div>
      <div className="space-y-2">
        {activeAtRisk.map((info) => (
          <RiskRow key={info.clientId} info={info} />
        ))}
      </div>
    </div>
  )
}
