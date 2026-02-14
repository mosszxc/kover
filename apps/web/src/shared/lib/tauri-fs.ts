import { isTauri } from './platform'

/**
 * Shows a native "Save As" dialog and writes binary data to the chosen path.
 * Returns true if saved, false if cancelled or failed.
 * Only works in Tauri — caller must check isTauri() first.
 */
export async function tauriSaveFile(
  data: Uint8Array,
  defaultFilename: string,
  filters: { name: string; extensions: string[] }[],
): Promise<boolean> {
  const { save } = await import('@tauri-apps/plugin-dialog')
  const { writeFile } = await import('@tauri-apps/plugin-fs')

  const path = await save({
    title: 'Сохранить файл',
    defaultPath: defaultFilename,
    filters,
  })

  if (!path) return false

  await writeFile(path, data)
  return true
}

/**
 * Shows a native "Open" dialog and reads the file as binary.
 * Returns { name, data } or null if cancelled.
 * Only works in Tauri — caller must check isTauri() first.
 */
export async function tauriOpenFile(
  filters: { name: string; extensions: string[] }[],
): Promise<{ name: string; data: Uint8Array } | null> {
  const { open } = await import('@tauri-apps/plugin-dialog')
  const { readFile } = await import('@tauri-apps/plugin-fs')

  const path = await open({
    title: 'Открыть файл',
    filters,
    multiple: false,
  })

  if (!path) return null

  const data = await readFile(path)
  // Extract filename from path (handle both / and \)
  const name = path.replace(/^.*[\\/]/, '')

  return { name, data }
}

export { isTauri }
