import { useMemo, useState, useCallback } from 'react'
import { DaySwitcher, RouteDashboard, RouteSearch, StopList, AddStopDialog, AddOneTimeDialog, useRouteStore, PrintButton, DriverFilter, BulkAssignDriverDialog, DistributeDriversDialog, isStopSkipped, ServiceReportDialog } from '@/modules/routes'
import type { StopExecutionInfo, ExecutionSummary } from '@/modules/routes'
import { useClientStore, EditClientDialog } from '@/modules/clients'
import type { Client } from '@/modules/clients'
import { useDriverStore } from '@/modules/drivers'
import { PrintSheet, PrintFieldsToggle } from '@/modules/print'
import { OptimizeRouteDialog } from '@/modules/map'
import { useClientPaymentStatus } from '@/modules/payments'
import { useRouteExceptionsStore } from '@/shared/stores/routeExceptionsStore'
import { useRouteExecutionStore } from '@/shared/stores/routeExecutionStore'
import type { StopExecutionStatus } from '@/shared/stores/routeExecutionStore'

const EMPTY_STOPS: never[] = []

export function RoutesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [driverFilter, setDriverFilter] = useState<string | 'unassigned' | null>(null)
  const [printDriverIds, setPrintDriverIds] = useState<string[]>([])
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [reportClient, setReportClient] = useState<Client | null>(null)
  const clients = useClientStore((s) => s.clients)
  const allDrivers = useDriverStore((s) => s.drivers)
  const selectedDay = useRouteStore((s) => s.selectedDay)
  const stops = useRouteStore((s) => s.routes.find((r) => r.day === selectedDay)?.stops ?? EMPTY_STOPS)

  const driverOptions = useMemo(
    () => allDrivers.filter((d) => d.isActive).map((d) => ({ id: d.id, name: d.name, workDays: d.workDays ?? [0, 1, 2, 3, 4, 5, 6] as const, vehicleCapacity: d.vehicleCapacity })),
    [allDrivers],
  )

  const exceptions = useRouteExceptionsStore((s) => s.exceptions)
  const today = new Date().toISOString().slice(0, 10)

  const todaySkipIds = useMemo(() => {
    const set = new Set<string>()
    for (const ex of exceptions) {
      if (ex.date === today && ex.day === selectedDay && ex.type === 'skip') {
        set.add(ex.clientId)
      }
    }
    return set
  }, [exceptions, today, selectedDay])

  const activeClientIds = useMemo(
    () => new Set(clients.filter((c) => c.isActive).map((c) => c.id)),
    [clients],
  )
  const activeStops = useMemo(
    () => stops.filter((s) => activeClientIds.has(s.clientId) && !isStopSkipped(s) && !todaySkipIds.has(s.clientId)),
    [stops, activeClientIds, todaySkipIds],
  )

  const paymentStatusRaw = useClientPaymentStatus()
  const paymentStatusMap = useMemo(() => {
    const map = new Map<string, { status: 'paid' | 'partial' | 'overdue' | 'pending'; debt: number }>()
    for (const [clientId, info] of paymentStatusRaw) {
      map.set(clientId, { status: info.status, debt: info.debt })
    }
    return map
  }, [paymentStatusRaw])

  // Route execution
  const executions = useRouteExecutionStore((s) => s.executions)
  const setExecution = useRouteExecutionStore((s) => s.setExecution)
  const removeExecution = useRouteExecutionStore((s) => s.removeExecution)

  const executionMap = useMemo(() => {
    const map = new Map<string, StopExecutionInfo>()
    for (const ex of executions) {
      if (ex.date === today && ex.day === selectedDay) {
        map.set(ex.stopId, { status: ex.status, note: ex.note })
      }
    }
    return map
  }, [executions, today, selectedDay])

  const executionSummary = useMemo((): ExecutionSummary => {
    const total = activeStops.length
    let completed = 0
    let skipped = 0
    let problem = 0
    for (const stop of activeStops) {
      const ex = executionMap.get(stop.id)
      if (ex) {
        if (ex.status === 'completed') completed++
        else if (ex.status === 'skipped') skipped++
        else if (ex.status === 'problem') problem++
      }
    }
    return { total, completed, skipped, problem }
  }, [activeStops, executionMap])

  const handleSetExecution = useCallback(
    (stopId: string, clientId: string, status: StopExecutionStatus, note?: string) => {
      setExecution({ stopId, clientId, date: today, day: selectedDay, status, note })
    },
    [setExecution, today, selectedDay],
  )

  const handleRemoveExecution = useCallback(
    (stopId: string) => {
      removeExecution(stopId, today)
    },
    [removeExecution, today],
  )

  return (
    <div>
      <div className="space-y-4 print:hidden">
        <div className="flex items-center gap-2 flex-wrap">
          <DaySwitcher />
          <div className="flex items-center gap-2 ml-auto">
            <OptimizeRouteDialog />
            <PrintButton drivers={driverOptions} selectedDriverIds={printDriverIds} onSelectedDriverIdsChange={setPrintDriverIds}>
              <PrintFieldsToggle />
            </PrintButton>
          </div>
        </div>
        <RouteDashboard drivers={driverOptions} executionSummary={executionSummary} />
        <div className="flex items-center gap-2">
          <DriverFilter drivers={driverOptions} value={driverFilter} onChange={setDriverFilter} />
          <BulkAssignDriverDialog drivers={driverOptions} driverFilter={driverFilter} />
          <DistributeDriversDialog drivers={driverOptions} clients={clients} />
        </div>
        <RouteSearch value={searchQuery} onChange={setSearchQuery} />
        <StopList searchQuery={searchQuery} drivers={driverOptions} driverFilter={driverFilter} onEditClient={setEditingClient} paymentStatusMap={paymentStatusMap} onServiceReport={setReportClient} executionMap={executionMap} onSetExecution={handleSetExecution} onRemoveExecution={handleRemoveExecution} />
        <div className="flex gap-2">
          <AddStopDialog clients={clients} />
          <AddOneTimeDialog clients={clients} />
        </div>
      </div>
      <PrintSheet stops={activeStops} clients={clients} selectedDay={selectedDay} drivers={driverOptions} selectedDriverIds={printDriverIds} />
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
