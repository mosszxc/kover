import { get, set, del } from 'idb-keyval'

const FILE_HANDLE_KEY = 'kover-filesync-handle'

export interface FileSyncData {
  version: 1
  timestamp: string
  clients: unknown[]
  routes: unknown[]
  drivers: unknown[]
}

export function isFileSyncSupported(): boolean {
  return 'showSaveFilePicker' in window
}

export async function pickSaveFile(): Promise<FileSystemFileHandle | null> {
  try {
    const handle = await window.showSaveFilePicker({
      suggestedName: 'kover-data.json',
      types: [
        {
          description: 'JSON',
          accept: { 'application/json': ['.json'] },
        },
      ],
    })
    await set(FILE_HANDLE_KEY, handle)
    return handle
  } catch {
    // User cancelled the picker
    return null
  }
}

export async function pickOpenFile(): Promise<FileSystemFileHandle | null> {
  try {
    const [handle] = await window.showOpenFilePicker({
      types: [
        {
          description: 'JSON',
          accept: { 'application/json': ['.json'] },
        },
      ],
    })
    return handle ?? null
  } catch {
    return null
  }
}

export async function getSavedHandle(): Promise<FileSystemFileHandle | null> {
  try {
    const handle = await get<FileSystemFileHandle>(FILE_HANDLE_KEY)
    if (!handle) return null
    // Verify we still have permission
    const permission = await handle.queryPermission({ mode: 'readwrite' })
    if (permission === 'granted') return handle
    return handle // Return it — caller will request permission
  } catch {
    return null
  }
}

export async function requestPermission(
  handle: FileSystemFileHandle,
): Promise<boolean> {
  try {
    const result = await handle.requestPermission({ mode: 'readwrite' })
    return result === 'granted'
  } catch {
    return false
  }
}

export async function writeToFile(
  handle: FileSystemFileHandle,
  data: FileSyncData,
): Promise<boolean> {
  try {
    const writable = await handle.createWritable()
    await writable.write(JSON.stringify(data, null, 2))
    await writable.close()
    return true
  } catch {
    return false
  }
}

export async function readFromFile(
  handle: FileSystemFileHandle,
): Promise<FileSyncData | null> {
  try {
    const file = await handle.getFile()
    const text = await file.text()
    const parsed = JSON.parse(text) as FileSyncData
    if (
      !Array.isArray(parsed.clients) ||
      !Array.isArray(parsed.routes) ||
      !Array.isArray(parsed.drivers)
    ) {
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export async function clearSavedHandle(): Promise<void> {
  await del(FILE_HANDLE_KEY)
}
