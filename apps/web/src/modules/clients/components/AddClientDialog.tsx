import { useState } from 'react'
import { Plus, Loader2 } from 'lucide-react'
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
import { useClientStore } from '../store'
import type { Client } from '../types'
import { buildOriginalName, rowsToSpecs } from '../lib/formHelpers'
import { useClientForm } from '../hooks/useClientForm'
import { ClientForm } from './ClientForm'

export function AddClientDialog() {
  const addClient = useClientStore((s) => s.addClient)

  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const form = useClientForm()

  async function handleSave() {
    if (!form.validate()) return

    setSaving(true)

    let lat: number | undefined
    let lng: number | undefined
    if (form.address.trim()) {
      try {
        const result = await geocodeAddress(form.address.trim())
        if (result) {
          lat = result.lat
          lng = result.lng
        }
      } catch {
        // Geocoding failure is non-blocking
      }
    }

    const dayReplacements = Object.keys(form.dayReplacements).length > 0
      ? form.dayReplacements
      : undefined

    const newClient: Client = {
      id: generateId(),
      originalName: buildOriginalName(form.name, form.address, form.mats),
      name: form.name.trim(),
      address: form.address.trim(),
      mats: rowsToSpecs(form.mats),
      frequency: form.frequency,
      days: [...form.days].sort(),
      dayReplacements,
      notes: form.notes.trim(),
      isActive: true,
      createdAt: new Date().toISOString(),
      ...(lat != null && lng != null ? { lat, lng } : {}),
    }

    addClient(newClient)
    toast.success(`Клиент "${form.name.trim()}" добавлен`)
    setSaving(false)
    setOpen(false)
    form.resetForm()
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v)
        if (!v) form.resetForm()
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" className="border-dashed">
          <Plus className="h-4 w-4" />
          Добавить клиента
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle className="text-lg">Новый клиент</DialogTitle>
        </DialogHeader>

        <ClientForm form={form} mode="add" />

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
