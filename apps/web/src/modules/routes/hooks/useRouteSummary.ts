import { useMemo } from 'react'
import { useRouteStore } from '../store'
import { useClientStore } from '@/modules/clients'
import type { MatSize } from '@/shared/types'
import { MAT_AREA } from '@/shared/types'

export interface BlockSummary {
  blockId: string
  blockName?: string
  stopCount: number
  matsBySize: Partial<Record<MatSize, number>>
  totalArea: number
}

export interface RouteSummary {
  stopCount: number
  matsBySize: Partial<Record<MatSize, number>>
  totalArea: number
  blocks: BlockSummary[]
  hasMultipleBlocks: boolean
}

export function useRouteSummary(): RouteSummary {
  const selectedDay = useRouteStore((s) => s.selectedDay)
  const routes = useRouteStore((s) => s.routes)
  const clients = useClientStore((s) => s.clients)

  return useMemo(() => {
    const dayRoute = routes.find((r) => r.day === selectedDay)
    if (!dayRoute) {
      return { stopCount: 0, matsBySize: {}, totalArea: 0, blocks: [], hasMultipleBlocks: false }
    }

    const clientMap = new Map(clients.map((c) => [c.id, c]))

    const blocks: BlockSummary[] = dayRoute.blocks.map((block) => {
      const matsBySize: Partial<Record<MatSize, number>> = {}
      let totalArea = 0

      for (const stop of block.stops) {
        const client = clientMap.get(stop.clientId)
        if (!client) continue

        for (const mat of client.mats) {
          matsBySize[mat.size] = (matsBySize[mat.size] ?? 0) + mat.quantity
          totalArea += mat.quantity * (MAT_AREA[mat.size] ?? 0)
        }
      }

      return {
        blockId: block.id,
        blockName: block.name,
        stopCount: block.stops.length,
        matsBySize,
        totalArea,
      }
    })

    const matsBySize: Partial<Record<MatSize, number>> = {}
    let totalArea = 0
    let stopCount = 0

    for (const block of blocks) {
      stopCount += block.stopCount
      totalArea += block.totalArea
      for (const [size, qty] of Object.entries(block.matsBySize)) {
        const s = size as MatSize
        matsBySize[s] = (matsBySize[s] ?? 0) + (qty ?? 0)
      }
    }

    return {
      stopCount,
      matsBySize,
      totalArea: Math.round(totalArea * 100) / 100,
      blocks,
      hasMultipleBlocks: blocks.length > 1,
    }
  }, [selectedDay, routes, clients])
}
