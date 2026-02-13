import { useState, useEffect } from 'react'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/shared/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { useDriverStore } from '../store'
import type { Driver } from '../types'

interface FormErrors {
  name?: string
}

interface EditDriverDialogProps {
  driver: Driver
  open: boolean
  onOpenChange: (open: boolean) => void
  onDelete?: (id: string) => void
}

export function EditDriverDialog({ driver, open, onOpenChange, onDelete }: EditDriverDialogProps) {
  const updateDriver = useDriverStore((s) => s.updateDriver)

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})

  useEffect(() => {
    if (open && driver) {
      setName(driver.name)
      setPhone(driver.phone)
      setErrors({})
    }
  }, [open, driver])

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

    updateDriver(driver.id, {
      name: name.trim(),
      phone: phone.trim(),
    })

    toast.success(`Водитель "${name.trim()}" сохранён`)
    onOpenChange(false)
  }

  function handleDelete() {
    onDelete?.(driver.id)
    onOpenChange(false)
  }

  const inputClass =
    'h-11 w-full rounded-md border border-border bg-card px-3 text-base text-foreground placeholder:text-muted-foreground focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors'
  const labelClass = 'block text-sm font-medium text-foreground mb-1.5'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="text-lg">
            Редактирование: {driver.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <label htmlFor="edit-driver-name" className={labelClass}>
              Имя <span className="text-red-400">*</span>
            </label>
            <input
              id="edit-driver-name"
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
            <label htmlFor="edit-driver-phone" className={labelClass}>
              Телефон
            </label>
            <input
              id="edit-driver-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+7 (999) 123-45-67"
              className={inputClass}
            />
          </div>
        </div>

        <DialogFooter className="flex-row justify-between sm:justify-between">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="h-4 w-4" />
                Удалить
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Удалить водителя {driver.name}?</AlertDialogTitle>
                <AlertDialogDescription>
                  Водитель будет удалён из системы.
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

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button onClick={handleSave}>Сохранить</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
