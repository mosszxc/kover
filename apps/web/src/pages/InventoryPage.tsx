import { useMemo } from 'react'
import { InventoryDashboard, useInventorySummary } from '@/modules/inventory'
import { useClientStore } from '@/modules/clients'
import { useMatSizeStore } from '@/shared/stores/matSizeStore'

export function InventoryPage() {
  const clients = useClientStore((s) => s.clients)
  const sizes = useMatSizeStore((s) => s.sizes)

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

  const summary = useInventorySummary({ clientMatTotals })

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-foreground">Инвентарь</h1>
      <InventoryDashboard summary={summary} sizeLabels={sizeLabels} />
    </div>
  )
}
