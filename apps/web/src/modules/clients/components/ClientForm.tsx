import { Plus, MapPin, Loader2 } from 'lucide-react'
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
          <span className={labelClass}>Дни обслуживания</span>
          <div className="flex gap-2">
            {ALL_WORK_DAYS.map((day) => (
              <button
                key={day}
                type="button"
                onClick={() => form.toggleDay(day)}
                aria-label={`${DAY_LABELS[day]}${form.days.includes(day) ? ' (выбран)' : ''}`}
                aria-pressed={form.days.includes(day)}
                className={`flex h-11 w-full max-w-[64px] items-center justify-center rounded-md border text-base font-medium transition-colors ${
                  form.days.includes(day)
                    ? 'border-blue-600 bg-blue-600 text-white'
                    : 'border-border bg-card text-muted-foreground hover:border-ring hover:text-accent-foreground'
                }`}
              >
                {DAY_LABELS[day]}
              </button>
            ))}
          </div>
        </div>
      </div>

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
