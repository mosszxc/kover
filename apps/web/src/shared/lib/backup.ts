import { get, set, del, keys } from 'idb-keyval'

const BACKUP_PREFIX = 'kover-backup-'
const MAX_BACKUPS = 20

export interface BackupMeta {
  key: string
  timestamp: string
  clientCount: number
  routeStopCount: number
  driverCount: number
  paymentCount: number
  inventorySizeCount: number
  changelogCount: number
  serviceLogCount: number
  serviceReportCount: number
  routeExceptionCount: number
}

export interface BackupData {
  meta: BackupMeta
  clients: unknown
  routes: unknown
  drivers?: unknown
  payments?: unknown
  inventory?: unknown
  inventoryTransactions?: unknown
  matSizes?: unknown
  settings?: unknown
  costSettings?: unknown
  invoiceSettings?: unknown
  routeSettings?: unknown
  routeExceptions?: unknown
  changelog?: unknown
  serviceLog?: unknown
  serviceReports?: unknown
}

export async function saveBackup(stores: Omit<BackupData, 'meta'>): Promise<BackupMeta> {
  const timestamp = new Date().toISOString()
  const key = `${BACKUP_PREFIX}${timestamp}`

  const routes = stores.routes as { stops: unknown[] }[] | undefined
  const stopCount = (routes ?? []).reduce(
    (sum, r) => sum + (r.stops?.length ?? 0),
    0,
  )

  const meta: BackupMeta = {
    key,
    timestamp,
    clientCount: Array.isArray(stores.clients) ? stores.clients.length : 0,
    routeStopCount: stopCount,
    driverCount: Array.isArray(stores.drivers) ? stores.drivers.length : 0,
    paymentCount: Array.isArray(stores.payments) ? stores.payments.length : 0,
    inventorySizeCount: Array.isArray(stores.inventory) ? stores.inventory.length : 0,
    changelogCount: Array.isArray(stores.changelog) ? stores.changelog.length : 0,
    serviceLogCount: Array.isArray(stores.serviceLog) ? stores.serviceLog.length : 0,
    serviceReportCount: Array.isArray(stores.serviceReports) ? stores.serviceReports.length : 0,
    routeExceptionCount: Array.isArray(stores.routeExceptions) ? stores.routeExceptions.length : 0,
  }

  const data: BackupData = { meta, ...stores }
  await set(key, data)

  // Cleanup old backups
  const allKeys = (await keys()) as string[]
  const backupKeys = allKeys
    .filter((k) => typeof k === 'string' && k.startsWith(BACKUP_PREFIX))
    .sort()

  if (backupKeys.length > MAX_BACKUPS) {
    const toDelete = backupKeys.slice(0, backupKeys.length - MAX_BACKUPS)
    for (const k of toDelete) {
      await del(k)
    }
  }

  return meta
}

export async function listBackups(): Promise<BackupMeta[]> {
  const allKeys = (await keys()) as string[]
  const backupKeys = allKeys
    .filter((k) => typeof k === 'string' && k.startsWith(BACKUP_PREFIX))
    .sort()
    .reverse()

  const metas: BackupMeta[] = []
  for (const key of backupKeys) {
    const data = await get<BackupData>(key)
    if (data?.meta) {
      metas.push(data.meta)
    }
  }

  return metas
}

export async function restoreBackup(key: string): Promise<BackupData | null> {
  return (await get<BackupData>(key)) ?? null
}

export async function deleteBackup(key: string): Promise<void> {
  await del(key)
}
