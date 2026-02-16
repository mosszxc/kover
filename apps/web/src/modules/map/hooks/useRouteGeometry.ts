import { useState, useEffect } from 'react'
import type { MapStop } from './useMapData'
import { haversine } from '@/shared/lib/tsp'

export interface RouteGeometry {
  coordinates: [number, number][]
  distanceKm: number
  isRoadBased: boolean
}

function buildStraightLine(stops: MapStop[]): RouteGeometry {
  const coordinates = stops.map((s): [number, number] => [s.lat, s.lng])
  let distanceKm = 0
  for (let i = 0; i < stops.length - 1; i++) {
    const a = stops[i]!
    const b = stops[i + 1]!
    distanceKm += haversine({ id: '', ...a }, { id: '', ...b })
  }
  return { coordinates, distanceKm, isRoadBased: false }
}

async function fetchOsrmGeometry(stops: MapStop[]): Promise<RouteGeometry> {
  const coords = stops.map((s) => `${s.lng},${s.lat}`).join(';')
  const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`

  const response = await fetch(url)
  if (!response.ok) throw new Error(`OSRM: ${response.status}`)

  const data = await response.json()
  if (data.code !== 'Ok' || !data.routes?.[0]) {
    throw new Error(`OSRM error: ${data.code}`)
  }

  const route = data.routes[0]
  const geojsonCoords: [number, number][] = route.geometry.coordinates.map(
    ([lng, lat]: [number, number]) => [lat, lng] as [number, number],
  )

  return {
    coordinates: geojsonCoords,
    distanceKm: route.distance / 1000,
    isRoadBased: true,
  }
}

export function useRouteGeometry(stops: MapStop[]): RouteGeometry | null {
  const [geometry, setGeometry] = useState<RouteGeometry | null>(null)

  const stopsKey = stops.map((s) => `${s.lat},${s.lng}`).join('|')

  useEffect(() => {
    if (stops.length < 2) {
      setGeometry(null)
      return
    }

    let cancelled = false

    fetchOsrmGeometry(stops)
      .then((geo) => {
        if (!cancelled) setGeometry(geo)
      })
      .catch(() => {
        if (!cancelled) setGeometry(buildStraightLine(stops))
      })

    return () => {
      cancelled = true
    }
  }, [stopsKey]) // eslint-disable-line react-hooks/exhaustive-deps

  return geometry
}
