import { useMemo } from 'react'
import { usePaymentStore } from '@/modules/payments'
import { useCostSettingsStore } from '@/shared/stores/costSettingsStore'
import { useClientStore } from '@/modules/clients'
import { useRouteStore } from '@/modules/routes'
import { useMatSizeStore } from '@/shared/stores/matSizeStore'

export interface MonthlyRevenue {
  period: string
  label: string
  revenue: number
  expected: number
  costs: number
  margin: number
}

const MONTH_NAMES = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек']

export function useRevenueChart(): { months: MonthlyRevenue[]; hasCosts: boolean } {
  const payments = usePaymentStore((s) => s.payments)
  const laundryCostPerSqm = useCostSettingsStore((s) => s.laundryCostPerSqm)
  const logisticsCostPerStop = useCostSettingsStore((s) => s.logisticsCostPerStop)
  const clients = useClientStore((s) => s.clients)
  const routes = useRouteStore((s) => s.routes)
  const sizes = useMatSizeStore((s) => s.sizes)

  return useMemo(() => {
    const hasCosts = laundryCostPerSqm > 0 || logisticsCostPerStop > 0

    // Group payments by period
    const periodMap = new Map<string, { revenue: number; expected: number }>()
    for (const p of payments) {
      const existing = periodMap.get(p.period) ?? { revenue: 0, expected: 0 }
      existing.revenue += p.paidAmount
      existing.expected += p.expectedAmount
      periodMap.set(p.period, existing)
    }

    // Estimate monthly costs (simplified: based on current route structure)
    // Total area of all active client mats
    const areaMap = Object.fromEntries(sizes.map((s) => [s.id, s.area]))
    let totalAreaPerWeek = 0
    let totalStopsPerWeek = 0
    for (const route of routes) {
      const activeStops = route.stops.filter((s) => !s.skippedUntil || s.skippedUntil <= new Date().toISOString().slice(0, 10))
      totalStopsPerWeek += activeStops.length
      for (const stop of activeStops) {
        const client = clients.find((c) => c.id === stop.clientId)
        if (!client) continue
        for (const mat of client.mats) {
          totalAreaPerWeek += mat.quantity * (areaMap[mat.size] ?? 0)
        }
      }
    }
    const monthlyCosts = hasCosts
      ? Math.round((totalAreaPerWeek * laundryCostPerSqm * 4.33 + totalStopsPerWeek * logisticsCostPerStop * 4.33) * 100) / 100
      : 0

    // Get last 12 months
    const now = new Date()
    const periods: string[] = []
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      periods.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
    }

    const months: MonthlyRevenue[] = periods.map((period) => {
      const data = periodMap.get(period)
      const revenue = Math.round((data?.revenue ?? 0) * 100) / 100
      const expected = Math.round((data?.expected ?? 0) * 100) / 100
      const [, m] = period.split('-')
      const monthIdx = parseInt(m ?? '1', 10) - 1
      return {
        period,
        label: MONTH_NAMES[monthIdx] ?? m!,
        revenue,
        expected,
        costs: monthlyCosts,
        margin: Math.round((revenue - monthlyCosts) * 100) / 100,
      }
    })

    // Filter to only show months that have data or are recent
    const firstDataIdx = months.findIndex((m) => m.revenue > 0 || m.expected > 0)
    const filtered = firstDataIdx >= 0 ? months.slice(firstDataIdx) : months.slice(-6)

    return { months: filtered, hasCosts }
  }, [payments, laundryCostPerSqm, logisticsCostPerStop, clients, routes, sizes])
}
