import type { RouteStop } from './types'

export function isStopSkipped(stop: RouteStop): boolean {
  if (!stop.skippedUntil) return false
  const today = new Date().toISOString().slice(0, 10)
  return stop.skippedUntil > today
}
