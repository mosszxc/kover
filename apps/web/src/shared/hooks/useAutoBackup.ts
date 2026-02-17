import { useEffect } from 'react'
import { useClientStore } from '@/modules/clients'
import { saveBackup } from '@/shared/lib/backup'
import { collectStores } from '@/shared/lib/backupStores'

const BACKUP_INTERVAL = 30 * 60 * 1000 // 30 minutes

export function useAutoBackup() {
  useEffect(() => {
    const interval = setInterval(() => {
      const clients = useClientStore.getState().clients
      if (clients.length > 0) {
        const stores = collectStores()
        saveBackup(stores)
      }
    }, BACKUP_INTERVAL)

    return () => clearInterval(interval)
  }, [])
}
