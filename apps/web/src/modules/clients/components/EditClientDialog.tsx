import { useState, useEffect, useCallback } from 'react'
import { Trash2, Loader2, ClipboardList, History, ChevronLeft, ChevronRight } from 'lucide-react'
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
import { useIsMobile } from '@/shared/hooks/useIsMobile'
import { useClientStore } from '../store'
import type { Client } from '../types'
import { buildOriginalName, rowsToSpecs } from '../lib/formHelpers'
import { useClientForm } from '../hooks/useClientForm'
import { ClientForm, TOTAL_STEPS } from './ClientForm'
import { ServiceHistory } from './ServiceHistory'

interface EditClientDialogProps {
  client: Client
  open: boolean
  onOpenChange: (open: boolean) => void
  onDelete?: (id: string) => void
}

export function EditClientDialog({ client, open, onOpenChange, onDelete }: EditClientDialogProps) {
  const updateClient = useClientStore((s) => s.updateClient)
  const geocodeCity = useSettingsStore((s) => s.geocodeCity)
  const isMobile = useIsMobile()

  const [saving, setSaving] = useState(false)
  const [geocoding, setGeocoding] = useState(false)
  const [tab, setTab] = useState<'data' | 'history'>('data')
  const [wizardStep, setWizardStep] = useState(0)
  const form = useClientForm()

  const isLastStep = wizardStep === TOTAL_STEPS - 1

  useEffect(() => {
    if (open && client) {
      setTab('data')
      setWizardStep(0)
      form.populateForm({
        name: client.name,
        address: client.address,
        mats: client.mats,
        frequency: client.frequency,
        days: client.days,
        dayReplacements: client.dayReplacements,
        notes: client.notes,
        workingHoursStart: client.workingHoursStart,
        workingHoursEnd: client.workingHoursEnd,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, client])

  const validateCurrentStep = useCallback((): boolean => {
    switch (wizardStep) {
      case 0:
        return form.validateField('name')
      case 1:
        return form.validateField('mats')
      default:
        return true
    }
  }, [wizardStep, form])

  function handleNext() {
    if (!validateCurrentStep()) return
    setWizardStep((s) => Math.min(s + 1, TOTAL_STEPS - 1))
  }

  function handleBack() {
    setWizardStep((s) => Math.max(s - 1, 0))
  }

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
      workingHoursStart: form.workingHoursStart || null,
      workingHoursEnd: form.workingHoursEnd || null,
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
          <div className="flex gap-1 pt-2">
            <button
              type="button"
              onClick={() => setTab('data')}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                tab === 'data'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <ClipboardList className="h-3.5 w-3.5" />
              Данные
            </button>
            <button
              type="button"
              onClick={() => setTab('history')}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                tab === 'history'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <History className="h-3.5 w-3.5" />
              История
            </button>
          </div>
        </DialogHeader>

        {tab === 'data' ? (
          <ClientForm
            form={form}
            mode="edit"
            coordinates={coordinates}
            onGeocode={handleGeocode}
            geocoding={geocoding}
            wizardStep={isMobile ? wizardStep : undefined}
            onWizardStepChange={isMobile ? setWizardStep : undefined}
          />
        ) : (
          <ServiceHistory clientId={client.id} />
        )}

        <DialogFooter className={`flex-row justify-between sm:justify-between ${tab === 'history' ? 'hidden' : ''}`}>
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

          {isMobile ? (
            <div className="flex gap-2">
              {wizardStep > 0 && (
                <Button variant="outline" onClick={handleBack} size="sm">
                  <ChevronLeft className="h-4 w-4" />
                  Назад
                </Button>
              )}
              {isLastStep ? (
                <Button onClick={handleSave} disabled={saving} size="sm">
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Сохранение...
                    </>
                  ) : (
                    'Сохранить'
                  )}
                </Button>
              ) : (
                <Button onClick={handleNext} size="sm">
                  Далее
                  <ChevronRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          ) : (
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
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
