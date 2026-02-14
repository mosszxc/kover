import type { GeoPoint, OptimizationResult } from './tsp'

interface OsrmWaypoint {
  waypoint_index: number
  trips_index: number
  location: [number, number]
}

interface OsrmTrip {
  distance: number
  duration: number
}

interface OsrmResponse {
  code: string
  waypoints: OsrmWaypoint[]
  trips: OsrmTrip[]
}

export async function optimizeRouteByRoad(
  points: GeoPoint[],
): Promise<OptimizationResult> {
  const coords = points.map((p) => `${p.lng},${p.lat}`).join(';')
  const url = `https://router.project-osrm.org/trip/v1/driving/${coords}?source=first&roundtrip=false&overview=false`

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`OSRM request failed: ${response.status}`)
  }

  const data: OsrmResponse = await response.json()
  if (data.code !== 'Ok') {
    throw new Error(`OSRM error: ${data.code}`)
  }

  const orderedIndices = data.waypoints
    .slice()
    .sort((a, b) => a.waypoint_index - b.waypoint_index)
    .map((wp) => data.waypoints.indexOf(wp))

  const optimizedIds = orderedIndices.map((i) => points[i]!.id)
  const optimizedDistance = data.trips[0]!.distance / 1000

  // Calculate original distance via OSRM for fair comparison
  // Use trip distance as optimized, and sum sequential legs as original
  const originalCoordsUrl = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=false`
  let originalDistance: number

  try {
    const origResponse = await fetch(originalCoordsUrl)
    if (origResponse.ok) {
      const origData = await origResponse.json()
      if (origData.code === 'Ok' && origData.routes?.[0]) {
        originalDistance = origData.routes[0].distance / 1000
      } else {
        originalDistance = optimizedDistance
      }
    } else {
      originalDistance = optimizedDistance
    }
  } catch {
    originalDistance = optimizedDistance
  }

  const savingPercent =
    originalDistance > 0
      ? ((originalDistance - optimizedDistance) / originalDistance) * 100
      : 0

  return {
    optimizedIds,
    originalDistance,
    optimizedDistance,
    savingPercent: Math.max(0, savingPercent),
    method: 'road',
  }
}
