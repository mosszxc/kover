import { useEffect } from 'react'
import { registerAllSyncs, initSync, destroySync } from '@/shared/lib/sync'
import { useAuth } from '@/modules/auth'

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()

  useEffect(() => {
    if (!isAuthenticated) return

    registerAllSyncs()
    initSync()

    return () => {
      destroySync()
    }
  }, [isAuthenticated])

  return <>{children}</>
}
