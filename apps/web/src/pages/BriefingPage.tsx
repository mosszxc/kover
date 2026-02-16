import { useMemo } from 'react'
import { useBriefing, RouteCard, AlertsList, ReturningClients, WornMatsList, QuickLinks } from '@/modules/briefing'
import { DebtAging } from '@/modules/stats'
import { useRouteStore } from '@/modules/routes'
import { useClientStore } from '@/modules/clients'
import { usePaymentStore } from '@/modules/payments'
import { useInventorySummary } from '@/modules/inventory'
import { useRouteSettingsStore } from '@/shared/stores/routeSettingsStore'
import { useMatSizeStore } from '@/shared/stores/matSizeStore'
import { useRouteExceptionsStore } from '@/shared/stores/routeExceptionsStore'
import { useDriverStore } from '@/modules/drivers'

export function BriefingPage() {
  const routes = useRouteStore((s) => s.routes)
  const clients = useClientStore((s) => s.clients)
  const payments = usePaymentStore((s) => s.payments)
  const maxStopsPerDay = useRouteSettingsStore((s) => s.maxStopsPerDay)
  const sizes = useMatSizeStore((s) => s.sizes)
  const drivers = useDriverStore((s) => s.drivers)
  const exceptions = useRouteExceptionsStore((s) => s.exceptions)

  const clientMatTotals = useMemo(() => {
    const map = new Map<string, number>()
    for (const client of clients) {
      if (!client.isActive) continue
      for (const mat of client.mats) {
        map.set(mat.size, (map.get(mat.size) ?? 0) + mat.quantity)
      }
    }
    return map
  }, [clients])

  const sizeLabels = useMemo(
    () => new Map(sizes.map((s) => [s.id, s.label])),
    [sizes],
  )

  const inventorySummary = useInventorySummary({ clientMatTotals })

  const briefing = useBriefing({
    routes,
    clients,
    payments,
    inventorySummary,
    sizeLabels,
    maxStopsPerDay,
    drivers,
    exceptions,
  })

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-foreground">Сегодня</h1>
      <RouteCard route={briefing.route} todayLabel={briefing.todayLabel} />
      <AlertsList alerts={briefing.alerts} />
      <DebtAging />
      <ReturningClients clients={briefing.returningClients} />
      <WornMatsList mats={briefing.wornMats} />
      <QuickLinks />
    </div>
  )
}
