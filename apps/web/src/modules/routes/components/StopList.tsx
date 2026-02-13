import { useMemo } from 'react'
import { useRouteStore } from '../store'
import { useClientStore } from '@/modules/clients'
import type { Client, MatSpec } from '@/modules/clients'
import { StopCard } from './StopCard'
import { BlockDivider } from './BlockDivider'

export function StopList() {
  const routes = useRouteStore((s) => s.routes)
  const selectedDay = useRouteStore((s) => s.selectedDay)
  const clients = useClientStore((s) => s.clients)

  const clientMap = useMemo(() => {
    const map = new Map<string, Client>()
    for (const c of clients) {
      map.set(c.id, c)
    }
    return map
  }, [clients])

  const dayRoute = routes.find((r) => r.day === selectedDay)

  if (!dayRoute || dayRoute.blocks.every((b) => b.stops.length === 0)) {
    return (
      <div className="py-12 text-center text-sm text-slate-500">
        Нет точек на этот день
      </div>
    )
  }

  let globalNumber = 0

  return (
    <div className="space-y-2">
      {dayRoute.blocks.map((block, blockIndex) => {
        if (block.stops.length === 0) return null

        const blockMats: MatSpec[] = []
        const blockStops = block.stops.map((stop) => {
          globalNumber++
          const client = clientMap.get(stop.clientId)
          if (client) {
            blockMats.push(...client.mats)
          }
          return { stop, client, number: globalNumber }
        })

        return (
          <div key={block.id} className="space-y-px">
            <BlockDivider
              name={block.name ?? `Блок ${blockIndex + 1}`}
              blockIndex={blockIndex}
              stopCount={block.stops.length}
              mats={blockMats}
            />
            {blockStops.map(({ stop, client, number }) => {
              if (!client) return null
              return (
                <StopCard
                  key={stop.id}
                  number={number}
                  client={client}
                  blockIndex={blockIndex}
                />
              )
            })}
          </div>
        )
      })}
    </div>
  )
}
