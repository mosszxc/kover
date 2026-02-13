import { useEffect, useRef } from 'react'
import { useRouteStore } from '@/modules/routes'
import { useClientStore } from '@/modules/clients'
import { useChangeLogStore } from '@/shared/stores/changelogStore'
import type { DayRoute } from '@/modules/routes'
import type { Client } from '@/modules/clients'

const DAY_NAMES = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт']

function diffRoutes(prev: DayRoute[], next: DayRoute[], clients: Client[]) {
  const clientMap = new Map(clients.map((c) => [c.id, c]))
  const changes: { action: string; description: string }[] = []

  for (const nextRoute of next) {
    const prevRoute = prev.find((r) => r.day === nextRoute.day)
    if (!prevRoute) continue

    const prevIds = new Set(prevRoute.stops.map((s) => s.id))
    const nextIds = new Set(nextRoute.stops.map((s) => s.id))
    const dayName = DAY_NAMES[nextRoute.day] ?? '?'

    for (const stop of nextRoute.stops) {
      if (!prevIds.has(stop.id)) {
        const name = clientMap.get(stop.clientId)?.name ?? 'Клиент'
        changes.push({ action: 'add_stop', description: `${dayName}: добавлен ${name}` })
      }
    }

    for (const stop of prevRoute.stops) {
      if (!nextIds.has(stop.id)) {
        const name = clientMap.get(stop.clientId)?.name ?? 'Клиент'
        changes.push({ action: 'remove_stop', description: `${dayName}: удалён ${name}` })
      }
    }

    if (
      prevIds.size === nextIds.size &&
      prevRoute.stops.length === nextRoute.stops.length &&
      prevRoute.stops.some((s, i) => nextRoute.stops[i]?.id !== s.id)
    ) {
      changes.push({ action: 'reorder', description: `${dayName}: изменён порядок маршрута` })
    }
  }

  return changes
}

function diffClients(prev: Client[], next: Client[]) {
  const prevMap = new Map(prev.map((c) => [c.id, c]))
  const nextMap = new Map(next.map((c) => [c.id, c]))
  const changes: { action: string; description: string }[] = []

  for (const c of next) {
    if (!prevMap.has(c.id)) {
      changes.push({ action: 'add_client', description: `Добавлен клиент: ${c.name}` })
    }
  }

  for (const c of prev) {
    if (!nextMap.has(c.id)) {
      changes.push({ action: 'delete_client', description: `Удалён клиент: ${c.name}` })
    }
  }

  for (const c of next) {
    const old = prevMap.get(c.id)
    if (!old) continue
    if (old.isActive !== c.isActive) {
      changes.push({
        action: 'toggle_active',
        description: c.isActive ? `Активирован: ${c.name}` : `На паузе: ${c.name}`,
      })
    }
  }

  return changes
}

export function useChangeLogger() {
  const addEntry = useChangeLogStore((s) => s.addEntry)
  const prevRoutesRef = useRef<DayRoute[] | null>(null)
  const prevClientsRef = useRef<Client[] | null>(null)

  useEffect(() => {
    // Initialize refs with current state
    prevRoutesRef.current = useRouteStore.getState().routes
    prevClientsRef.current = useClientStore.getState().clients

    const unsubRoutes = useRouteStore.subscribe((state) => {
      const prev = prevRoutesRef.current
      prevRoutesRef.current = state.routes
      if (!prev || prev === state.routes) return

      const clients = useClientStore.getState().clients
      const changes = diffRoutes(prev, state.routes, clients)
      for (const change of changes) {
        addEntry({ type: 'route', ...change })
      }
    })

    const unsubClients = useClientStore.subscribe((state) => {
      const prev = prevClientsRef.current
      prevClientsRef.current = state.clients
      if (!prev || prev === state.clients) return

      const changes = diffClients(prev, state.clients)
      for (const change of changes) {
        addEntry({ type: 'client', ...change })
      }
    })

    return () => {
      unsubRoutes()
      unsubClients()
    }
  }, [addEntry])
}
