import { useState } from 'react'
import { Filter, X } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { DAY_LABELS } from '@/shared/types'
import type { DayOfWeek } from '@/shared/types'
import { FREQUENCY_OPTIONS } from '@/shared/constants'
import { useVisibleDays } from '@/shared/hooks/useVisibleDays'
import { useMatSizeStore } from '@/shared/stores/matSizeStore'
import { Button } from '@/shared/ui/button'
import { Badge } from '@/shared/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover'
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
  const [open, setOpen] = useState(false)
  const visibleDays = useVisibleDays()
  const matSizes = useMatSizeStore((s) => s.sizes)

  const activeCount =
    (selectedDays.length > 0 ? 1 : 0) +
    (selectedFrequency !== null ? 1 : 0) +
    (selectedMatSize !== null ? 1 : 0) +
    (selectedStatus !== 'all' ? 1 : 0) +
    (selectedCategory !== null ? 1 : 0) +
    (selectedPayment !== 'all' ? 1 : 0)

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
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Filter className="size-4" />
          Фильтры
          {activeCount > 0 && (
            <Badge variant="default" className="ml-0.5 size-5 px-0 text-[10px]">
              {activeCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 space-y-4 p-4">
        {/* Day filter */}
        <div className="space-y-1.5">
          <span className="text-sm font-medium text-muted-foreground">День</span>
          <div className="flex flex-wrap gap-1.5">
            {visibleDays.map((day) => (
              <button
                key={day}
                type="button"
                onClick={() => toggleDay(day)}
                className={cn(
                  'min-h-[36px] min-w-[36px] rounded-full px-2.5 py-1 text-sm font-medium transition-colors',
                  selectedDays.includes(day)
                    ? 'bg-blue-600 text-white'
                    : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                )}
              >
                {DAY_LABELS[day]}
              </button>
            ))}
          </div>
        </div>

        {/* Frequency filter */}
        <div className="space-y-1.5">
          <span className="text-sm font-medium text-muted-foreground">Частота</span>
          <div className="flex flex-wrap gap-1.5">
            {FREQUENCY_OPTIONS.map((freq) => (
              <button
                key={freq}
                type="button"
                onClick={() => toggleFrequency(freq)}
                className={cn(
                  'min-h-[36px] min-w-[36px] rounded-full px-2.5 py-1 text-sm font-medium tabular-nums transition-colors',
                  selectedFrequency === freq
                    ? 'bg-blue-600 text-white'
                    : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                )}
              >
                {freq}
              </button>
            ))}
          </div>
        </div>

        {/* Mat size filter */}
        <div className="space-y-1.5">
          <span className="text-sm font-medium text-muted-foreground">Коврик</span>
          <div className="flex flex-wrap gap-1.5">
            {matSizes.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => toggleMatSize(s.id)}
                className={cn(
                  'min-h-[36px] rounded-full px-2.5 py-1 text-sm font-medium tabular-nums transition-colors',
                  selectedMatSize === s.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Status filter */}
        <div className="space-y-1.5">
          <span className="text-sm font-medium text-muted-foreground">Статус</span>
          <div className="flex flex-wrap gap-1.5">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => onStatusChange(opt.value)}
                className={cn(
                  'min-h-[36px] rounded-full px-2.5 py-1 text-sm font-medium transition-colors',
                  selectedStatus === opt.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Category filter */}
        <div className="space-y-1.5">
          <span className="text-sm font-medium text-muted-foreground">Категория</span>
          <div className="flex flex-wrap gap-1.5">
            {CLIENT_CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => onCategoryChange(selectedCategory === cat.value ? null : cat.value)}
                className={cn(
                  'min-h-[36px] rounded-full px-2.5 py-1 text-sm font-medium transition-colors',
                  selectedCategory === cat.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Payment filter */}
        {hasPayments && onPaymentChange && (
          <div className="space-y-1.5">
            <span className="text-sm font-medium text-muted-foreground">Оплата</span>
            <div className="flex flex-wrap gap-1.5">
              {PAYMENT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onPaymentChange(opt.value)}
                  className={cn(
                    'min-h-[36px] rounded-full px-2.5 py-1 text-sm font-medium transition-colors',
                    selectedPayment === opt.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Reset button */}
        {activeCount > 0 && (
          <button
            type="button"
            onClick={resetAll}
            className="flex w-full items-center justify-center gap-1.5 rounded-md border border-border px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <X className="size-3.5" />
            Сбросить все фильтры
          </button>
        )}
      </PopoverContent>
    </Popover>
  )
}
