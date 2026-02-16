import { useMemo } from 'react'
import { useInventoryStore } from '../store'
import type { MatBatch } from '../types'

export interface BatchWearInfo {
  id: string
  purchasedAt: string
  quantity: number
  remaining: number
  washCycles: number
  maxWashCycles: number
  wearPercent: number
}

export interface SizeInventorySummary {
  sizeId: string
  totalOwned: number
  atClients: number
  inLaundry: number
  damaged: number
  inStock: number
  washCycles: number
  maxWashCycles: number
  worstBatch: BatchWearInfo | null
  batches: BatchWearInfo[]
}

interface UseInventorySummaryParams {
  clientMatTotals: Map<string, number>
}

function toBatchWearInfo(b: MatBatch): BatchWearInfo {
  return {
    id: b.id,
    purchasedAt: b.purchasedAt,
    quantity: b.quantity,
    remaining: b.remaining,
    washCycles: b.washCycles,
    maxWashCycles: b.maxWashCycles,
    wearPercent: b.maxWashCycles > 0 ? (b.washCycles / b.maxWashCycles) * 100 : 0,
  }
}

export function useInventorySummary({ clientMatTotals }: UseInventorySummaryParams): SizeInventorySummary[] {
  const inventory = useInventoryStore((s) => s.inventory)
  const batches = useInventoryStore((s) => s.batches)

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

      const washCycles = inv?.washCycles ?? 0
      const maxWashCycles = inv?.maxWashCycles ?? 300

      const sizeBatches = batches
        .filter((b) => b.sizeId === sizeId && b.remaining > 0)
        .sort((a, b) => a.purchasedAt.localeCompare(b.purchasedAt))
        .map(toBatchWearInfo)

      const worstBatch = sizeBatches.length > 0
        ? sizeBatches.reduce((worst, b) => b.wearPercent > worst.wearPercent ? b : worst)
        : null

      return { sizeId, totalOwned, atClients, inLaundry, damaged, inStock, washCycles, maxWashCycles, worstBatch, batches: sizeBatches }
    })
  }, [inventory, batches, clientMatTotals])
}
