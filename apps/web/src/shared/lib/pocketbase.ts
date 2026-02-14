import PocketBase from 'pocketbase'

// In dev: empty string = same-origin (requests go through Vite proxy)
// In prod: set VITE_POCKETBASE_URL or use reverse proxy
const PB_URL = import.meta.env.VITE_POCKETBASE_URL || '/'

export const pb = new PocketBase(PB_URL)

// Disable auto-cancellation — we manage requests ourselves
pb.autoCancellation(false)

/** Check if PocketBase server is reachable */
export async function isPbReachable(): Promise<boolean> {
  try {
    await pb.health.check()
    return true
  } catch {
    return false
  }
}
