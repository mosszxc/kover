import { X } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { DAY_LABELS, MAT_SIZES } from '@/shared/types'
import type { DayOfWeek, MatSize } from '@/shared/types'
import { FREQUENCY_OPTIONS, ALL_WORK_DAYS } from '@/shared/constants'

export type StatusFilter = 'all' | 'active' | 'paused'

interface ClientsFiltersProps {
  selectedDays: DayOfWeek[]
  onDaysChange: (days: DayOfWeek[]) => void
  selectedFrequency: number | null
  onFrequencyChange: (frequency: number | null) => void
  selectedMatSize: MatSize | null
  onMatSizeChange: (size: MatSize | null) => void
  selectedStatus: StatusFilter
  onStatusChange: (status: StatusFilter) => void
}

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'Все' },
  { value: 'active', label: 'Активные' },
  { value: 'paused', label: 'На паузе' },
]

export function ClientsFilters({
  selectedDays,
  onDaysChange,
  selectedFrequency,
  onFrequencyChange,
  selectedMatSize,
  onMatSizeChange,
  selectedStatus,
  onStatusChange,
}: ClientsFiltersProps) {
  const hasFilters =
    selectedDays.length > 0 ||
    selectedFrequency !== null ||
    selectedMatSize !== null ||
    selectedStatus !== 'all'

  function toggleDay(day: DayOfWeek) {
    if (selectedDays.includes(day)) {
      onDaysChange(selectedDays.filter((d) => d !== day))
    } else {
      onDaysChange([...selectedDays, day])
    }
  }

  function toggleFrequency(freq: number) {
    onFrequencyChange(selectedFrequency === freq ? null : freq)
  }

  function toggleMatSize(size: MatSize) {
    onMatSizeChange(selectedMatSize === size ? null : size)
  }

  function resetAll() {
    onDaysChange([])
    onFrequencyChange(null)
    onMatSizeChange(null)
    onStatusChange('all')
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Day filter */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-medium text-slate-500">День:</span>
        {ALL_WORK_DAYS.map((day) => (
          <button
            key={day}
            type="button"
            onClick={() => toggleDay(day)}
            className={cn(
              'min-h-[44px] min-w-[44px] rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
              selectedDays.includes(day)
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-300',
            )}
          >
            {DAY_LABELS[day]}
          </button>
        ))}
      </div>

      {/* Frequency filter */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-medium text-slate-500">Частота:</span>
        {FREQUENCY_OPTIONS.map((freq) => (
          <button
            key={freq}
            type="button"
            onClick={() => toggleFrequency(freq)}
            className={cn(
              'min-h-[44px] min-w-[44px] rounded-full px-3 py-1.5 text-sm font-medium tabular-nums transition-colors',
              selectedFrequency === freq
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-300',
            )}
          >
            {freq}
          </button>
        ))}
      </div>

      {/* Mat size filter */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-medium text-slate-500">Коврик:</span>
        {MAT_SIZES.map((size) => (
          <button
            key={size}
            type="button"
            onClick={() => toggleMatSize(size)}
            className={cn(
              'min-h-[44px] rounded-full px-3 py-1.5 text-sm font-medium tabular-nums transition-colors',
              selectedMatSize === size
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-300',
            )}
          >
            {size}
          </button>
        ))}
      </div>

      {/* Status filter */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-medium text-slate-500">Статус:</span>
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onStatusChange(opt.value)}
            className={cn(
              'min-h-[44px] rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
              selectedStatus === opt.value
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-300',
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Reset button */}
      {hasFilters && (
        <button
          type="button"
          onClick={resetAll}
          className="flex min-h-[44px] items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-300"
        >
          <X className="size-3.5" />
          Сбросить
        </button>
      )}
    </div>
  )
}
