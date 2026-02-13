import { MapPin, Ruler, LayoutGrid } from 'lucide-react'
import { useRouteSummary } from '../hooks/useRouteSummary'
import type { MatSize } from '@/shared/types'

const MAT_SIZE_LABELS: Record<MatSize, string> = {
  '180': '180',
  '150': '150',
  '60x80': '60×80',
  '400': '400',
  '250': '250',
}

const SIZE_ORDER: MatSize[] = ['400', '250', '180', '150', '60x80']

function formatMats(matsBySize: Partial<Record<MatSize, number>>): string {
  return SIZE_ORDER
    .filter((size) => matsBySize[size])
    .map((size) => `${MAT_SIZE_LABELS[size]}: ${matsBySize[size]} шт`)
    .join(' | ')
}

export function DaySummary() {
  const summary = useRouteSummary()

  if (summary.stopCount === 0) {
    return (
      <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4 text-center text-sm text-slate-500">
        Нет точек на этот день
      </div>
    )
  }

  const matsText = formatMats(summary.matsBySize)

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
