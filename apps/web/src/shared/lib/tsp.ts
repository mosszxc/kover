export interface GeoPoint {
  id: string
  lat: number
  lng: number
}

type Point = GeoPoint

export function haversine(a: Point, b: Point): number {
  const R = 6371 // km
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const sinLat = Math.sin(dLat / 2)
  const sinLng = Math.sin(dLng / 2)
  const h =
    sinLat * sinLat +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * sinLng * sinLng
  return 2 * R * Math.asin(Math.sqrt(h))
}

function totalDistance(route: Point[]): number {
  let dist = 0
  for (let i = 0; i < route.length - 1; i++) {
    dist += haversine(route[i]!, route[i + 1]!)
  }
  return dist
}

function nearestNeighbor(points: Point[]): Point[] {
  if (points.length <= 2) return [...points]

  const remaining = new Set(points.map((_, i) => i))
  const result: Point[] = []

  // Start from first point
  let current = 0
  remaining.delete(current)
  result.push(points[current]!)

  while (remaining.size > 0) {
    let nearest = -1
    let nearestDist = Infinity

    for (const idx of remaining) {
      const d = haversine(points[current]!, points[idx]!)
      if (d < nearestDist) {
        nearestDist = d
        nearest = idx
      }
    }

    remaining.delete(nearest)
    result.push(points[nearest]!)
    current = nearest
  }

  return result
}

function twoOpt(route: Point[]): Point[] {
  if (route.length <= 3) return route

  let best = [...route]
  let bestDist = totalDistance(best)
  let improved = true

  while (improved) {
    improved = false
    for (let i = 0; i < best.length - 1; i++) {
      for (let j = i + 2; j < best.length; j++) {
        const newRoute = [
          ...best.slice(0, i + 1),
          ...best.slice(i + 1, j + 1).reverse(),
          ...best.slice(j + 1),
        ]
        const newDist = totalDistance(newRoute)
        if (newDist < bestDist - 0.001) {
          best = newRoute
          bestDist = newDist
          improved = true
        }
      }
    }
  }

  return best
}

export interface OptimizationResult {
  optimizedIds: string[]
  originalDistance: number
  optimizedDistance: number
  savingPercent: number
}

export function optimizeRoute(points: Point[]): OptimizationResult {
  if (points.length <= 2) {
    const dist = totalDistance(points)
    return {
      optimizedIds: points.map((p) => p.id),
      originalDistance: dist,
      optimizedDistance: dist,
      savingPercent: 0,
    }
  }

  const originalDistance = totalDistance(points)
  const nnRoute = nearestNeighbor(points)
  const optimized = twoOpt(nnRoute)
  const optimizedDistance = totalDistance(optimized)
  const savingPercent =
    originalDistance > 0 ? ((originalDistance - optimizedDistance) / originalDistance) * 100 : 0

  return {
    optimizedIds: optimized.map((p) => p.id),
    originalDistance,
    optimizedDistance,
    savingPercent: Math.max(0, savingPercent),
  }
}
