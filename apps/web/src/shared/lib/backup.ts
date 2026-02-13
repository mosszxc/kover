import { get, set, del, keys } from 'idb-keyval'

const BACKUP_PREFIX = 'kover-backup-'
const MAX_BACKUPS = 20

export interface BackupMeta {
  key: string
  timestamp: string
  clientCount: number
  routeStopCount: number
}

export interface BackupData {
  meta: BackupMeta
  clients: unknown
  routes: unknown
}

export async function saveBackup(clients: unknown[], routes: unknown[]): Promise<BackupMeta> {
  const timestamp = new Date().toISOString()
  const key = `${BACKUP_PREFIX}${timestamp}`

  const stopCount = (routes as { stops: unknown[] }[]).reduce(
    (sum, r) => sum + (r.stops?.length ?? 0),
    0,
  )

  const meta: BackupMeta = {
    key,
    timestamp,
    clientCount: clients.length,
    routeStopCount: stopCount,
  }

  const data: BackupData = { meta, clients, routes }
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
