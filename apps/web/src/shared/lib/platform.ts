/**
 * Detects if the app is running inside a Tauri window.
 * Uses `__TAURI_INTERNALS__` which Tauri v2 injects into the webview.
 */
export function isTauri(): boolean {
  return '__TAURI_INTERNALS__' in window
}
