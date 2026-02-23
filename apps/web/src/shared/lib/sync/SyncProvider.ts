import { useEffect, useRef } from 'react'
import { supabase, isSupabaseConfigured } from '@/shared/lib/supabase'
import { notify } from '@/shared/lib/notifications'
import { useSyncStore, setHydrating } from './syncStore'
import { fetchAll, subscribeToTable } from './engine'
import {
  matSizesAdapter,
  driversAdapter,
  clientsAdapter,
  changelogAdapter,
  serviceLogAdapter,
  paymentsAdapter,
  routeExceptionsAdapter,
  serviceReportsAdapter,
  debtContactsAdapter,
  matInventoryAdapter,
  matBatchesAdapter,
  inventoryTransactionsAdapter,
  routeStopToLocal,
} from './adapters'
import seedClientsData from '@/shared/data/seed-clients.json'
import seedRoutesData from '@/shared/data/seed-routes.json'
import { getUnsyncedIds } from './syncQueue'
import { useMatSizeStore } from '@/shared/stores/matSizeStore'
import { useDriverStore } from '@/modules/drivers'
import { useClientStore } from '@/modules/clients'
import { useRouteStore } from '@/modules/routes'
import { useChangeLogStore } from '@/shared/stores/changelogStore'
import { useServiceLogStore } from '@/shared/stores/serviceLogStore'
import { useSettingsStore } from '@/shared/stores/settingsStore'
import { usePaymentStore } from '@/modules/payments/store'
import { useRouteExceptionsStore } from '@/shared/stores/routeExceptionsStore'
import { useServiceReportStore } from '@/shared/stores/serviceReportStore'
import { useDebtContactStore } from '@/modules/payments/debtContactStore'
import { useInventoryStore } from '@/modules/inventory/store'
import { useCostSettingsStore } from '@/shared/stores/costSettingsStore'
import { useInvoiceSettingsStore } from '@/shared/stores/invoiceSettingsStore'
import { useRouteSettingsStore } from '@/shared/stores/routeSettingsStore'
import { usePrintSettingsStore } from '@/modules/print/store'
import { useWhatsNewStore } from '@/modules/whats-new/store'
import { useChurnDismissStore } from '@/shared/stores/churnDismissStore'
import type { ChurnDismiss } from '@/shared/stores/churnDismissStore'
import type { MatSizeConfig, DayOfWeek } from '@/shared/types'
import type { Client } from '@/modules/clients/types'
import type { Driver } from '@/modules/drivers/types'
import type { DayRoute } from '@/modules/routes/types'
import type { ChangeLogEntry } from '@/shared/stores/changelogStore'
import type { ServiceLogEntry } from '@/shared/stores/serviceLogStore'
import type { Payment } from '@/modules/payments/types'
import type { RouteException } from '@/shared/stores/routeExceptionsStore'
import type { ServiceReport } from '@/shared/stores/serviceReportStore'
import type { DebtContact } from '@/modules/payments/debtContactStore'
import type { MatInventory, MatBatch, InventoryTransaction } from '@/modules/inventory/types'
import type { Database } from '@/shared/types/database'
import type { CostSettings } from '@/shared/stores/costSettingsStore'
import type { InvoiceSettings } from '@/shared/stores/invoiceSettingsStore'
import type { PrintColumnConfig } from '@/modules/print/store'

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

    // One-time cleanup: remove ALL stale localStorage keys
    const deprecatedKeys = [
      'kover-clients',
      'kover-routes',
      'kover-drivers',
      'kover-mat-sizes',
      'kover-changelog',
      'kover-service-log',
      'kover-seed',
      'kover-payments',
      'kover-inventory',
      'kover-route-exceptions',
      'kover-service-reports',
      'kover-debt-contacts',
      'kover-settings',
      'kover-cost-settings',
      'kover-invoice-settings',
      'kover-route-settings',
      'kover-print',
      'kover-whats-new',
      'kover-churn-dismiss',
    ]
    for (const key of deprecatedKeys) {
      localStorage.removeItem(key)
    }

    async function hydrate() {
      setStatus('syncing')
      setHydrating(true)
      try {
        // Hydrate all stores in parallel
        const [
          matSizes, drivers, clients, changelog, serviceLog,
          payments, routeExceptions, serviceReports, debtContacts,
          matInventory, matBatches, inventoryTransactions,
        ] = await Promise.all([
          fetchAll(matSizesAdapter),
          fetchAll(driversAdapter),
          fetchAll(clientsAdapter),
          fetchAll(changelogAdapter),
          fetchAll(serviceLogAdapter),
          fetchAll(paymentsAdapter),
          fetchAll(routeExceptionsAdapter),
          fetchAll(serviceReportsAdapter),
          fetchAll(debtContactsAdapter),
          fetchAll(matInventoryAdapter),
          fetchAll(matBatchesAdapter),
          fetchAll(inventoryTransactionsAdapter),
        ])

        // First launch: if Supabase has no clients, load seed data.
        if (clients !== null && clients.length === 0) {
          useClientStore.getState().seedClients(seedClientsData as Client[])
          useRouteStore.getState().seedRoutes(seedRoutesData as DayRoute[])
        }

        // Hydrate with per-record merge — protect unsynced local records
        if (matSizes && matSizes.length > 0) {
          useMatSizeStore.setState({
            sizes: mergeById(
              useMatSizeStore.getState().sizes,
              matSizes as MatSizeConfig[],
              getUnsyncedIds('mat_sizes'),
            ),
          })
        }
        if (drivers && drivers.length > 0) {
          useDriverStore.setState({
            drivers: mergeById(
              useDriverStore.getState().drivers,
              drivers as Driver[],
              getUnsyncedIds('drivers'),
            ),
          })
        }
        if (clients && clients.length > 0) {
          useClientStore.setState({
            clients: mergeById(
              useClientStore.getState().clients,
              clients as Client[],
              getUnsyncedIds('clients'),
            ),
          })
        }
        if (changelog && changelog.length > 0) {
          useChangeLogStore.setState({
            entries: mergeById(
              useChangeLogStore.getState().entries,
              changelog as ChangeLogEntry[],
              getUnsyncedIds('changelog'),
            ),
          })
        }
        if (serviceLog && serviceLog.length > 0) {
          useServiceLogStore.setState({
            entries: mergeById(
              useServiceLogStore.getState().entries,
              serviceLog as ServiceLogEntry[],
              getUnsyncedIds('service_log'),
            ),
          })
        }

        // Hydrate new stores
        if (payments && payments.length > 0) {
          usePaymentStore.setState({
            payments: mergeById(
              usePaymentStore.getState().payments,
              payments as Payment[],
              getUnsyncedIds('payments'),
            ),
          })
        }
        if (routeExceptions && routeExceptions.length > 0) {
          useRouteExceptionsStore.setState({
            exceptions: mergeById(
              useRouteExceptionsStore.getState().exceptions,
              routeExceptions as RouteException[],
              getUnsyncedIds('route_exceptions'),
            ),
          })
        }
        if (serviceReports && serviceReports.length > 0) {
          useServiceReportStore.setState({
            reports: mergeById(
              useServiceReportStore.getState().reports,
              serviceReports as ServiceReport[],
              getUnsyncedIds('service_reports'),
            ),
          })
        }
        if (debtContacts && debtContacts.length > 0) {
          useDebtContactStore.setState({
            contacts: mergeById(
              useDebtContactStore.getState().contacts,
              debtContacts as DebtContact[],
              getUnsyncedIds('debt_contacts'),
            ),
          })
        }

        // Inventory — merge by sizeId for mat_inventory, by id for batches/transactions
        if (matInventory && matInventory.length > 0) {
          useInventoryStore.setState({
            inventory: mergeBySizeId(
              useInventoryStore.getState().inventory,
              matInventory as MatInventory[],
            ),
          })
        }
        if (matBatches && matBatches.length > 0) {
          useInventoryStore.setState({
            batches: mergeById(
              useInventoryStore.getState().batches,
              matBatches as MatBatch[],
              getUnsyncedIds('mat_batches'),
            ),
          })
        }
        if (inventoryTransactions && inventoryTransactions.length > 0) {
          useInventoryStore.setState({
            transactions: mergeById(
              useInventoryStore.getState().transactions,
              inventoryTransactions as InventoryTransaction[],
              getUnsyncedIds('inventory_transactions'),
            ),
          })
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
      } finally {
        setHydrating(false)
      }
    }

    hydrate()

    // Online/offline detection
    const handleOnline = () => {
      if (useSyncStore.getState().status === 'offline') {
        setStatus('idle')
        notify({
          title: 'Kover',
          body: 'Соединение восстановлено, данные синхронизируются',
        })
        // Re-hydrate on reconnect
        hydrate()
      }
    }
    const handleOffline = () => {
      setStatus('offline')
      notify({
        title: 'Kover — Нет соединения',
        body: 'Работа продолжается в автономном режиме',
      })
    }

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

  // Main settings store
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
  if (settingsMap.has('notificationsEnabled')) {
    updates.notificationsEnabled = settingsMap.get('notificationsEnabled') as boolean
  }
  if (settingsMap.has('theme')) {
    const theme = settingsMap.get('theme') as string
    updates.theme = theme
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }
  if (settingsMap.has('autostartEnabled')) {
    updates.autostartEnabled = settingsMap.get('autostartEnabled') as boolean
  }
  if (settingsMap.has('startMinimized')) {
    updates.startMinimized = settingsMap.get('startMinimized') as boolean
  }

  if (Object.keys(updates).length > 0) {
    useSettingsStore.setState(updates)
  }

  // Cost settings
  if (settingsMap.has('costSettings')) {
    const cost = settingsMap.get('costSettings') as Partial<CostSettings>
    if (cost) useCostSettingsStore.setState(cost)
  }

  // Invoice settings
  if (settingsMap.has('invoiceSettings')) {
    const invoice = settingsMap.get('invoiceSettings') as Partial<InvoiceSettings>
    if (invoice) useInvoiceSettingsStore.setState(invoice)
  }

  // Route settings
  if (settingsMap.has('maxStopsPerDay')) {
    useRouteSettingsStore.setState({ maxStopsPerDay: settingsMap.get('maxStopsPerDay') as number })
  }

  // Print settings
  if (settingsMap.has('printSettings')) {
    const print = settingsMap.get('printSettings') as unknown as PrintColumnConfig
    if (print) usePrintSettingsStore.setState({ columns: print })
  }

  // What's new
  if (settingsMap.has('lastSeenVersion')) {
    useWhatsNewStore.setState({ lastSeenVersion: settingsMap.get('lastSeenVersion') as string })
  }

  // Churn dismissals
  if (settingsMap.has('churnDismissals')) {
    const dismissals = settingsMap.get('churnDismissals') as unknown as ChurnDismiss[]
    if (dismissals) useChurnDismissStore.setState({ dismissals })
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

  // Changelog
  const unsubChangelog = subscribeToTable(
    changelogAdapter,
    (item) => {
      useChangeLogStore.setState((state) => {
        const entry = item as ChangeLogEntry
        const exists = state.entries.some((e) => e.id === entry.id)
        return {
          entries: exists
            ? state.entries.map((e) => (e.id === entry.id ? entry : e))
            : [...state.entries, entry].slice(-200),
        }
      })
    },
    (id) => {
      useChangeLogStore.setState((state) => ({
        entries: state.entries.filter((e) => e.id !== id),
      }))
    },
  )
  if (unsubChangelog) cleanups.push(unsubChangelog)

  // Service Log
  const unsubServiceLog = subscribeToTable(
    serviceLogAdapter,
    (item) => {
      useServiceLogStore.setState((state) => {
        const entry = item as ServiceLogEntry
        const exists = state.entries.some((e) => e.id === entry.id)
        return {
          entries: exists
            ? state.entries.map((e) => (e.id === entry.id ? entry : e))
            : [...state.entries, entry],
        }
      })
    },
    (id) => {
      useServiceLogStore.setState((state) => ({
        entries: state.entries.filter((e) => e.id !== id),
      }))
    },
  )
  if (unsubServiceLog) cleanups.push(unsubServiceLog)

  // Payments
  const unsubPayments = subscribeToTable(
    paymentsAdapter,
    (item) => {
      const payment = item as Payment
      usePaymentStore.setState((state) => {
        const exists = state.payments.some((p) => p.id === payment.id)
        return {
          payments: exists
            ? state.payments.map((p) => (p.id === payment.id ? payment : p))
            : [...state.payments, payment],
        }
      })
    },
    (id) => {
      usePaymentStore.setState((state) => ({
        payments: state.payments.filter((p) => p.id !== id),
      }))
    },
  )
  if (unsubPayments) cleanups.push(unsubPayments)

  // Route Exceptions
  const unsubExceptions = subscribeToTable(
    routeExceptionsAdapter,
    (item) => {
      const exception = item as RouteException
      useRouteExceptionsStore.setState((state) => {
        const exists = state.exceptions.some((e) => e.id === exception.id)
        return {
          exceptions: exists
            ? state.exceptions.map((e) => (e.id === exception.id ? exception : e))
            : [...state.exceptions, exception],
        }
      })
    },
    (id) => {
      useRouteExceptionsStore.setState((state) => ({
        exceptions: state.exceptions.filter((e) => e.id !== id),
      }))
    },
  )
  if (unsubExceptions) cleanups.push(unsubExceptions)

  // Service Reports
  const unsubReports = subscribeToTable(
    serviceReportsAdapter,
    (item) => {
      const report = item as ServiceReport
      useServiceReportStore.setState((state) => {
        const exists = state.reports.some((r) => r.id === report.id)
        return {
          reports: exists
            ? state.reports.map((r) => (r.id === report.id ? report : r))
            : [...state.reports, report],
        }
      })
    },
    (id) => {
      useServiceReportStore.setState((state) => ({
        reports: state.reports.filter((r) => r.id !== id),
      }))
    },
  )
  if (unsubReports) cleanups.push(unsubReports)

  // Debt Contacts
  const unsubDebtContacts = subscribeToTable(
    debtContactsAdapter,
    (item) => {
      const contact = item as DebtContact
      useDebtContactStore.setState((state) => {
        const exists = state.contacts.some((c) => c.id === contact.id)
        return {
          contacts: exists
            ? state.contacts.map((c) => (c.id === contact.id ? contact : c))
            : [...state.contacts, contact],
        }
      })
    },
    (id) => {
      useDebtContactStore.setState((state) => ({
        contacts: state.contacts.filter((c) => c.id !== id),
      }))
    },
  )
  if (unsubDebtContacts) cleanups.push(unsubDebtContacts)

  // Inventory — re-hydrate on any change (like routes)
  const unsubInventory = subscribeToInventory()
  if (unsubInventory) cleanups.push(unsubInventory)

  // Route Stops — re-hydrate full route structure on any change
  const unsubRouteStops = subscribeToRouteStops()
  if (unsubRouteStops) cleanups.push(unsubRouteStops)

  // Settings — key/value table
  const unsubSettings = subscribeToSettings()
  if (unsubSettings) cleanups.push(unsubSettings)

  return cleanups
}

/**
 * Подписка на inventory tables.
 * При изменении — debounce + полная перезагрузка.
 */
function subscribeToInventory(): (() => void) | null {
  if (!supabase) return null

  let debounceTimer: ReturnType<typeof setTimeout> | null = null

  const rehydrate = () => {
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(async () => {
      const [inv, batches, txs] = await Promise.all([
        fetchAll(matInventoryAdapter),
        fetchAll(matBatchesAdapter),
        fetchAll(inventoryTransactionsAdapter),
      ])
      setHydrating(true)
      if (inv && inv.length > 0) {
        useInventoryStore.setState({ inventory: inv as MatInventory[] })
      }
      if (batches && batches.length > 0) {
        useInventoryStore.setState({ batches: batches as MatBatch[] })
      }
      if (txs && txs.length > 0) {
        useInventoryStore.setState({ transactions: txs as InventoryTransaction[] })
      }
      setHydrating(false)
    }, 500)
  }

  const tables = ['mat_inventory', 'mat_batches', 'inventory_transactions'] as const

  const channels = tables.map((table) =>
    supabase!
      .channel(`realtime-${table}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        rehydrate,
      )
      .subscribe(),
  )

  return () => {
    if (debounceTimer) clearTimeout(debounceTimer)
    channels.forEach((ch) => supabase!.removeChannel(ch))
  }
}

/**
 * Подписка на route_stops.
 * При любом изменении — debounce + полная перезагрузка маршрутов.
 */
function subscribeToRouteStops(): (() => void) | null {
  if (!supabase) return null

  let debounceTimer: ReturnType<typeof setTimeout> | null = null

  const channel = supabase
    .channel('realtime-route_stops')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'route_stops' },
      () => {
        if (debounceTimer) clearTimeout(debounceTimer)
        debounceTimer = setTimeout(() => {
          hydrateRoutes()
        }, 500)
      },
    )
    .subscribe()

  return () => {
    if (debounceTimer) clearTimeout(debounceTimer)
    supabase!.removeChannel(channel)
  }
}

/**
 * Подписка на settings (key/value).
 */
function subscribeToSettings(): (() => void) | null {
  if (!supabase) return null

  const channel = supabase
    .channel('realtime-settings')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'settings' },
      (payload) => applySettingChange(payload.new as Row<'settings'>),
    )
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'settings' },
      (payload) => applySettingChange(payload.new as Row<'settings'>),
    )
    .subscribe()

  return () => {
    supabase!.removeChannel(channel)
  }
}

function applySettingChange(row: Row<'settings'>) {
  const key = row.key
  const value = row.value

  // Main settings
  const settingsKeyMap: Record<string, string> = {
    geocodeCity: 'geocodeCity',
    showWeekends: 'showWeekends',
    fileSyncEnabled: 'fileSyncEnabled',
    fileSyncFileName: 'fileSyncFileName',
    notificationsEnabled: 'notificationsEnabled',
    autostartEnabled: 'autostartEnabled',
    startMinimized: 'startMinimized',
  }

  const storeKey = settingsKeyMap[key]
  if (storeKey) {
    useSettingsStore.setState({ [storeKey]: value })
    return
  }

  if (key === 'theme') {
    useSettingsStore.setState({ theme: value as 'light' | 'dark' })
    document.documentElement.classList.toggle('dark', value === 'dark')
    return
  }

  // Module settings
  if (key === 'costSettings' && value) {
    useCostSettingsStore.setState(value as Partial<CostSettings>)
    return
  }
  if (key === 'invoiceSettings' && value) {
    useInvoiceSettingsStore.setState(value as Partial<InvoiceSettings>)
    return
  }
  if (key === 'maxStopsPerDay') {
    useRouteSettingsStore.setState({ maxStopsPerDay: value as number })
    return
  }
  if (key === 'printSettings' && value) {
    usePrintSettingsStore.setState({ columns: value as unknown as PrintColumnConfig })
    return
  }
  if (key === 'lastSeenVersion') {
    useWhatsNewStore.setState({ lastSeenVersion: value as string })
    return
  }
  if (key === 'churnDismissals' && value) {
    useChurnDismissStore.setState({ dismissals: value as unknown as ChurnDismiss[] })
    return
  }
}

/**
 * Per-record merge: remote wins by default, but local records
 * that are in the unsynced set (failed to sync) are preserved.
 * Records only in local (not in remote) are also preserved.
 */
function mergeById<T extends { id: string }>(
  local: T[],
  remote: T[],
  unsynced: ReadonlySet<string>,
): T[] {
  const remoteMap = new Map(remote.map((r) => [r.id, r]))
  const resultMap = new Map<string, T>()

  // Start with all remote records
  for (const r of remote) {
    resultMap.set(r.id, r)
  }

  // Override with local records that are unsynced (protect pending changes)
  for (const l of local) {
    if (unsynced.has(l.id)) {
      resultMap.set(l.id, l)
    }
    // Keep local-only records (not yet in Supabase)
    if (!remoteMap.has(l.id)) {
      resultMap.set(l.id, l)
    }
  }

  return Array.from(resultMap.values())
}

/**
 * Merge mat inventory by sizeId (no id field).
 */
function mergeBySizeId(local: MatInventory[], remote: MatInventory[]): MatInventory[] {
  const remoteMap = new Map(remote.map((r) => [r.sizeId, r]))
  const resultMap = new Map<string, MatInventory>()

  for (const r of remote) {
    resultMap.set(r.sizeId, r)
  }

  for (const l of local) {
    if (!remoteMap.has(l.sizeId)) {
      resultMap.set(l.sizeId, l)
    }
  }

  return Array.from(resultMap.values())
}
