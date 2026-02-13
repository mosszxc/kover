import { useEffect, useRef } from 'react'
import { useClientStore } from '@/modules/clients'
import { useDriverStore } from '@/modules/drivers'
import { useRouteStore } from '@/modules/routes'
import { useSettingsStore } from '@/shared/stores/settingsStore'
import {
  getSavedHandle,
  writeToFile,
  type FileSyncData,
} from '@/shared/lib/filesync'

const DEBOUNCE_MS = 2000

// Module-level handle so FileSyncStatus can update it
let _fileHandle: FileSystemFileHandle | null = null

export function setFileSyncHandle(h: FileSystemFileHandle | null) {
  _fileHandle = h
}

export function useFileSync() {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // On mount, try to recover the saved handle
  useEffect(() => {
    const { fileSyncEnabled } = useSettingsStore.getState()
    if (!fileSyncEnabled) return

    getSavedHandle().then((h) => {
      if (h) _fileHandle = h
    })
  }, [])

  // Subscribe to all 3 stores
  useEffect(() => {
    const unsubs = [
      useClientStore.subscribe(() => scheduleSave()),
      useDriverStore.subscribe(() => scheduleSave()),
      useRouteStore.subscribe(() => scheduleSave()),
    ]

    return () => unsubs.forEach((u) => u())
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function scheduleSave() {
    const { fileSyncEnabled } = useSettingsStore.getState()
    if (!fileSyncEnabled) return

    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      void performSave()
    }, DEBOUNCE_MS)
  }

  async function performSave() {
    if (!_fileHandle) {
      _fileHandle = await getSavedHandle()
    }
    if (!_fileHandle) return

    try {
      const permission = await _fileHandle.queryPermission({ mode: 'readwrite' })
      if (permission !== 'granted') return
    } catch {
      return
    }

    const data: FileSyncData = {
      version: 1,
      timestamp: new Date().toISOString(),
      clients: useClientStore.getState().clients,
      routes: useRouteStore.getState().routes,
      drivers: useDriverStore.getState().drivers,
    }

    const ok = await writeToFile(_fileHandle, data)
    if (ok) {
      useSettingsStore.getState().setLastFileSyncAt(data.timestamp)
    }
  }
}
