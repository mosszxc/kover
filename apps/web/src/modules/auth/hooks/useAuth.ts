import { useSyncExternalStore, useCallback } from 'react'
import { pb } from '@/shared/lib/pocketbase'

function subscribe(callback: () => void) {
  return pb.authStore.onChange(callback)
}

function getSnapshot() {
  return pb.authStore.isValid
}

export function useAuth() {
  const isAuthenticated = useSyncExternalStore(subscribe, getSnapshot)

  const login = useCallback(async (email: string, password: string) => {
    await pb.collection('users').authWithPassword(email, password)
  }, [])

  const logout = useCallback(() => {
    pb.authStore.clear()
  }, [])

  return { isAuthenticated, login, logout }
}
