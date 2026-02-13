import { cn } from '@/shared/lib/utils'
import type { DriverOption } from './StopCard'

interface DriverFilterProps {
  drivers: DriverOption[]
  value: string | 'unassigned' | null
  onChange: (value: string | 'unassigned' | null) => void
}

export function DriverFilter({ drivers, value, onChange }: DriverFilterProps) {
  if (drivers.length === 0) return null

  const btnClass = (active: boolean) =>
    cn(
      'shrink-0 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
      active
        ? 'bg-slate-700 text-slate-50'
        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200',
    )

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="mr-1 text-xs text-slate-500">Водитель:</span>
      <button
        type="button"
        onClick={() => onChange(null)}
        className={btnClass(value === null)}
      >
        Все
      </button>
      <button
        type="button"
        onClick={() => onChange('unassigned')}
        className={btnClass(value === 'unassigned')}
      >
        Нераспределённые
      </button>
      {drivers.map((d) => (
        <button
          key={d.id}
          type="button"
          onClick={() => onChange(d.id)}
          className={btnClass(value === d.id)}
        >
          {d.name}
        </button>
      ))}
    </div>
  )
}
