import { useMemo } from 'react'
import type { Client } from '@/modules/clients'
import { haversine, type GeoPoint } from '@/shared/lib/tsp'

const MIN_STOPS_FOR_DETECTION = 3

function medianCenter(points: GeoPoint[]): GeoPoint {
  const sorted = (arr: number[]) => [...arr].sort((a, b) => a - b)
  const median = (arr: number[]) => {
    const s = sorted(arr)
    const mid = Math.floor(s.length / 2)
    return s.length % 2 ? s[mid]! : (s[mid - 1]! + s[mid]!) / 2
  }

  return {
    id: '__center__',
    lat: median(points.map((p) => p.lat)),
    lng: median(points.map((p) => p.lng)),
  }
}

export function detectAnomalies(clients: Client[]): Set<string> {
  const withCoords = clients.filter(
    (c): c is Client & { lat: number; lng: number } =>
      c.lat != null && c.lng != null,
  )

  if (withCoords.length < MIN_STOPS_FOR_DETECTION) return new Set()

  const points: GeoPoint[] = withCoords.map((c) => ({
    id: c.id,
    lat: c.lat,
    lng: c.lng,
  }))

  const center = medianCenter(points)
  const distances = points.map((p) => ({
    id: p.id,
    distance: haversine(p, center),
  }))

  const sorted = [...distances].sort((a, b) => a.distance - b.distance)
  const q1Idx = Math.floor(sorted.length * 0.25)
  const q3Idx = Math.floor(sorted.length * 0.75)
  const q1 = sorted[q1Idx]!.distance
  const q3 = sorted[q3Idx]!.distance
  const iqr = q3 - q1
  const threshold = q3 + 1.5 * iqr

  const anomalies = new Set<string>()
  for (const d of distances) {
    if (d.distance > threshold) {
      anomalies.add(d.id)
    }
  }

  return anomalies
}

export function useGeoAnomalies(clients: Client[]): Set<string> {
  return useMemo(() => detectAnomalies(clients), [clients])
}
