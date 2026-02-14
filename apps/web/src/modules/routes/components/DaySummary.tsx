import { MapPin, Ruler, LayoutGrid } from 'lucide-react'
import { useRouteSummary } from '../hooks/useRouteSummary'
import { useMatSizeStore } from '@/shared/stores/matSizeStore'

export function DaySummary() {
  const summary = useRouteSummary()
  const sizes = useMatSizeStore((s) => s.sizes)

  if (summary.stopCount === 0 && summary.skippedCount === 0) {
    return (
      <div className="rounded-lg border border-border bg-card/50 p-4 text-center text-sm text-muted-foreground">
        Нет точек на этот день
      </div>
    )
  }

  const matSizes = sizes.filter((s) => summary.matsBySize[s.id])

  return (
    <div className="space-y-3">
      {/* Ключевые метрики */}
      <div className="grid grid-cols-3 gap-3">
        <SummaryCard
          icon={<MapPin className="h-4 w-4 text-blue-400" />}
          value={summary.stopCount}
          label="Точек"
        />
        <SummaryCard
          icon={<LayoutGrid className="h-4 w-4 text-emerald-400" />}
          value={summary.totalMats}
          label="Ковриков"
        />
        <SummaryCard
          icon={<Ruler className="h-4 w-4 text-amber-400" />}
          value={`${summary.totalArea} м²`}
          label="Метраж"
        />
      </div>

      {/* Коврики по размерам */}
      {matSizes.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {matSizes.map((s) => (
            <div
              key={s.id}
              className="flex flex-col items-center rounded-lg border border-border bg-card/50 py-2 px-3"
            >
              <span className="text-2xl font-bold tabular-nums text-foreground">
                {summary.matsBySize[s.id]}
              </span>
              <span className="text-sm text-muted-foreground">{s.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function SummaryCard({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode
  value: string | number
  label: string
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card/50 p-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="truncate text-2xl font-bold tabular-nums text-foreground">
          {value}
        </p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  )
}
