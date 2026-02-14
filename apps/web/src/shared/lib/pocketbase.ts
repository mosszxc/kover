import PocketBase from 'pocketbase'

const PB_URL = import.meta.env.VITE_POCKETBASE_URL || 'http://127.0.0.1:8090'

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
