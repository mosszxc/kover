import { useState, useEffect, useCallback } from 'react'
import { Trash2, Loader2, ClipboardList, History, ChevronLeft, ChevronRight, Pause, Play, CalendarClock } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/shared/lib/utils'
import { diffClient } from '@/shared/lib/clientDiff'
import { useServiceLogStore } from '@/shared/stores/serviceLogStore'
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
import { isClientPaused, formatPausedUntil } from '../types'
import { buildOriginalName, rowsToSpecs } from '../lib/formHelpers'
import { PauseClientDialog } from './PauseClientDialog'
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
  const addServiceLog = useServiceLogStore((s) => s.addEntry)
  const geocodeCity = useSettingsStore((s) => s.geocodeCity)
  const isMobile = useIsMobile()

  const [saving, setSaving] = useState(false)
  const [geocoding, setGeocoding] = useState(false)
  const [tab, setTab] = useState<'data' | 'history'>('data')
  const [pauseDialogOpen, setPauseDialogOpen] = useState(false)
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

    const { scheduleChanges, profileChanges } = diffClient(client, data)
    if (scheduleChanges.length > 0) {
      addServiceLog({ clientId: client.id, type: 'schedule_changed', details: scheduleChanges.join('; ') })
    }
    if (profileChanges.length > 0) {
      addServiceLog({ clientId: client.id, type: 'profile_changed', details: profileChanges.join('; ') })
    }

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
          <div className="flex items-center gap-2">
            <DialogTitle className="text-lg">
              Редактирование: {client.name}
            </DialogTitle>
            {(() => {
              const paused = isClientPaused(client)
              return (
                <button
                  type="button"
                  onClick={() => {
                    if (!paused) {
                      setPauseDialogOpen(true)
                    } else {
                      updateClient(client.id, { isActive: true, pausedUntil: null })
                      toast.success('Клиент активирован', { duration: 2000 })
                    }
                  }}
                  className={cn(
                    'inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold transition-colors',
                    !paused
                      ? 'bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30'
                      : 'bg-amber-600/20 text-amber-400 hover:bg-amber-600/30',
                  )}
                  aria-label={!paused ? 'Поставить на паузу' : 'Активировать'}
                >
                  {!paused ? (
                    <>
                      <Pause className="size-3" />
                      Активен
                    </>
                  ) : client.pausedUntil ? (
                    <>
                      <CalendarClock className="size-3" />
                      До {formatPausedUntil(client.pausedUntil)}
                    </>
                  ) : (
                    <>
                      <Play className="size-3" />
                      На паузе
                    </>
                  )}
                </button>
              )
            })()}
          </div>
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

      <PauseClientDialog
        open={pauseDialogOpen}
        onOpenChange={(v) => { if (!v) setPauseDialogOpen(false) }}
        clientName={client.name}
        onPause={(pausedUntil) => {
          updateClient(client.id, { isActive: false, pausedUntil })
          setPauseDialogOpen(false)
          toast.success(
            pausedUntil
              ? `Клиент на паузе до ${formatPausedUntil(pausedUntil)}`
              : 'Клиент поставлен на паузу',
            { duration: 2000 },
          )
        }}
      />
    </Dialog>
  )
}
