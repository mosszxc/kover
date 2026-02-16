import { useState, useCallback } from 'react'
import { Plus, Loader2, ChevronLeft, ChevronRight } from 'lucide-react'
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
import { useSettingsStore } from '@/shared/stores/settingsStore'
import { useIsMobile } from '@/shared/hooks/useIsMobile'
import { useServiceLogStore } from '@/shared/stores/serviceLogStore'
import { useClientStore } from '../store'
import type { Client } from '../types'
import { buildOriginalName, rowsToSpecs } from '../lib/formHelpers'
import { useClientForm } from '../hooks/useClientForm'
import { ClientForm, TOTAL_STEPS } from './ClientForm'

export function AddClientDialog() {
  const addClient = useClientStore((s) => s.addClient)
  const addServiceLog = useServiceLogStore((s) => s.addEntry)
  const geocodeCity = useSettingsStore((s) => s.geocodeCity)
  const isMobile = useIsMobile()

  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [wizardStep, setWizardStep] = useState(0)
  const form = useClientForm()

  const isLastStep = wizardStep === TOTAL_STEPS - 1

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

    let lat: number | undefined
    let lng: number | undefined
    if (form.address.trim()) {
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
      workingHoursStart: form.workingHoursStart || null,
      workingHoursEnd: form.workingHoursEnd || null,
      contactName: form.contactName.trim() || null,
      contactPhone: form.contactPhone.trim() || null,
      customMonthlyPrice: form.customMonthlyPrice ? parseFloat(form.customMonthlyPrice) : null,
      ...(form.category ? { category: form.category } : {}),
      contractNumber: form.contractNumber.trim() || null,
      contractDate: form.contractDate || null,
      isActive: true,
      createdAt: new Date().toISOString(),
      ...(lat != null && lng != null ? { lat, lng } : {}),
    }

    addClient(newClient)
    addServiceLog({ clientId: newClient.id, type: 'client_created' })
    toast.success(`Клиент "${form.name.trim()}" добавлен`)
    setSaving(false)
    setOpen(false)
    form.resetForm()
    setWizardStep(0)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v)
        if (!v) {
          form.resetForm()
          setWizardStep(0)
        }
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

        <ClientForm
          form={form}
          mode="add"
          wizardStep={isMobile ? wizardStep : undefined}
          onWizardStepChange={isMobile ? setWizardStep : undefined}
        />

        <DialogFooter>
          {isMobile ? (
            <div className="flex w-full gap-2">
              {wizardStep > 0 && (
                <Button variant="outline" onClick={handleBack} className="flex-1">
                  <ChevronLeft className="h-4 w-4" />
                  Назад
                </Button>
              )}
              {isLastStep ? (
                <Button onClick={handleSave} disabled={saving} className="flex-1">
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
                <Button onClick={handleNext} className="flex-1">
                  Далее
                  <ChevronRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          ) : (
            <>
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
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
