import { useState } from 'react'
import { Settings2 } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/shared/ui/dialog'
import { useInvoiceSettingsStore } from '@/shared/stores/invoiceSettingsStore'
import { toast } from 'sonner'

const FIELDS = [
  { key: 'companyName', label: 'Название компании', placeholder: 'ООО «Ковёр Сервис»' },
  { key: 'inn', label: 'ИНН', placeholder: '7700000000' },
  { key: 'bankName', label: 'Банк', placeholder: 'ПАО Сбербанк' },
  { key: 'bankAccount', label: 'Расчётный счёт', placeholder: '40702810...' },
  { key: 'bik', label: 'БИК', placeholder: '044525225' },
  { key: 'corrAccount', label: 'Корр. счёт', placeholder: '30101810...' },
  { key: 'invoicePrefix', label: 'Префикс номера счёта', placeholder: 'К' },
] as const

type FieldKey = typeof FIELDS[number]['key']

export function InvoiceSettingsDialog() {
  const settings = useInvoiceSettingsStore()
  const [open, setOpen] = useState(false)
  const [values, setValues] = useState<Record<FieldKey, string>>(() =>
    Object.fromEntries(FIELDS.map((f) => [f.key, settings[f.key]])) as Record<FieldKey, string>,
  )

  function handleOpen(isOpen: boolean) {
    if (isOpen) {
      setValues(
        Object.fromEntries(FIELDS.map((f) => [f.key, settings[f.key]])) as Record<FieldKey, string>,
      )
    }
    setOpen(isOpen)
  }

  function handleSave() {
    settings.update(values)
    toast.success('Реквизиты сохранены')
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Settings2 className="size-4" />
          Реквизиты
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Реквизиты для счетов</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
          {FIELDS.map((f) => (
            <div key={f.key} className="space-y-1">
              <label htmlFor={`inv-${f.key}`} className="text-sm text-muted-foreground">
                {f.label}
              </label>
              <input
                id={`inv-${f.key}`}
                type="text"
                value={values[f.key]}
                onChange={(e) => setValues((prev) => ({ ...prev, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/50"
              />
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Отмена</Button>
          <Button onClick={handleSave}>Сохранить</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
