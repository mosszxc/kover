import { useMemo, useState } from 'react'
import { DaySwitcher, RouteDashboard, RouteSearch, StopList, AddStopDialog, useRouteStore, PrintButton, DriverFilter, BulkAssignDriverDialog, DistributeDriversDialog, isStopSkipped, ServiceReportDialog } from '@/modules/routes'
import { useClientStore, EditClientDialog } from '@/modules/clients'
import type { Client } from '@/modules/clients'
import { useDriverStore } from '@/modules/drivers'
import { PrintSheet } from '@/modules/print'
import { OptimizeRouteDialog } from '@/modules/map'
import { useClientPaymentStatus } from '@/modules/payments'

const EMPTY_STOPS: never[] = []

export function RoutesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [driverFilter, setDriverFilter] = useState<string | 'unassigned' | null>(null)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [reportClient, setReportClient] = useState<Client | null>(null)
  const clients = useClientStore((s) => s.clients)
  const allDrivers = useDriverStore((s) => s.drivers)
  const selectedDay = useRouteStore((s) => s.selectedDay)
  const stops = useRouteStore((s) => s.routes.find((r) => r.day === selectedDay)?.stops ?? EMPTY_STOPS)

  const driverOptions = useMemo(
    () => allDrivers.filter((d) => d.isActive).map((d) => ({ id: d.id, name: d.name, workDays: d.workDays ?? [0, 1, 2, 3, 4, 5, 6] as const })),
    [allDrivers],
  )

  const activeClientIds = useMemo(
    () => new Set(clients.filter((c) => c.isActive).map((c) => c.id)),
    [clients],
  )
  const activeStops = useMemo(
    () => stops.filter((s) => activeClientIds.has(s.clientId) && !isStopSkipped(s)),
    [stops, activeClientIds],
  )

  const paymentStatusRaw = useClientPaymentStatus()
  const paymentStatusMap = useMemo(() => {
    const map = new Map<string, { status: 'paid' | 'partial' | 'overdue' | 'pending'; debt: number }>()
    for (const [clientId, info] of paymentStatusRaw) {
      map.set(clientId, { status: info.status, debt: info.debt })
    }
    return map
  }, [paymentStatusRaw])

  return (
    <div>
      <div className="space-y-4 print:hidden">
        <div className="flex items-center gap-2 flex-wrap">
          <DaySwitcher />
          <div className="flex items-center gap-2 ml-auto">
            <OptimizeRouteDialog />
            <PrintButton />
          </div>
        </div>
        <RouteDashboard drivers={driverOptions} />
        <div className="flex items-center gap-2">
          <DriverFilter drivers={driverOptions} value={driverFilter} onChange={setDriverFilter} />
          <BulkAssignDriverDialog drivers={driverOptions} driverFilter={driverFilter} />
          <DistributeDriversDialog drivers={driverOptions} clients={clients} />
        </div>
        <RouteSearch value={searchQuery} onChange={setSearchQuery} />
        <StopList searchQuery={searchQuery} drivers={driverOptions} driverFilter={driverFilter} onEditClient={setEditingClient} paymentStatusMap={paymentStatusMap} onServiceReport={setReportClient} />
        <AddStopDialog clients={clients} />
      </div>
      <PrintSheet stops={activeStops} clients={clients} selectedDay={selectedDay} drivers={driverOptions} />
      {editingClient && (
        <EditClientDialog
          client={editingClient}
          open={!!editingClient}
          onOpenChange={(open) => { if (!open) setEditingClient(null) }}
        />
      )}
      {reportClient && (
        <ServiceReportDialog
          open={!!reportClient}
          onOpenChange={(open) => { if (!open) setReportClient(null) }}
          clientId={reportClient.id}
          clientName={reportClient.originalName}
          mats={reportClient.mats}
          day={selectedDay}
        />
      )}
    </div>
  )
}
