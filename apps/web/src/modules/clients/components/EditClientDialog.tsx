import { useState, useEffect } from 'react'
import { Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { geocodeAddress } from '@/shared/lib/geocode'
import { useSettingsStore } from '@/shared/stores/settingsStore'
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
import { useClientStore } from '../store'
import type { Client } from '../types'
import { buildOriginalName, rowsToSpecs } from '../lib/formHelpers'
import { useClientForm } from '../hooks/useClientForm'
import { ClientForm } from './ClientForm'

interface EditClientDialogProps {
  client: Client
  open: boolean
  onOpenChange: (open: boolean) => void
  onDelete?: (id: string) => void
}

export function EditClientDialog({ client, open, onOpenChange, onDelete }: EditClientDialogProps) {
  const updateClient = useClientStore((s) => s.updateClient)
  const geocodeCity = useSettingsStore((s) => s.geocodeCity)

  const [saving, setSaving] = useState(false)
  const [geocoding, setGeocoding] = useState(false)
  const form = useClientForm()

  useEffect(() => {
    if (open && client) {
      form.populateForm({
        name: client.name,
        address: client.address,
        mats: client.mats,
        frequency: client.frequency,
        days: client.days,
        dayReplacements: client.dayReplacements,
        notes: client.notes,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, client])

  async function handleSave() {
    if (!form.validate()) return

    setSaving(true)

    let lat = client.lat
    let lng = client.lng
    const addressChanged = form.address.trim() !== client.address.trim()
    if (form.address.trim() && (addressChanged || lat == null)) {
      try {
        const result = await geocodeAddress(form.address.trim(), geocodeCity || undefined)
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

    const data: Partial<Client> = {
      name: form.name.trim(),
      address: form.address.trim(),
      mats: rowsToSpecs(form.mats),
      frequency: form.frequency,
      days: [...form.days].sort(),
      dayReplacements,
      notes: form.notes.trim(),
      originalName: buildOriginalName(form.name, form.address, form.mats),
      ...(lat != null && lng != null ? { lat, lng } : {}),
    }

    updateClient(client.id, data)
    toast.success(`Клиент "${form.name.trim()}" сохранён`)
    setSaving(false)
    onOpenChange(false)
  }

  async function handleGeocode() {
    if (!form.address.trim()) return
    setGeocoding(true)
    try {
      const result = await geocodeAddress(form.address.trim(), geocodeCity || undefined)
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
  }

  function handleDelete() {
    onDelete?.(client.id)
    onOpenChange(false)
  }

  const coordinates = client.lat != null && client.lng != null
    ? { lat: client.lat, lng: client.lng }
    : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle className="text-lg">
            Редактирование: {client.name}
          </DialogTitle>
        </DialogHeader>

        <ClientForm
          form={form}
          mode="edit"
          coordinates={coordinates}
          onGeocode={handleGeocode}
          geocoding={geocoding}
        />

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

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
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
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
