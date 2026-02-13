import { useEffect } from 'react'
import { useRouteStore } from '@/modules/routes'
import { useClientStore } from '@/modules/clients'
import { saveBackup } from '@/shared/lib/backup'

const BACKUP_INTERVAL = 30 * 60 * 1000 // 30 minutes

export function useAutoBackup() {
  useEffect(() => {
    const interval = setInterval(() => {
      const clients = useClientStore.getState().clients
      const routes = useRouteStore.getState().routes
      if (clients.length > 0) {
        saveBackup(clients, routes)
      }
    }, BACKUP_INTERVAL)

    return () => clearInterval(interval)
  }, [])
}
