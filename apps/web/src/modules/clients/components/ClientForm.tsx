import { useState, useEffect, useRef, useCallback } from 'react'
import { Plus, X, Trash2, MapPin, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { generateId } from '@/shared/lib/generateId'
import { geocodeAddress } from '@/shared/lib/geocode'
import { useSettingsStore } from '@/shared/stores/settingsStore'
import { Button } from '@/shared/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/shared/ui/alert-dialog'
import type { DayOfWeek, MatSize } from '@/shared/types'
import { DAY_LABELS, MAT_SIZES } from '@/shared/types'
import { useClientStore } from '../store'
import type { Client, MatSpec } from '../types'
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

function matsToRows(mats: MatSpec[]): MatRow[] {
  return mats.map((m) => ({ size: m.size, quantity: m.quantity, color: m.color ?? '' }))
}

function rowsToSpecs(rows: MatRow[]): MatSpec[] {
  return rows.map((m) => ({
    size: m.size,
    quantity: m.quantity,
    ...(m.color.trim() ? { color: m.color.trim() } : {}),
  }))
}

interface ClientFormProps {
  client?: Client
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onDelete?: (id: string) => void
}

export function ClientForm({ client, open: controlledOpen, onOpenChange, onDelete }: ClientFormProps) {
  const isEdit = !!client
  const addClient = useClientStore((s) => s.addClient)
  const updateClient = useClientStore((s) => s.updateClient)
  const geocodeCity = useSettingsStore((s) => s.geocodeCity)

  // Dialog state: controlled externally for edit, internal for add
  const [internalOpen, setInternalOpen] = useState(false)
  const open = isEdit ? (controlledOpen ?? false) : internalOpen
  const setOpen = isEdit
    ? (v: boolean) => onOpenChange?.(v)
    : setInternalOpen

  // form state
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [mats, setMats] = useState<MatRow[]>([emptyMat()])
  const [frequency, setFrequency] = useState(1)
  const [days, setDays] = useState<DayOfWeek[]>([])
  const [notes, setNotes] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})
  const [geocoding, setGeocoding] = useState(false)

  // Populate form when client changes (edit mode)
  useEffect(() => {
    if (client) {
      setName(client.name)
      setAddress(client.address)
      setMats(matsToRows(client.mats))
      setFrequency(client.frequency)
      setDays([...client.days])
      setNotes(client.notes)
      setErrors({})
    }
  }, [client])

  // Autosave for edit mode
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const autosave = useCallback(() => {
    if (!client) return
    if (!name.trim()) return

    const data: Partial<Client> = {
      name: name.trim(),
      address: address.trim(),
      mats: rowsToSpecs(mats),
      frequency,
      days: [...days].sort(),
      notes: notes.trim(),
      originalName: buildOriginalName(),
    }
    updateClient(client.id, data)
    toast.success('Сохранено', { duration: 2000 })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client, name, address, mats, frequency, days, notes, updateClient])

  // Track if form was populated (skip first autosave on open)
  const populatedRef = useRef(false)

  useEffect(() => {
    if (!isEdit) return
    if (!populatedRef.current) {
      populatedRef.current = true
      return
    }

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(autosave, 500)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [isEdit, name, address, mats, frequency, days, notes, autosave])

  // Reset populated flag when dialog closes
  useEffect(() => {
    if (!open) {
      populatedRef.current = false
    }
  }, [open])

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
    if (mats.length === 0) e.mats = 'Добавьте хотя бы 1 коврик'
    return e
  }

  function buildOriginalName(): string {
    const parts = [name.trim()]
    if (address.trim()) parts.push(address.trim())
    const matsSummary = mats
      .map((m) => `${m.quantity}×${m.size}`)
      .join(', ')
    if (matsSummary) parts.push(matsSummary)
    return parts.join(' ')
  }

  function handleSave() {
    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
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
    }

    addClient(newClient)
    toast.success('Сохранено', { duration: 2000 })
    setOpen(false)
    resetForm()
  }

  function handleDelete() {
    if (!client) return
    onDelete?.(client.id)
    setOpen(false)
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
    'h-11 w-full rounded-md border border-slate-700 bg-slate-900 px-3 text-sm text-slate-50 placeholder:text-slate-500 focus:border-slate-500 focus:outline-none'
  const labelClass = 'text-sm font-medium text-slate-300'
  const errorClass = 'text-xs text-red-400 mt-1'

  const dialogContent = (
    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[500px]">
      <DialogHeader>
        <DialogTitle>
          {isEdit ? `Редактирование: ${client.name}` : 'Новый клиент'}
        </DialogTitle>
      </DialogHeader>

      <div className="space-y-4">
        {/* Название */}
        <div>
          <label className={labelClass}>
            Название <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              setErrors((prev) => ({ ...prev, name: undefined }))
            }}
            placeholder="Например: Велес"
            className={`${inputClass} mt-1 ${errors.name ? 'ring-1 ring-red-500' : ''}`}
          />
          {errors.name && <p className={errorClass}>{errors.name}</p>}
        </div>

        {/* Адрес */}
        <div>
          <label className={labelClass}>Адрес</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Например: Гоголя 180"
            className={`${inputClass} mt-1`}
          />
        </div>

        {/* Координаты (только edit mode) */}
        {isEdit && client && (
          <div>
            <label className={labelClass}>Координаты</label>
            <div className="mt-1 flex items-center gap-2">
              {client.lat != null && client.lng != null ? (
                <span className="flex items-center gap-1.5 text-sm text-green-400">
                  <MapPin className="h-3.5 w-3.5" />
                  {client.lat.toFixed(5)}, {client.lng.toFixed(5)}
                </span>
              ) : (
                <span className="text-sm text-slate-500">Не определены</span>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={geocoding || !address.trim()}
                onClick={async () => {
                  setGeocoding(true)
                  try {
                    const result = await geocodeAddress(address.trim(), geocodeCity || undefined)
                    if (result) {
                      updateClient(client.id, { lat: result.lat, lng: result.lng })
                      toast.success(`Координаты определены: ${result.displayName}`, { duration: 3000 })
                    } else {
                      toast.error('Адрес не найден')
                    }
                  } catch {
                    toast.error('Ошибка геокодирования')
                  } finally {
                    setGeocoding(false)
                  }
                }}
              >
                {geocoding ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <MapPin className="h-3.5 w-3.5" />
                )}
                {geocoding ? 'Поиск...' : 'Определить'}
              </Button>
            </div>
          </div>
        )}

        {/* Коврики */}
        <div>
          <label className={labelClass}>
            Коврики <span className="text-red-400">*</span>
          </label>
          <div className="mt-1 space-y-2">
            {mats.map((mat, i) => (
              <div key={i} className="flex items-center gap-2">
                <select
                  value={mat.size}
                  onChange={(e) => updateMat(i, 'size', e.target.value)}
                  className={`${inputClass} w-28 shrink-0`}
                >
                  {MAT_SIZES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  min={1}
                  value={mat.quantity}
                  onChange={(e) =>
                    updateMat(i, 'quantity', Math.max(1, Number(e.target.value)))
                  }
                  className={`${inputClass} w-16 shrink-0 text-center`}
                />

                <input
                  type="text"
                  value={mat.color}
                  onChange={(e) => updateMat(i, 'color', e.target.value)}
                  placeholder="Цвет"
                  className={`${inputClass} min-w-0 flex-1`}
                />

                <button
                  type="button"
                  onClick={() => removeMat(i)}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-800 hover:text-slate-300"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          {errors.mats && <p className={errorClass}>{errors.mats}</p>}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mt-2"
            onClick={addMat}
          >
            <Plus className="h-3 w-3" />
            Коврик
          </Button>
        </div>

        {/* Частота */}
        <div>
          <label className={labelClass}>Частота (раз/нед)</label>
          <select
            value={frequency}
            onChange={(e) => setFrequency(Number(e.target.value))}
            className={`${inputClass} mt-1`}
          >
            {FREQUENCIES.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>

        {/* Дни */}
        <div>
          <label className={labelClass}>Дни</label>
          <div className="mt-1 flex gap-2">
            {ALL_DAYS.map((day) => (
              <button
                key={day}
                type="button"
                onClick={() => toggleDay(day)}
                className={`flex h-11 w-11 items-center justify-center rounded-md border text-sm font-medium transition-colors ${
                  days.includes(day)
                    ? 'border-blue-600 bg-blue-600 text-white'
                    : 'border-slate-700 bg-slate-900 text-slate-400 hover:border-slate-500'
                }`}
              >
                {DAY_LABELS[day]}
              </button>
            ))}
          </div>
        </div>

        {/* Примечания */}
        <div>
          <label className={labelClass}>Примечания</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Дополнительная информация..."
            rows={3}
            className={`${inputClass} mt-1 resize-none py-2`}
          />
        </div>
      </div>

      <DialogFooter className={isEdit ? 'flex-row justify-between sm:justify-between' : ''}>
        {isEdit ? (
          <>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="h-4 w-4" />
                  Удалить
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Удалить клиента {client.name}?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Клиент будет убран из всех маршрутов.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Отмена</AlertDialogCancel>
                  <AlertDialogAction variant="destructive" onClick={handleDelete}>
                    Удалить
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Закрыть
            </Button>
          </>
        ) : (
          <Button onClick={handleSave}>Сохранить</Button>
        )}
      </DialogFooter>
    </DialogContent>
  )

  // Edit mode: controlled dialog without trigger
  if (isEdit) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        {dialogContent}
      </Dialog>
    )
  }

  // Add mode: dialog with trigger button
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
      {dialogContent}
    </Dialog>
  )
}
