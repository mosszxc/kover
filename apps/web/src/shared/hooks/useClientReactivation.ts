import { useEffect } from 'react'
import { useClientStore } from '@/modules/clients'
import { useRouteStore } from '@/modules/routes'
import { useServiceLogStore } from '@/shared/stores/serviceLogStore'
import { generateId } from '@/shared/lib/generateId'
import { toast } from 'sonner'

/**
 * Авто-реактивация клиентов с истёкшей паузой.
 * Запускается на маунте AppLayout — работает при открытии любой страницы.
 */
export function useClientReactivation() {
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10)
    const clients = useClientStore.getState().clients
    const updateClient = useClientStore.getState().updateClient
    const addStop = useRouteStore.getState().addStop
    const addEntry = useServiceLogStore.getState().addEntry

    const expired = clients.filter(
      (c) => c.pausedUntil && c.pausedUntil <= today && !c.isActive,
    )

    if (expired.length === 0) return

    const reactivatedNames: string[] = []

    for (const client of expired) {
      updateClient(client.id, { isActive: true, pausedUntil: null })

      for (const day of client.days) {
        addEntry({ clientId: client.id, day, type: 'unpaused' })
      }

      for (const day of client.days) {
        const currentRoutes = useRouteStore.getState().routes
        const route = currentRoutes.find((r) => r.day === day)
        const alreadyInRoute = route?.stops.some((s) => s.clientId === client.id)
        if (!alreadyInRoute) {
          addStop(day, {
            id: generateId(),
            clientId: client.id,
            position: route?.stops.length ?? 0,
            isCompleted: false,
          })
        }
      }

      reactivatedNames.push(client.name)
    }

    if (reactivatedNames.length === 1) {
      toast.info(`Вернулся с паузы: ${reactivatedNames[0]}`, { duration: 6000 })
    } else {
      toast.info(
        `Вернулись с паузы: ${reactivatedNames.join(', ')}`,
        { duration: 8000 },
      )
    }
  }, [])
}
