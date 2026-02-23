import { useMemo } from 'react'
import { useClientStore } from '@/modules/clients'
import { useMatSizeStore } from '@/shared/stores/matSizeStore'
import { useCostSettingsStore } from '@/shared/stores/costSettingsStore'
import { cn } from '@/shared/lib/utils'

const WEEKS_PER_MONTH = 4.33

export function ClientStats() {
  const clients = useClientStore((s) => s.clients)
  const sizes = useMatSizeStore((s) => s.sizes)
  const laundryCostPerSqm = useCostSettingsStore((s) => s.laundryCostPerSqm)
  const logisticsCostPerStop = useCostSettingsStore((s) => s.logisticsCostPerStop)
  const hasCostSettings = laundryCostPerSqm > 0 || logisticsCostPerStop > 0

  const { topClients, frequencyDist, topByMargin, worstByMargin } = useMemo(() => {
    const areaMap = Object.fromEntries(sizes.map((s) => [s.id, s.area]))
    const priceMap = Object.fromEntries(sizes.map((s) => [s.id, s.rentalPrice]))

    const getClientArea = (mats: { size: string; quantity: number }[]) =>
      mats.reduce((sum, m) => sum + m.quantity * (areaMap[m.size] ?? 0), 0)

    const getClientCost = (mats: { size: string; quantity: number }[]) =>
      mats.reduce((sum, m) => sum + m.quantity * (priceMap[m.size] ?? 0), 0)

    const active = clients.filter((c) => c.isActive)

    const sorted = active
      .map((c) => ({ name: c.name || c.originalName, area: getClientArea(c.mats) }))
      .sort((a, b) => b.area - a.area)
      .slice(0, 10)

    const freq: Record<number, number> = {}
    for (const c of active) {
      freq[c.frequency] = (freq[c.frequency] ?? 0) + 1
    }

    let topMargin: { name: string; margin: number; pct: number }[] = []
    let worstMargin: { name: string; margin: number; pct: number }[] = []

    if (hasCostSettings) {
      const withMargin = active.map((c) => {
        const area = getClientArea(c.mats)
        const costPerVisit = getClientCost(c.mats)
        const revenue = c.customMonthlyPrice != null && c.customMonthlyPrice > 0
          ? c.customMonthlyPrice
          : Math.round(costPerVisit * c.frequency * WEEKS_PER_MONTH * 100) / 100
        const visitsPerMonth = c.frequency * WEEKS_PER_MONTH
        const serviceCost = Math.round((area * laundryCostPerSqm * visitsPerMonth + logisticsCostPerStop * visitsPerMonth) * 100) / 100
        const margin = Math.round((revenue - serviceCost) * 100) / 100
        const pct = revenue > 0 ? Math.round((margin / revenue) * 100) : 0
        return { name: c.name || c.originalName, margin, pct }
      })

      topMargin = withMargin
        .filter((c) => c.margin > 0)
        .sort((a, b) => b.margin - a.margin)
        .slice(0, 10)

      worstMargin = withMargin
        .sort((a, b) => a.margin - b.margin)
        .slice(0, 5)
    }

    return { topClients: sorted, frequencyDist: freq, topByMargin: topMargin, worstByMargin: worstMargin }
  }, [clients, sizes, hasCostSettings, laundryCostPerSqm, logisticsCostPerStop])

  const maxArea = topClients[0]?.area ?? 1
  const maxMargin = topByMargin[0]?.margin ?? 1

  return (
    <div className="space-y-6">
      {/* Top clients by area */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Топ-10 клиентов по метражу</h2>
        <div className="space-y-2">
          {topClients.map((client, i) => {
            const pct = (client.area / maxArea) * 100
            return (
              <div key={i} className="flex items-center gap-3">
                <span className="w-44 truncate text-sm text-muted-foreground" title={client.name}>
                  {client.name}
                </span>
                <div className="flex-1">
                  <div
                    className={`h-6 rounded ${i === 0 ? 'bg-blue-600' : 'bg-muted'}`}
                    style={{ width: `${Math.max(pct, 2)}%` }}
                  />
                </div>
                <span className="w-16 text-right text-sm tabular-nums text-foreground">
                  {client.area.toFixed(1)}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Top by margin */}
      {hasCostSettings && topByMargin.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Топ-10 по марже</h2>
          <div className="space-y-2">
            {topByMargin.map((client, i) => {
              const pct = (client.margin / maxMargin) * 100
              return (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-44 truncate text-sm text-muted-foreground" title={client.name}>
                    {client.name}
                  </span>
                  <div className="flex-1">
                    <div
                      className={`h-6 rounded ${i === 0 ? 'bg-emerald-600' : 'bg-emerald-600/40'}`}
                      style={{ width: `${Math.max(pct, 2)}%` }}
                    />
                  </div>
                  <span className="w-28 text-right text-sm tabular-nums text-foreground">
                    +{client.margin.toLocaleString('ru-RU')} ₽ <span className="text-muted-foreground">({client.pct}%)</span>
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Worst by margin */}
      {hasCostSettings && worstByMargin.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Худшие 5 по марже</h2>
          <div className="space-y-2">
            {worstByMargin.map((client, i) => {
              const worstMargin = worstByMargin[worstByMargin.length - 1]?.margin ?? -1
              const absRange = Math.max(Math.abs(worstMargin), 1)
              const barPct = (Math.abs(client.margin) / absRange) * 100
              return (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-44 truncate text-sm text-muted-foreground" title={client.name}>
                    {client.name}
                  </span>
                  <div className="flex-1">
                    <div
                      className={cn('h-6 rounded', client.margin < 0 ? 'bg-red-600/60' : 'bg-amber-600/40')}
                      style={{ width: `${Math.max(barPct, 2)}%` }}
                    />
                  </div>
                  <span className={cn('w-28 text-right text-sm tabular-nums', client.margin < 0 ? 'text-red-400' : 'text-foreground')}>
                    {client.margin > 0 ? '+' : ''}{client.margin.toLocaleString('ru-RU')} ₽ <span className="text-muted-foreground">({client.pct}%)</span>
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Frequency distribution */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Распределение по частоте</h2>
        <div className="flex gap-3">
          {[1, 2, 3, 4, 5].map((freq) => {
            const count = frequencyDist[freq] ?? 0
            return (
              <div
                key={freq}
                className="flex-1 rounded-lg border border-border bg-card p-4 text-center"
              >
                <div className="text-2xl font-bold tabular-nums text-foreground">
                  {count}
                </div>
                <div className="text-sm text-muted-foreground">
                  {freq}x/нед
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
