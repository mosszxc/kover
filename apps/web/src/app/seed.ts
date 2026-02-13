import seedClients from '@/shared/data/seed-clients.json'
import seedRoutes from '@/shared/data/seed-routes.json'
import { useClientStore } from '@/modules/clients'
import { useRouteStore } from '@/modules/routes'
import { useSeedStore } from '@/shared/lib/seed'
import type { Client } from '@/modules/clients'
import type { DayRoute } from '@/modules/routes'

export function seedIfNeeded(): void {
  const { isSeeded, markSeeded } = useSeedStore.getState()
  if (isSeeded) return

  useClientStore.getState().seedClients(seedClients as Client[])
  useRouteStore.getState().seedRoutes(seedRoutes as DayRoute[])
  markSeeded()
}
