import { useState } from 'react'
import { Plus, X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { generateId } from '@/shared/lib/generateId'
import { geocodeAddress } from '@/shared/lib/geocode'
import { Button } from '@/shared/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/dialog'
import type { DayOfWeek, MatSize } from '@/shared/types'
import { DAY_LABELS } from '@/shared/types'
import { useClientStore } from '../store'
import type { Client, MatSpec } from '../types'

const MAT_SIZES: { value: MatSize; label: string }[] = [
  { value: '180', label: '180' },
  { value: '150', label: '150' },
  { value: '60x80', label: '60x80' },
  { value: '400', label: '400' },
  { value: '250', label: '250' },
]

const FREQUENCIES = [1, 2, 3, 4, 5] as const
const ALL_DAYS: DayOfWeek[] = [0, 1, 2, 3, 4]

interface MatRow {
  size: MatSize
  quantity: number
  color: string
}

interface FormErrors {
  name?: string
  mats?: string
}

const emptyMat = (): MatRow => ({ size: '180', quantity: 1, color: '' })

function rowsToSpecs(rows: MatRow[]): MatSpec[] {
  return rows.map((m) => ({
    size: m.size,
    quantity: m.quantity,
    ...(m.color.trim() ? { color: m.color.trim() } : {}),
  }))
}

export function AddClientDialog() {
  const addClient = useClientStore((s) => s.addClient)

  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  // Form state
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [mats, setMats] = useState<MatRow[]>([emptyMat()])
  const [frequency, setFrequency] = useState(1)
  const [days, setDays] = useState<DayOfWeek[]>([])
  const [notes, setNotes] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})

  function resetForm() {
    setName('')
    setAddress('')
    setMats([emptyMat()])
    setFrequency(1)
    setDays([])
    setNotes('')
    setErrors({})
  }

  function validate(): FormErrors {
    const e: FormErrors = {}
    if (!name.trim()) e.name = 'Название обязательно'
    if (mats.length === 0) e.mats = 'Добавьте хотя бы один коврик'
    return e
  }

  function buildOriginalName(): string {
    const parts = [name.trim()]
    if (address.trim()) parts.push(address.trim())
    const matsSummary = mats
      .map((m) => `${m.quantity}\u00d7${m.size}`)
      .join(', ')
    if (matsSummary) parts.push(matsSummary)
    return parts.join(' ')
  }

  async function handleSave() {
    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setSaving(true)

    // Geocode if address provided
    let lat: number | undefined
    let lng: number | undefined
    if (address.trim()) {
      try {
        const result = await geocodeAddress(address.trim())
        if (result) {
          lat = result.lat
          lng = result.lng
        }
      } catch {
        // Geocoding failure is non-blocking
      }
    }

    const newClient: Client = {
      id: generateId(),
      originalName: buildOriginalName(),
      name: name.trim(),
      address: address.trim(),
      mats: rowsToSpecs(mats),
      frequency,
      days: [...days].sort(),
      notes: notes.trim(),
      isActive: true,
      createdAt: new Date().toISOString(),
      ...(lat != null && lng != null ? { lat, lng } : {}),
    }

    addClient(newClient)
    toast.success(`Клиент "${name.trim()}" добавлен`)
    setSaving(false)
    setOpen(false)
    resetForm()
  }

  function addMat() {
    setMats([...mats, emptyMat()])
    setErrors((prev) => ({ ...prev, mats: undefined }))
  }

  function removeMat(index: number) {
    setMats(mats.filter((_, i) => i !== index))
  }

  function updateMat(index: number, field: keyof MatRow, value: string | number) {
    setMats(mats.map((m, i) => (i === index ? { ...m, [field]: value } : m)))
  }

  function toggleDay(day: DayOfWeek) {
    setDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    )
  }

  const inputClass =
    'h-11 w-full rounded-md border border-slate-700 bg-slate-900 px-3 text-base text-slate-50 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors'
  const labelClass = 'block text-sm font-medium text-slate-300 mb-1.5'
  const sectionClass = 'space-y-3'

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v)
        if (!v) resetForm()
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" className="border-dashed">
          <Plus className="h-4 w-4" />
          Добавить клиента
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-lg">Новый клиент</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* === Секция: Основное === */}
          <fieldset className={sectionClass}>
            <legend className="text-sm font-semibold uppercase tracking-wide text-slate-400">
              Основное
            </legend>

            <div>
              <label htmlFor="client-name" className={labelClass}>
                Название <span className="text-red-400">*</span>
              </label>
              <input
                id="client-name"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  setErrors((prev) => ({ ...prev, name: undefined }))
                }}
                placeholder="Например: Велес"
                className={`${inputClass} ${errors.name ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                autoFocus
              />
              {errors.name && (
                <p role="alert" className="mt-1.5 text-sm text-red-400">
                  {errors.name}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="client-address" className={labelClass}>
                Адрес
              </label>
              <input
                id="client-address"
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Например: Гоголя 180"
                className={inputClass}
              />
              <p className="mt-1 text-xs text-slate-500">
                Координаты определятся автоматически при сохранении
              </p>
            </div>
          </fieldset>

          {/* === Секция: Коврики === */}
          <fieldset className={sectionClass}>
            <legend className="text-sm font-semibold uppercase tracking-wide text-slate-400">
              Коврики <span className="text-red-400">*</span>
            </legend>

            <div className="space-y-2">
              {mats.map((mat, i) => (
                <div key={i} className="flex items-center gap-2">
                  <select
                    value={mat.size}
                    onChange={(e) => updateMat(i, 'size', e.target.value)}
                    aria-label={`Размер коврика ${i + 1}`}
                    className={`${inputClass} w-24 shrink-0 cursor-pointer`}
                  >
                    {MAT_SIZES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>

                  <div className="relative w-20 shrink-0">
                    <input
                      type="number"
                      min={1}
                      max={99}
                      value={mat.quantity}
                      onChange={(e) =>
                        updateMat(i, 'quantity', Math.max(1, Math.min(99, Number(e.target.value))))
                      }
                      aria-label={`Количество коврика ${i + 1}`}
                      className={`${inputClass} w-full pr-8 text-center tabular-nums`}
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">
                      шт
                    </span>
                  </div>

                  <input
                    type="text"
                    value={mat.color}
                    onChange={(e) => updateMat(i, 'color', e.target.value)}
                    placeholder="Цвет"
                    aria-label={`Цвет коврика ${i + 1}`}
                    className={`${inputClass} min-w-0 flex-1`}
                  />

                  <button
                    type="button"
                    onClick={() => removeMat(i)}
                    disabled={mats.length <= 1}
                    aria-label={`Удалить коврик ${i + 1}`}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-800 hover:text-red-400 disabled:pointer-events-none disabled:opacity-30"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            {errors.mats && (
              <p role="alert" className="text-sm text-red-400">
                {errors.mats}
              </p>
            )}

            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-slate-400 hover:text-slate-200"
              onClick={addMat}
            >
              <Plus className="h-4 w-4" />
              Добавить коврик
            </Button>
          </fieldset>

          {/* === Секция: Расписание === */}
          <fieldset className={sectionClass}>
            <legend className="text-sm font-semibold uppercase tracking-wide text-slate-400">
              Расписание
            </legend>

            <div>
              <label htmlFor="client-frequency" className={labelClass}>
                Частота (раз в неделю)
              </label>
              <select
                id="client-frequency"
                value={frequency}
                onChange={(e) => setFrequency(Number(e.target.value))}
                className={`${inputClass} cursor-pointer`}
              >
                {FREQUENCIES.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <span className={labelClass}>Дни обслуживания</span>
              <div className="flex gap-2">
                {ALL_DAYS.map((day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    aria-label={`${DAY_LABELS[day]}${days.includes(day) ? ' (выбран)' : ''}`}
                    aria-pressed={days.includes(day)}
                    className={`flex h-11 w-full max-w-[64px] items-center justify-center rounded-md border text-base font-medium transition-colors ${
                      days.includes(day)
                        ? 'border-blue-600 bg-blue-600 text-white'
                        : 'border-slate-700 bg-slate-900 text-slate-400 hover:border-slate-500 hover:text-slate-200'
                    }`}
                  >
                    {DAY_LABELS[day]}
                  </button>
                ))}
              </div>
            </div>
          </fieldset>

          {/* === Секция: Примечания === */}
          <fieldset className={sectionClass}>
            <legend className="text-sm font-semibold uppercase tracking-wide text-slate-400">
              Дополнительно
            </legend>

            <div>
              <label htmlFor="client-notes" className={labelClass}>
                Примечания
              </label>
              <textarea
                id="client-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Например: 3-й вход, резаный"
                rows={3}
                className={`${inputClass} resize-none py-2.5`}
              />
            </div>
          </fieldset>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={saving}
          >
            Отмена
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Сохранение...
              </>
            ) : (
              'Сохранить'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
