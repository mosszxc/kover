import { Navigate, Outlet } from 'react-router'
import { useAuthStore, isAuthRequired } from '@/shared/lib/auth'
import { LoadingFallback } from '@/shared/components/LoadingFallback'

export function PublicGuard() {
  const user = useAuthStore((s) => s.user)
  const loading = useAuthStore((s) => s.loading)

  if (!isAuthRequired()) {
    return <Navigate to="/" replace />
  }

  if (loading) {
    return <LoadingFallback />
  }

  if (user) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
