const SAVE_EVENT = 'kover-save'

let patched = false

export function initSaveInterceptor() {
  if (patched) return
  patched = true

  const original = localStorage.setItem.bind(localStorage)
  localStorage.setItem = (key: string, value: string) => {
    original(key, value)
    if (key.startsWith('kover-')) {
      window.dispatchEvent(new CustomEvent(SAVE_EVENT))
    }
  }
}

export function onSave(callback: () => void): () => void {
  const handler = () => callback()
  window.addEventListener(SAVE_EVENT, handler)
  return () => window.removeEventListener(SAVE_EVENT, handler)
}
