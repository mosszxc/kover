import { useState } from 'react'
import { Plus, Truck } from 'lucide-react'
import { toast } from 'sonner'
import { generateId } from '@/shared/lib/generateId'
import { Button } from '@/shared/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/dialog'
import type { DayOfWeek } from '@/shared/types'
import { DAY_LABELS } from '@/shared/types'
import { useVisibleDays } from '@/shared/hooks/useVisibleDays'
import { cn } from '@/shared/lib/utils'
import { useDriverStore } from '../store'

interface FormErrors {
  name?: string
}

export function AddDriverDialog() {
  const addDriver = useDriverStore((s) => s.addDriver)
  const visibleDays = useVisibleDays()

  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [vehicleName, setVehicleName] = useState('')
  const [vehicleCapacity, setVehicleCapacity] = useState('')
  const [workDays, setWorkDays] = useState<DayOfWeek[]>([...visibleDays])
  const [errors, setErrors] = useState<FormErrors>({})

  function resetForm() {
    setName('')
    setPhone('')
    setVehicleName('')
    setVehicleCapacity('')
    setWorkDays([...visibleDays])
    setErrors({})
  }

  function toggleDay(day: DayOfWeek) {
    setWorkDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort(),
    )
  }

  function validate(): FormErrors {
    const e: FormErrors = {}
    if (!name.trim()) e.name = 'Имя обязательно'
    return e
  }

  function handleSave() {
    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    addDriver({
      id: generateId(),
      name: name.trim(),
      phone: phone.trim(),
      isActive: true,
      workDays,
      vehicleName: vehicleName.trim() || null,
      vehicleCapacity: vehicleCapacity ? parseFloat(vehicleCapacity) : null,
      createdAt: new Date().toISOString(),
    })

    toast.success(`Водитель "${name.trim()}" добавлен`)
    setOpen(false)
    resetForm()
  }

  const inputClass =
    'h-11 w-full rounded-md border border-border bg-card px-3 text-base text-foreground placeholder:text-muted-foreground focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors'
  const labelClass = 'block text-sm font-medium text-foreground mb-1.5'

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
          Добавить водителя
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="text-lg">Новый водитель</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <label htmlFor="driver-name" className={labelClass}>
              Имя <span className="text-red-400">*</span>
            </label>
            <input
              id="driver-name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                setErrors((prev) => ({ ...prev, name: undefined }))
              }}
              placeholder="Например: Иван Петров"
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
            <label htmlFor="driver-phone" className={labelClass}>
              Телефон
            </label>
            <input
              id="driver-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+7 (999) 123-45-67"
              className={inputClass}
            />
          </div>

          <div>
            <span className={labelClass}>
              <Truck className="mr-1 inline size-3.5" />
              Транспорт
            </span>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={vehicleName}
                onChange={(e) => setVehicleName(e.target.value)}
                placeholder="Например: Газель"
                className={`${inputClass} flex-1`}
              />
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="10"
                  value={vehicleCapacity}
                  onChange={(e) => setVehicleCapacity(e.target.value)}
                  placeholder="м²"
                  className={`${inputClass} w-28 pr-8`}
                  aria-label="Грузоподъёмность в м²"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">м²</span>
              </div>
            </div>
          </div>

          <div>
            <span className={labelClass}>Рабочие дни</span>
            <div className="flex gap-1.5">
              {visibleDays.map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-md border text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
                    workDays.includes(day)
                      ? 'border-blue-500 bg-blue-500/20 text-blue-400'
                      : 'border-border text-muted-foreground hover:border-ring',
                  )}
                >
                  {DAY_LABELS[day]}
                </button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Отмена
          </Button>
          <Button onClick={handleSave}>Сохранить</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
