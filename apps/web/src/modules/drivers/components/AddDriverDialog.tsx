import { useState } from 'react'
import { Plus } from 'lucide-react'
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
import { useDriverStore } from '../store'

interface FormErrors {
  name?: string
}

export function AddDriverDialog() {
  const addDriver = useDriverStore((s) => s.addDriver)

  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})

  function resetForm() {
    setName('')
    setPhone('')
    setErrors({})
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
