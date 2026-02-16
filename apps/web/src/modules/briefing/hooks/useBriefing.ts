import { useMemo } from 'react'
import type { DayOfWeek } from '@/shared/types'
import type { DayRoute } from '@/modules/routes'
import type { Client } from '@/modules/clients'
import type { Payment } from '@/modules/payments'
import type { SizeInventorySummary } from '@/modules/inventory'
import type { RouteException } from '@/shared/stores/routeExceptionsStore'
import type { BriefingData, Alert, RouteBriefing, WornMat } from '../types'
import { DAY_LABELS_FULL } from '@/shared/types'

interface UseBriefingParams {
  routes: DayRoute[]
  clients: Client[]
  payments: Payment[]
  inventorySummary: SizeInventorySummary[]
  sizeLabels: Map<string, string>
  maxStopsPerDay: number
  drivers: { id: string; name: string }[]
  exceptions?: RouteException[]
}

function getTodayDow(): DayOfWeek {
  const jsDay = new Date().getDay()
  return (jsDay === 0 ? 6 : jsDay - 1) as DayOfWeek
}

function isStopSkipped(stop: { skippedUntil?: string }): boolean {
  if (!stop.skippedUntil) return false
  const today = new Date().toISOString().slice(0, 10)
  return stop.skippedUntil > today
}

export function useBriefing({
  routes,
  clients,
  payments,
  inventorySummary,
  sizeLabels,
  maxStopsPerDay,
  drivers,
  exceptions = [],
}: UseBriefingParams): BriefingData {
  const today = getTodayDow()

  return useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10)
    const todaySkipIds = new Set(
      exceptions
        .filter((ex) => ex.date === todayStr && ex.day === today && ex.type === 'skip')
        .map((ex) => ex.clientId),
    )
    const todayAdds = exceptions.filter(
      (ex) => ex.date === todayStr && ex.day === today && ex.type === 'add',
    )

    const todayRoute = routes.find((r) => r.day === today)
    const stops = todayRoute?.stops ?? []
    const activeStops = stops.filter((s) => !isStopSkipped(s) && !todaySkipIds.has(s.clientId))
    const skippedStops = stops.filter((s) => isStopSkipped(s) || todaySkipIds.has(s.clientId))

    // Build client map
    const clientMap = new Map(clients.map((c) => [c.id, c]))

    // Compute total mat area for today
    let totalMatsSqm = 0
    for (const stop of activeStops) {
      const client = clientMap.get(stop.clientId)
      if (!client) continue
      for (const mat of client.mats) {
        totalMatsSqm += mat.quantity * 1 // quantity of mats (not area — we don't have area map here)
      }
    }

    // Unique drivers for today
    const driverIds = new Set<string>()
    for (const stop of activeStops) {
      if (stop.driverId) driverIds.add(stop.driverId)
    }
    const driverNames = drivers
      .filter((d) => driverIds.has(d.id))
      .map((d) => d.name)

    const route: RouteBriefing = {
      totalStops: stops.length,
      activeStops: activeStops.length,
      skippedStops: skippedStops.length,
      drivers: driverNames,
      totalMatsSqm,
    }

    // Alerts
    const alerts: Alert[] = []

    // 1. Route overload
    if (activeStops.length > maxStopsPerDay) {
      alerts.push({
        id: 'overload',
        type: 'overload',
        title: 'Перегрузка маршрута',
        description: `${activeStops.length} остановок (макс. ${maxStopsPerDay})`,
      })
    }

    // 2. Mat shortages
    for (const item of inventorySummary) {
      if (item.inStock < 0) {
        const label = sizeLabels.get(item.sizeId) ?? item.sizeId
        alerts.push({
          id: `shortage-${item.sizeId}`,
          type: 'shortage',
          title: `Нехватка ковриков ${label}`,
          description: `Дефицит: ${Math.abs(item.inStock)} шт.`,
        })
      }
    }

    // 3. Overdue payments
    const overduePayments = payments.filter((p) => {
      if (p.paidAmount >= p.expectedAmount) return false
      const parts = p.period.split('-').map(Number)
      const year = parts[0] ?? 0
      const month = parts[1] ?? 0
      const periodEnd = new Date(year, month, 0)
      return new Date() > periodEnd
    })
    if (overduePayments.length > 0) {
      const uniqueClients = new Set(overduePayments.map((p) => p.clientId))
      alerts.push({
        id: 'overdue',
        type: 'overdue',
        title: 'Просроченные оплаты',
        description: `${uniqueClients.size} клиент(ов) с неоплаченными счетами`,
      })
    }

    // 4. Route exceptions for today
    const totalExceptions = todaySkipIds.size + todayAdds.length
    if (totalExceptions > 0) {
      const parts: string[] = []
      if (todaySkipIds.size > 0) parts.push(`${todaySkipIds.size} пропуск(ов)`)
      if (todayAdds.length > 0) parts.push(`${todayAdds.length} доп. визит(ов)`)
      alerts.push({
        id: 'exceptions',
        type: 'exceptions',
        title: 'Исключения на сегодня',
        description: parts.join(', '),
      })
    }

    // Returning clients (pausedUntil === today)
    const returningClients = clients.filter(
      (c) => c.pausedUntil && c.pausedUntil <= todayStr && c.isActive,
    )

    // Worn mats (>80% wash cycles)
    const wornMats: WornMat[] = inventorySummary
      .filter((item) => item.totalOwned > 0 && item.maxWashCycles > 0)
      .map((item) => ({
        sizeId: item.sizeId,
        sizeLabel: sizeLabels.get(item.sizeId) ?? item.sizeId,
        washCycles: item.washCycles,
        maxWashCycles: item.maxWashCycles,
        wearPercent: Math.round((item.washCycles / item.maxWashCycles) * 100),
      }))
      .filter((m) => m.wearPercent >= 80)
      .sort((a, b) => b.wearPercent - a.wearPercent)

    return {
      today,
      todayLabel: DAY_LABELS_FULL[today],
      route,
      alerts,
      returningClients,
      wornMats,
    }
  }, [routes, clients, payments, inventorySummary, sizeLabels, maxStopsPerDay, drivers, today, exceptions])
}
