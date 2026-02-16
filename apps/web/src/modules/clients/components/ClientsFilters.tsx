import { X } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { DAY_LABELS } from '@/shared/types'
import type { DayOfWeek } from '@/shared/types'
import { FREQUENCY_OPTIONS } from '@/shared/constants'
import { useVisibleDays } from '@/shared/hooks/useVisibleDays'
import { useMatSizeStore } from '@/shared/stores/matSizeStore'
import { CLIENT_CATEGORIES } from '../types'
import type { ClientCategory } from '../types'

export type StatusFilter = 'all' | 'active' | 'paused'
export type PaymentFilter = 'all' | 'paid' | 'unpaid' | 'overdue'

interface ClientsFiltersProps {
  selectedDays: DayOfWeek[]
  onDaysChange: (days: DayOfWeek[]) => void
  selectedFrequency: number | null
  onFrequencyChange: (frequency: number | null) => void
  selectedMatSize: string | null
  onMatSizeChange: (size: string | null) => void
  selectedStatus: StatusFilter
  onStatusChange: (status: StatusFilter) => void
  selectedCategory: ClientCategory | null
  onCategoryChange: (category: ClientCategory | null) => void
  selectedPayment?: PaymentFilter
  onPaymentChange?: (payment: PaymentFilter) => void
  hasPayments?: boolean
}

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'Все' },
  { value: 'active', label: 'Активные' },
  { value: 'paused', label: 'На паузе' },
]

const PAYMENT_OPTIONS: { value: PaymentFilter; label: string }[] = [
  { value: 'all', label: 'Все' },
  { value: 'paid', label: 'Оплачен' },
  { value: 'unpaid', label: 'Не оплачен' },
  { value: 'overdue', label: 'Просрочен' },
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
  selectedCategory,
  onCategoryChange,
  selectedPayment = 'all',
  onPaymentChange,
  hasPayments = false,
}: ClientsFiltersProps) {
  const visibleDays = useVisibleDays()

  const hasFilters =
    selectedDays.length > 0 ||
    selectedFrequency !== null ||
    selectedMatSize !== null ||
    selectedStatus !== 'all' ||
    selectedCategory !== null ||
    selectedPayment !== 'all'

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

  const matSizes = useMatSizeStore((s) => s.sizes)

  function toggleMatSize(size: string) {
    onMatSizeChange(selectedMatSize === size ? null : size)
  }

  function resetAll() {
    onDaysChange([])
    onFrequencyChange(null)
    onMatSizeChange(null)
    onStatusChange('all')
    onCategoryChange(null)
    onPaymentChange?.('all')
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Day filter */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-medium text-muted-foreground">День:</span>
        {visibleDays.map((day) => (
          <button
            key={day}
            type="button"
            onClick={() => toggleDay(day)}
            className={cn(
              'min-h-[44px] min-w-[44px] rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
              selectedDays.includes(day)
                ? 'bg-blue-600 text-white'
                : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground',
            )}
          >
            {DAY_LABELS[day]}
          </button>
        ))}
      </div>

      {/* Frequency filter */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-medium text-muted-foreground">Частота:</span>
        {FREQUENCY_OPTIONS.map((freq) => (
          <button
            key={freq}
            type="button"
            onClick={() => toggleFrequency(freq)}
            className={cn(
              'min-h-[44px] min-w-[44px] rounded-full px-3 py-1.5 text-sm font-medium tabular-nums transition-colors',
              selectedFrequency === freq
                ? 'bg-blue-600 text-white'
                : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground',
            )}
          >
            {freq}
          </button>
        ))}
      </div>

      {/* Mat size filter */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-medium text-muted-foreground">Коврик:</span>
        {matSizes.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => toggleMatSize(s.id)}
            className={cn(
              'min-h-[44px] rounded-full px-3 py-1.5 text-sm font-medium tabular-nums transition-colors',
              selectedMatSize === s.id
                ? 'bg-blue-600 text-white'
                : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground',
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Status filter */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-medium text-muted-foreground">Статус:</span>
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onStatusChange(opt.value)}
            className={cn(
              'min-h-[44px] rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
              selectedStatus === opt.value
                ? 'bg-blue-600 text-white'
                : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground',
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Category filter */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-medium text-muted-foreground">Категория:</span>
        {CLIENT_CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            type="button"
            onClick={() => onCategoryChange(selectedCategory === cat.value ? null : cat.value)}
            className={cn(
              'min-h-[44px] rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
              selectedCategory === cat.value
                ? 'bg-blue-600 text-white'
                : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground',
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Payment filter */}
      {hasPayments && onPaymentChange && (
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">Оплата:</span>
          {PAYMENT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onPaymentChange(opt.value)}
              className={cn(
                'min-h-[44px] rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
                selectedPayment === opt.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {/* Reset button */}
      {hasFilters && (
        <button
          type="button"
          onClick={resetAll}
          className="flex min-h-[44px] items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          <X className="size-3.5" />
          Сбросить
        </button>
      )}
    </div>
  )
}
