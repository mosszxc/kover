import { useEffect } from 'react'
import { registerAllSyncs, initSync, destroySync } from '@/shared/lib/sync'

export function SyncProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    registerAllSyncs()
    initSync()

    return () => {
      destroySync()
    }
  }, [])

  return <>{children}</>
}
