import { useEffect, useRef } from 'react'
import { supabase, isSupabaseConfigured } from '@/shared/lib/supabase'
import { useSyncStore } from './syncStore'
import { fetchAll, subscribeToTable } from './engine'
import {
  matSizesAdapter,
  driversAdapter,
  clientsAdapter,
  changelogAdapter,
  serviceLogAdapter,
  routeStopToLocal,
} from './adapters'
import { useMatSizeStore } from '@/shared/stores/matSizeStore'
import { useDriverStore } from '@/modules/drivers'
import { useClientStore } from '@/modules/clients'
import { useRouteStore } from '@/modules/routes'
import { useChangeLogStore } from '@/shared/stores/changelogStore'
import { useServiceLogStore } from '@/shared/stores/serviceLogStore'
import { useSettingsStore } from '@/shared/stores/settingsStore'
import type { MatSizeConfig, DayOfWeek } from '@/shared/types'
import type { Client } from '@/modules/clients/types'
import type { Driver } from '@/modules/drivers/types'
import type { DayRoute } from '@/modules/routes/types'
import type { Database } from '@/shared/types/database'

type Row<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

/**
 * Хук для инициализации синхронизации с Supabase.
 * Загружает данные из Supabase при старте и подписывается на Realtime.
 */
export function useSyncProvider() {
  const initialized = useRef(false)
  const setStatus = useSyncStore((s) => s.setStatus)
  const setError = useSyncStore((s) => s.setError)
  const setSynced = useSyncStore((s) => s.setSynced)

  useEffect(() => {
    if (initialized.current) return
    if (!isSupabaseConfigured()) return
    initialized.current = true

    let cleanups: (() => void)[] = []

    async function hydrate() {
      setStatus('syncing')
      try {
        // Hydrate simple stores
        const [matSizes, drivers, clients, changelog, serviceLog] = await Promise.all([
          fetchAll(matSizesAdapter),
          fetchAll(driversAdapter),
          fetchAll(clientsAdapter),
          fetchAll(changelogAdapter),
          fetchAll(serviceLogAdapter),
        ])

        // Only hydrate if we got data back (Supabase has records)
        if (matSizes && matSizes.length > 0) {
          useMatSizeStore.setState({ sizes: matSizes as MatSizeConfig[] })
        }
        if (drivers && drivers.length > 0) {
          useDriverStore.setState({ drivers: drivers as Driver[] })
        }
        if (clients && clients.length > 0) {
          useClientStore.setState({ clients: clients as Client[] })
        }
        if (changelog && changelog.length > 0) {
          useChangeLogStore.setState({ entries: changelog })
        }
        if (serviceLog && serviceLog.length > 0) {
          useServiceLogStore.setState({ entries: serviceLog })
        }

        // Hydrate routes (normalized: day_routes + route_stops)
        await hydrateRoutes()

        // Hydrate settings (key/value format)
        await hydrateSettings()

        setSynced()

        // Subscribe to Realtime
        cleanups = setupRealtimeSubscriptions()
      } catch (e) {
        console.error('[sync] hydration error:', e)
        setError((e as Error).message)
      }
    }

    hydrate()

    // Online/offline detection
    const handleOnline = () => {
      if (useSyncStore.getState().status === 'offline') {
        setStatus('idle')
        // Re-hydrate on reconnect
        hydrate()
      }
    }
    const handleOffline = () => setStatus('offline')

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    if (!navigator.onLine) {
      setStatus('offline')
    }

    return () => {
      cleanups.forEach((fn) => fn())
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [setStatus, setError, setSynced])
}

async function hydrateRoutes() {
  if (!supabase) return

  const { data: dayRoutes, error: drError } = await supabase
    .from('day_routes')
    .select('id, day')

  if (drError || !dayRoutes || dayRoutes.length === 0) return

  const { data: stops, error: stError } = await supabase
    .from('route_stops')
    .select('*')
    .order('position', { ascending: true })

  if (stError) return

  const stopsByDayRoute = new Map<string, Row<'route_stops'>[]>()
  for (const stop of stops ?? []) {
    const arr = stopsByDayRoute.get(stop.day_route_id) ?? []
    arr.push(stop)
    stopsByDayRoute.set(stop.day_route_id, arr)
  }

  const routes: DayRoute[] = dayRoutes.map((dr) => ({
    day: dr.day as DayOfWeek,
    stops: (stopsByDayRoute.get(dr.id) ?? []).map(routeStopToLocal),
  }))

  // Ensure all 7 days exist
  const existingDays = new Set(routes.map((r) => r.day))
  for (let day = 0; day <= 6; day++) {
    if (!existingDays.has(day as DayOfWeek)) {
      routes.push({ day: day as DayOfWeek, stops: [] })
    }
  }

  routes.sort((a, b) => a.day - b.day)
  useRouteStore.setState({ routes })
}

async function hydrateSettings() {
  if (!supabase) return

  const { data, error } = await supabase
    .from('settings')
    .select('key, value')

  if (error || !data || data.length === 0) return

  const settingsMap = new Map(data.map((s) => [s.key, s.value]))

  const updates: Record<string, unknown> = {}
  if (settingsMap.has('geocodeCity')) {
    updates.geocodeCity = settingsMap.get('geocodeCity') as string
  }
  if (settingsMap.has('showWeekends')) {
    updates.showWeekends = settingsMap.get('showWeekends') as boolean
  }
  if (settingsMap.has('fileSyncEnabled')) {
    updates.fileSyncEnabled = settingsMap.get('fileSyncEnabled') as boolean
  }
  if (settingsMap.has('fileSyncFileName')) {
    updates.fileSyncFileName = settingsMap.get('fileSyncFileName') as string
  }

  if (Object.keys(updates).length > 0) {
    useSettingsStore.setState(updates)
  }
}

function setupRealtimeSubscriptions(): (() => void)[] {
  const cleanups: (() => void)[] = []

  // Mat sizes
  const unsubMats = subscribeToTable(
    matSizesAdapter,
    (item) => {
      const matSize = item as MatSizeConfig
      useMatSizeStore.setState((state) => {
        const exists = state.sizes.some((s) => s.id === matSize.id)
        return {
          sizes: exists
            ? state.sizes.map((s) => (s.id === matSize.id ? matSize : s))
            : [...state.sizes, matSize],
        }
      })
    },
    (id) => {
      useMatSizeStore.setState((state) => ({
        sizes: state.sizes.filter((s) => s.id !== id),
      }))
    },
  )
  if (unsubMats) cleanups.push(unsubMats)

  // Drivers
  const unsubDrivers = subscribeToTable(
    driversAdapter,
    (item) => {
      const driver = item as Driver
      useDriverStore.setState((state) => {
        const exists = state.drivers.some((d) => d.id === driver.id)
        return {
          drivers: exists
            ? state.drivers.map((d) => (d.id === driver.id ? driver : d))
            : [...state.drivers, driver],
        }
      })
    },
    (id) => {
      useDriverStore.setState((state) => ({
        drivers: state.drivers.filter((d) => d.id !== id),
      }))
    },
  )
  if (unsubDrivers) cleanups.push(unsubDrivers)

  // Clients
  const unsubClients = subscribeToTable(
    clientsAdapter,
    (item) => {
      const client = item as Client
      useClientStore.setState((state) => {
        const exists = state.clients.some((c) => c.id === client.id)
        return {
          clients: exists
            ? state.clients.map((c) => (c.id === client.id ? client : c))
            : [...state.clients, client],
        }
      })
    },
    (id) => {
      useClientStore.setState((state) => ({
        clients: state.clients.filter((c) => c.id !== id),
      }))
    },
  )
  if (unsubClients) cleanups.push(unsubClients)

  return cleanups
}
