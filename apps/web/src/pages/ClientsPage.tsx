import { useCallback, useEffect, useMemo, useState } from 'react'
import { ClientsTable, EditClientDialog, AddClientDialog, useClientStore, BatchGeocode, GeocodeSettings, isClientPaused, CostSettingsDialog } from '@/modules/clients'
import type { PaymentInfo, ChurnRiskClientInfo } from '@/modules/clients'
import { useRouteStore } from '@/modules/routes'
import { usePaymentStore, useClientPaymentStatus, RecordPaymentDialog, getCurrentPeriod } from '@/modules/payments'
import { toast } from 'sonner'
import { useChurnRisk } from '@/modules/stats'
import { InvoiceSettingsDialog, GenerateInvoicesDialog } from '@/modules/invoices'
import type { Client } from '@/modules/clients'
import type { DayOfWeek } from '@/shared/types'
import { generateId } from '@/shared/lib/generateId'
import { detectGeoAnomalies } from '@/shared/lib/geoAnomalies'
import { useServiceLogStore } from '@/shared/stores/serviceLogStore'
import { useMatSizeStore } from '@/shared/stores/matSizeStore'

const WEEKS_PER_MONTH = 4.33

function getMonthlyRevenue(client: Client, priceMap: Record<string, number>): number {
  if (client.customMonthlyPrice != null && client.customMonthlyPrice > 0) {
    return client.customMonthlyPrice
  }
  const costPerVisit = client.mats.reduce((sum, m) => sum + m.quantity * (priceMap[m.size] ?? 0), 0)
  return Math.round(costPerVisit * client.frequency * WEEKS_PER_MONTH * 100) / 100
}

export function ClientsPage() {
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [paymentClient, setPaymentClient] = useState<Client | null>(null)
  const clients = useClientStore((s) => s.clients)
  const deleteClient = useClientStore((s) => s.deleteClient)
  const updateClient = useClientStore((s) => s.updateClient)
  const addStop = useRouteStore((s) => s.addStop)
  const routes = useRouteStore((s) => s.routes)
  const addServiceLog = useServiceLogStore((s) => s.addEntry)
  const sizes = useMatSizeStore((s) => s.sizes)
  const payments = usePaymentStore((s) => s.payments)
  const addPayment = usePaymentStore((s) => s.addPayment)
  const updatePayment = usePaymentStore((s) => s.updatePayment)

  const priceMap = useMemo(
    () => Object.fromEntries(sizes.map((s) => [s.id, s.rentalPrice])),
    [sizes],
  )
  const hasPrices = useMemo(() => sizes.some((s) => s.rentalPrice > 0), [sizes])

  // Auto-ensure payment records for current period
  useEffect(() => {
    if (!hasPrices) return
    const currentPeriod = getCurrentPeriod()
    const existingClientIds = new Set(
      payments.filter((p) => p.period === currentPeriod).map((p) => p.clientId),
    )
    const activeClients = clients.filter((c) => !isClientPaused(c))
    for (const client of activeClients) {
      if (existingClientIds.has(client.id)) continue
      const expected = getMonthlyRevenue(client, priceMap)
      if (expected <= 0) continue
      addPayment({
        id: crypto.randomUUID(),
        clientId: client.id,
        period: currentPeriod,
        expectedAmount: expected,
        paidAmount: 0,
        paidAt: null,
        notes: '',
        createdAt: new Date().toISOString(),
      })
    }
  }, [clients, payments, priceMap, hasPrices, addPayment])

  const paymentStatusMap = useClientPaymentStatus()

  // Convert to PaymentInfo map for ClientsTable
  const paymentInfoMap = useMemo(() => {
    const map = new Map<string, PaymentInfo>()
    for (const [clientId, info] of paymentStatusMap) {
      map.set(clientId, { status: info.status, debt: info.debt })
    }
    return map
  }, [paymentStatusMap])

  const activeClients = useMemo(() => clients.filter((c) => !isClientPaused(c)), [clients])
  const anomalyIds = useMemo(() => detectGeoAnomalies(activeClients), [activeClients])

  const routeClientSet = useMemo(() => {
    const set = new Set<string>()
    for (const route of routes) {
      for (const stop of route.stops) {
        set.add(`${stop.clientId}-${route.day}`)
      }
    }
    return set
  }, [routes])

  const isClientInRoute = useCallback(
    (clientId: string, day: DayOfWeek) => routeClientSet.has(`${clientId}-${day}`),
    [routeClientSet],
  )

  const handleToggleActive = useCallback(
    (client: Client) => {
      updateClient(client.id, { isActive: true, pausedUntil: null })

      for (const day of client.days) {
        addServiceLog({ clientId: client.id, day, type: 'unpaused' })
      }

      for (const day of client.days) {
        const route = routes.find((r) => r.day === day)
        const alreadyInRoute = route?.stops.some((s) => s.clientId === client.id)
        if (!alreadyInRoute) {
          addStop(day, {
            id: generateId(),
            clientId: client.id,
            position: route?.stops.length ?? 0,
            isCompleted: false,
          })
        }
      }
    },
    [updateClient, routes, addStop, addServiceLog],
  )

  const handlePauseClient = useCallback(
    (client: Client, pausedUntil: string | null) => {
      updateClient(client.id, { isActive: false, pausedUntil })
      for (const day of client.days) {
        addServiceLog({ clientId: client.id, day, type: 'paused' })
      }
    },
    [updateClient, addServiceLog],
  )

  // Get existing payment for dialog
  const paymentClientPayment = useMemo(() => {
    if (!paymentClient) return null
    const currentPeriod = getCurrentPeriod()
    return payments.find((p) => p.clientId === paymentClient.id && p.period === currentPeriod) ?? null
  }, [paymentClient, payments])

  const paymentClientRevenue = paymentClient ? getMonthlyRevenue(paymentClient, priceMap) : 0

  const handleQuickPay = useCallback(
    (client: Client) => {
      const currentPeriod = getCurrentPeriod()
      const payment = payments.find((p) => p.clientId === client.id && p.period === currentPeriod)
      if (!payment) return
      updatePayment(payment.id, {
        paidAmount: payment.expectedAmount,
        paidAt: new Date().toISOString(),
      })
      toast.success(`${client.name}: оплата ${payment.expectedAmount.toLocaleString('ru-RU')} ₽`, { duration: 2000 })
    },
    [payments, updatePayment],
  )

  const { riskMap: churnRiskData } = useChurnRisk()
  const churnRiskMap = useMemo(() => {
    const map = new Map<string, ChurnRiskClientInfo>()
    for (const [clientId, info] of churnRiskData) {
      map.set(clientId, { level: info.level, reasons: info.reasons, isDismissed: info.isDismissed })
    }
    return map
  }, [churnRiskData])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between print:hidden">
        <h1 className="text-2xl font-bold text-foreground">Клиенты</h1>
        <div className="flex items-center gap-2">
          <CostSettingsDialog />
          <InvoiceSettingsDialog />
          <GenerateInvoicesDialog clients={clients} sizes={sizes} />
          <GeocodeSettings />
          <BatchGeocode />
          <AddClientDialog />
        </div>
      </div>
      <ClientsTable
        onRowClick={setSelectedClient}
        isClientInRoute={isClientInRoute}
        onToggleActive={handleToggleActive}
        onPauseClient={handlePauseClient}
        anomalyIds={anomalyIds}
        paymentStatusMap={hasPrices ? paymentInfoMap : undefined}
        onRecordPayment={hasPrices ? setPaymentClient : undefined}
        onQuickPay={hasPrices ? handleQuickPay : undefined}
        churnRiskMap={churnRiskMap}
      />
      {selectedClient && (
        <EditClientDialog
          client={selectedClient}
          open={!!selectedClient}
          onOpenChange={(open) => { if (!open) setSelectedClient(null) }}
          onDelete={(id) => {
            addServiceLog({ clientId: id, type: 'client_deleted' })
            deleteClient(id)
            setSelectedClient(null)
          }}
        />
      )}
      {paymentClient && (
        <RecordPaymentDialog
          open={!!paymentClient}
          onOpenChange={(open) => { if (!open) setPaymentClient(null) }}
          clientId={paymentClient.id}
          clientName={paymentClient.name}
          expectedAmount={paymentClientRevenue}
          existingPayment={paymentClientPayment}
        />
      )}
    </div>
  )
}
