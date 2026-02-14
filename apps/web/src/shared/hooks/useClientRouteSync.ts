import { useEffect, useRef } from 'react'
import { useClientStore } from '@/modules/clients'
import { useRouteStore } from '@/modules/routes'
import type { Client } from '@/modules/clients'
import type { DayOfWeek } from '@/shared/types'
import { generateId } from '@/shared/lib/generateId'

/**
 * Синхронизирует маршруты при изменении клиентов:
 * - Изменение days[] → добавление/удаление stops
 * - Удаление клиента → удаление всех stops
 */
export function useClientRouteSync() {
  const prevClientsRef = useRef<Client[] | null>(null)

  useEffect(() => {
    prevClientsRef.current = useClientStore.getState().clients

    const unsub = useClientStore.subscribe((state) => {
      const prev = prevClientsRef.current
      prevClientsRef.current = state.clients
      if (!prev || prev === state.clients) return

      const prevMap = new Map(prev.map((c) => [c.id, c]))
      const nextMap = new Map(state.clients.map((c) => [c.id, c]))

      // Удалённые клиенты → удалить все stops
      for (const oldClient of prev) {
        if (!nextMap.has(oldClient.id)) {
          useRouteStore.getState().removeClientFromAllRoutes(oldClient.id)
        }
      }

      // Изменённые клиенты → синхронизировать days
      for (const nextClient of state.clients) {
        const prevClient = prevMap.get(nextClient.id)
        if (!prevClient) continue

        const prevDays = new Set(prevClient.days)
        const nextDays = new Set(nextClient.days)

        // Если days не изменились — пропускаем
        if (prevDays.size === nextDays.size && prevClient.days.every((d) => nextDays.has(d))) {
          continue
        }

        const routes = useRouteStore.getState().routes

        // Удалить stops из дней, которых больше нет
        for (const day of prevDays) {
          if (!nextDays.has(day)) {
            const route = routes.find((r) => r.day === day)
            const stop = route?.stops.find((s) => s.clientId === nextClient.id)
            if (stop) {
              useRouteStore.getState().removeStop(day, stop.id)
            }
          }
        }

        // Добавить stops в новые дни
        for (const day of nextDays) {
          if (!prevDays.has(day)) {
            const currentRoutes = useRouteStore.getState().routes
            const route = currentRoutes.find((r) => r.day === day)
            const alreadyExists = route?.stops.some((s) => s.clientId === nextClient.id)
            if (!alreadyExists) {
              useRouteStore.getState().addStop(day as DayOfWeek, {
                id: generateId(),
                clientId: nextClient.id,
                position: route?.stops.length ?? 0,
                isCompleted: false,
              })
            }
          }
        }
      }
    })

    return unsub
  }, [])
}
