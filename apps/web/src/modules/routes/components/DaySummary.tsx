import { MapPin, Ruler, LayoutGrid } from 'lucide-react'
import { useRouteSummary } from '../hooks/useRouteSummary'
import { useMatSizeStore } from '@/shared/stores/matSizeStore'

export function DaySummary() {
  const summary = useRouteSummary()
  const sizes = useMatSizeStore((s) => s.sizes)

  if (summary.stopCount === 0) {
    return (
      <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4 text-center text-sm text-slate-500">
        Нет точек на этот день
      </div>
    )
  }

  const matsText = sizes
    .filter((s) => summary.matsBySize[s.id])
    .map((s) => `${s.label}: ${summary.matsBySize[s.id]} шт`)
    .join(' | ')

  return (
    <div className="grid grid-cols-3 gap-3">
      <SummaryCard
        icon={<MapPin className="h-4 w-4 text-blue-400" />}
        value={summary.stopCount}
        label="Точек"
      />
      <SummaryCard
        icon={<LayoutGrid className="h-4 w-4 text-emerald-400" />}
        value={matsText || '—'}
        label="Коврики"
        wide
      />
      <SummaryCard
        icon={<Ruler className="h-4 w-4 text-amber-400" />}
        value={`${summary.totalArea} м²`}
        label="Метраж"
      />
    </div>
  )
}

function SummaryCard({
  icon,
  value,
  label,
  wide,
}: {
  icon: React.ReactNode
  value: string | number
  label: string
  wide?: boolean
}) {
  return (
    <div
      className={`flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-900/50 p-3 ${wide ? 'col-span-1' : ''}`}
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-slate-800">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="truncate text-2xl font-bold tabular-nums text-slate-100">
          {value}
        </p>
        <p className="text-xs text-slate-500">{label}</p>
      </div>
    </div>
  )
}
