import { Plus, MapPin, Loader2, Minus } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { ALL_WORK_DAYS } from '@/shared/constants'
import { DAY_LABELS } from '@/shared/types'
import type { ClientFormState } from '../hooks/useClientForm'
import { MatRowCard } from './MatRowCard'
import { FrequencyPills } from './FrequencyPills'

interface ClientFormProps {
  form: ClientFormState
  mode: 'add' | 'edit'
  coordinates?: { lat: number; lng: number } | null
  onGeocode?: () => void
  geocoding?: boolean
}

const inputClass =
  'h-11 w-full rounded-md border border-border bg-card px-3 text-base text-foreground placeholder:text-muted-foreground focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors'
const labelClass = 'block text-sm font-medium text-foreground mb-1.5'

function SectionDivider({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {children}
      </span>
      <hr className="flex-1 border-border" />
    </div>
  )
}

export function ClientForm({
  form,
  mode,
  coordinates,
  onGeocode,
  geocoding,
}: ClientFormProps) {
  const idPrefix = mode === 'add' ? 'client' : 'edit-client'

  return (
    <div className="space-y-6 py-2">
      {/* === Секция: Основное === */}
      <div className="space-y-3">
        <SectionDivider>Основное</SectionDivider>

        <div>
          <label htmlFor={`${idPrefix}-name`} className={labelClass}>
            Название <span className="text-red-400">*</span>
          </label>
          <input
            id={`${idPrefix}-name`}
            type="text"
            value={form.name}
            onChange={(e) => {
              form.setName(e.target.value)
              form.clearError('name')
            }}
            placeholder="Например: Велес"
            className={`${inputClass} ${form.errors.name ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
            autoFocus={mode === 'add'}
          />
          {form.errors.name && (
            <p role="alert" className="mt-1.5 text-sm text-red-400">
              {form.errors.name}
            </p>
          )}
        </div>

        <div>
          <label htmlFor={`${idPrefix}-address`} className={labelClass}>
            Адрес
          </label>
          <input
            id={`${idPrefix}-address`}
            type="text"
            value={form.address}
            onChange={(e) => form.setAddress(e.target.value)}
            placeholder="Например: Гоголя 180"
            className={inputClass}
          />
          {mode === 'add' && (
            <p className="mt-1 text-xs text-muted-foreground">
              Координаты определятся автоматически при сохранении
            </p>
          )}
        </div>

        {/* Координаты — только в режиме редактирования */}
        {mode === 'edit' && (
          <div className="flex items-center gap-2">
            {coordinates?.lat != null && coordinates?.lng != null ? (
              <span className="flex items-center gap-1.5 text-sm text-green-400">
                <MapPin className="h-4 w-4" />
                {coordinates.lat.toFixed(5)}, {coordinates.lng.toFixed(5)}
              </span>
            ) : (
              <span className="text-sm text-muted-foreground">Координаты не определены</span>
            )}
            {onGeocode && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={geocoding || !form.address.trim()}
                onClick={onGeocode}
                aria-label="Определить координаты по адресу"
              >
                {geocoding ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <MapPin className="h-4 w-4" />
                )}
                {geocoding ? 'Поиск...' : 'Определить'}
              </Button>
            )}
          </div>
        )}
      </div>

      {/* === Секция: Коврики === */}
      <div className="space-y-3">
        <SectionDivider>
          Коврики <span className="text-red-400">*</span>
        </SectionDivider>

        <div className="space-y-2">
          {form.mats.map((mat, i) => (
            <MatRowCard
              key={i}
              mat={mat}
              index={i}
              canRemove={form.mats.length > 1}
              onSizeChange={(size) => form.updateMatSize(i, size)}
              onQuantityChange={(qty) => form.updateMatQuantity(i, qty)}
              onColorChange={(color) => form.updateMatColor(i, color)}
              onRemove={() => form.removeMat(i)}
            />
          ))}
        </div>

        {form.errors.mats && (
          <p role="alert" className="text-sm text-red-400">
            {form.errors.mats}
          </p>
        )}

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-accent-foreground"
          onClick={form.addMat}
        >
          <Plus className="h-4 w-4" />
          Добавить коврик
        </Button>
      </div>

      {/* === Секция: Расписание === */}
      <div className="space-y-3">
        <SectionDivider>Расписание</SectionDivider>

        <div>
          <span className={labelClass}>Частота (раз в неделю)</span>
          <FrequencyPills value={form.frequency} onChange={form.setFrequency} />
        </div>

        <div>
          <span className={labelClass}>
            Дни обслуживания
            <span className="ml-1.5 font-normal text-muted-foreground">
              ({form.days.length}/{form.frequency})
            </span>
          </span>
          <div className="flex gap-2">
            {ALL_WORK_DAYS.map((day) => {
              const isSelected = form.days.includes(day)
              const isAtLimit = form.days.length >= form.frequency && !isSelected
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => form.toggleDay(day)}
                  aria-label={`${DAY_LABELS[day]}${isSelected ? ' (выбран)' : ''}`}
                  aria-pressed={isSelected}
                  className={`flex h-11 w-full max-w-[64px] items-center justify-center rounded-md border text-base font-medium transition-colors ${
                    isSelected
                      ? 'border-blue-600 bg-blue-600 text-white'
                      : isAtLimit
                        ? 'cursor-not-allowed border-border bg-card text-muted-foreground/40'
                        : 'border-border bg-card text-muted-foreground hover:border-ring hover:text-accent-foreground'
                  }`}
                >
                  {DAY_LABELS[day]}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* === Секция: Количество замен по дням === */}
      {form.days.length > 1 && (
        <div className="space-y-3">
          <SectionDivider>Замены по дням</SectionDivider>
          <p className="text-xs text-muted-foreground">
            Сколько раз менять коврики в каждый день обслуживания
          </p>
          <div className="flex flex-wrap gap-3">
            {[...form.days].sort().map((day) => {
              const count = form.dayReplacements[day] ?? 1
              return (
                <div
                  key={day}
                  className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2"
                >
                  <span className="text-sm font-medium text-foreground">
                    {DAY_LABELS[day]}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={count <= 1}
                      onClick={() => form.setDayReplacement(day, count - 1)}
                      className="flex size-7 items-center justify-center rounded border border-border bg-card text-muted-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Minus className="size-3.5" />
                    </button>
                    <span className="w-6 text-center text-sm font-semibold tabular-nums text-foreground">
                      {count}
                    </span>
                    <button
                      type="button"
                      disabled={count >= 5}
                      onClick={() => form.setDayReplacement(day, count + 1)}
                      className="flex size-7 items-center justify-center rounded border border-border bg-card text-muted-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Plus className="size-3.5" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* === Секция: Дополнительно === */}
      <div className="space-y-3">
        <SectionDivider>Дополнительно</SectionDivider>

        <div>
          <label htmlFor={`${idPrefix}-notes`} className={labelClass}>
            Примечания
          </label>
          <textarea
            id={`${idPrefix}-notes`}
            value={form.notes}
            onChange={(e) => form.setNotes(e.target.value)}
            placeholder="Например: 3-й вход, резаный"
            rows={3}
            className={`${inputClass} resize-none py-2.5`}
          />
        </div>
      </div>
    </div>
  )
}
