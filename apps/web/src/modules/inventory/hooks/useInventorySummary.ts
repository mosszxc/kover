import { useMemo } from 'react'
import { useInventoryStore } from '../store'

export interface SizeInventorySummary {
  sizeId: string
  totalOwned: number
  atClients: number
  inLaundry: number
  damaged: number
  inStock: number
}

interface UseInventorySummaryParams {
  clientMatTotals: Map<string, number>
}

export function useInventorySummary({ clientMatTotals }: UseInventorySummaryParams): SizeInventorySummary[] {
  const inventory = useInventoryStore((s) => s.inventory)

  return useMemo(() => {
    const allSizeIds = new Set<string>()
    for (const item of inventory) allSizeIds.add(item.sizeId)
    for (const sizeId of clientMatTotals.keys()) allSizeIds.add(sizeId)

    return Array.from(allSizeIds).map((sizeId) => {
      const inv = inventory.find((i) => i.sizeId === sizeId)
      const totalOwned = inv?.totalOwned ?? 0
      const atClients = clientMatTotals.get(sizeId) ?? 0
      const inLaundry = inv?.inLaundry ?? 0
      const damaged = inv?.damaged ?? 0
      const inStock = totalOwned - atClients - inLaundry

      return { sizeId, totalOwned, atClients, inLaundry, damaged, inStock }
    })
  }, [inventory, clientMatTotals])
}
