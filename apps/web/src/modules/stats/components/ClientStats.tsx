import { useMemo } from 'react'
import { useClientStore } from '@/modules/clients'
import { useMatSizeStore } from '@/shared/stores/matSizeStore'

export function ClientStats() {
  const clients = useClientStore((s) => s.clients)
  const sizes = useMatSizeStore((s) => s.sizes)

  const { topClients, frequencyDist } = useMemo(() => {
    const areaMap = Object.fromEntries(sizes.map((s) => [s.id, s.area]))
    const getClientArea = (mats: { size: string; quantity: number }[]) =>
      mats.reduce((sum, m) => sum + m.quantity * (areaMap[m.size] ?? 0), 0)

    const active = clients.filter((c) => c.isActive)

    const sorted = active
      .map((c) => ({ name: c.name || c.originalName, area: getClientArea(c.mats) }))
      .sort((a, b) => b.area - a.area)
      .slice(0, 10)

    const freq: Record<number, number> = {}
    for (const c of active) {
      freq[c.frequency] = (freq[c.frequency] ?? 0) + 1
    }

    return { topClients: sorted, frequencyDist: freq }
  }, [clients, sizes])

  const maxArea = topClients[0]?.area ?? 1

  return (
    <div className="space-y-6">
      {/* Top clients by area */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-50">Топ-10 клиентов по метражу</h2>
        <div className="space-y-2">
          {topClients.map((client, i) => {
            const pct = (client.area / maxArea) * 100
            return (
              <div key={i} className="flex items-center gap-3">
                <span className="w-44 truncate text-sm text-slate-400" title={client.name}>
                  {client.name}
                </span>
                <div className="flex-1">
                  <div
                    className={`h-6 rounded ${i === 0 ? 'bg-blue-600' : 'bg-slate-700'}`}
                    style={{ width: `${Math.max(pct, 2)}%` }}
                  />
                </div>
                <span className="w-16 text-right text-sm tabular-nums text-slate-50">
                  {client.area.toFixed(1)}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Frequency distribution */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-50">Распределение по частоте</h2>
        <div className="flex gap-3">
          {[1, 2, 3, 4, 5].map((freq) => {
            const count = frequencyDist[freq] ?? 0
            return (
              <div
                key={freq}
                className="flex-1 rounded-lg border border-slate-700 bg-slate-900 p-4 text-center"
              >
                <div className="text-2xl font-bold tabular-nums text-slate-50">
                  {count}
                </div>
                <div className="text-sm text-slate-400">
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
