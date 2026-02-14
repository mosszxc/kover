import { haversine, type GeoPoint } from './tsp'

/** Расстояние (км), при котором пара точек считается подозрительной */
const PAIR_DISTANCE_THRESHOLD_KM = 15

/** Абсолютный порог (км) от медианного центра — точки дальше всегда аномалии */
const ABSOLUTE_DISTANCE_THRESHOLD_KM = 25

interface GeoEntity {
  id: string
  lat?: number
  lng?: number
}

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

export function detectGeoAnomalies(entities: GeoEntity[]): Set<string> {
  const withCoords = entities.filter(
    (e): e is GeoEntity & { lat: number; lng: number } =>
      e.lat != null && e.lng != null,
  )

  if (withCoords.length < 2) return new Set()

  const points: GeoPoint[] = withCoords.map((e) => ({
    id: e.id,
    lat: e.lat,
    lng: e.lng,
  }))

  // Для 2 точек: если расстояние > порога — обе помечаются
  if (points.length === 2) {
    const dist = haversine(points[0]!, points[1]!)
    if (dist > PAIR_DISTANCE_THRESHOLD_KM) {
      return new Set(points.map((p) => p.id))
    }
    return new Set()
  }

  // 3+ точек: IQR-метод + абсолютный порог
  const center = medianCenter(points)
  const distances = points.map((p) => ({
    id: p.id,
    distance: haversine(p, center),
  }))

  const anomalies = new Set<string>()

  // 1. Абсолютный порог — точки дальше 25 км от центра всегда аномалии
  for (const d of distances) {
    if (d.distance > ABSOLUTE_DISTANCE_THRESHOLD_KM) {
      anomalies.add(d.id)
    }
  }

  // 2. IQR-метод для более тонкой детекции
  const sorted = [...distances].sort((a, b) => a.distance - b.distance)
  const q1Idx = Math.floor(sorted.length * 0.25)
  const q3Idx = Math.floor(sorted.length * 0.75)
  const q1 = sorted[q1Idx]!.distance
  const q3 = sorted[q3Idx]!.distance
  const iqr = q3 - q1
  const threshold = q3 + 1.5 * iqr

  const candidates = sorted.filter((d) => d.distance > threshold)
  const maxAnomalies = Math.max(1, Math.floor(points.length * 0.15))
  const limited = candidates.slice(-maxAnomalies)

  for (const d of limited) {
    anomalies.add(d.id)
  }

  return anomalies
}
