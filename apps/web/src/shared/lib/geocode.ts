interface NominatimResult {
  lat: string
  lon: string
  display_name: string
}

export interface GeocodeResult {
  lat: number
  lng: number
  displayName: string
}

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search'

export async function geocodeAddress(address: string, city?: string): Promise<GeocodeResult | null> {
  const addressAlreadyHasCity = city ? address.toLowerCase().includes(city.toLowerCase()) : false
  const query = city && !addressAlreadyHasCity ? `${city}, ${address}` : address
  const params = new URLSearchParams({
    q: query,
    format: 'json',
    limit: '1',
    countrycodes: 'ru',
  })

  try {
    const res = await fetch(`${NOMINATIM_URL}?${params}`, {
      headers: { 'User-Agent': 'Kover Route Manager (dev)' },
    })

    if (!res.ok) return null

    const data: NominatimResult[] = await res.json()
    const first = data[0]
    if (!first) return null

    return {
      lat: parseFloat(first.lat),
      lng: parseFloat(first.lon),
      displayName: first.display_name,
    }
  } catch {
    return null
  }
}

export async function searchAddresses(query: string, city?: string): Promise<GeocodeResult[]> {
  if (query.trim().length < 3) return []

  const addressAlreadyHasCity = city ? query.toLowerCase().includes(city.toLowerCase()) : false
  const fullQuery = city && !addressAlreadyHasCity ? `${city}, ${query}` : query
  const params = new URLSearchParams({
    q: fullQuery,
    format: 'json',
    limit: '5',
    countrycodes: 'ru',
  })

  try {
    const res = await fetch(`${NOMINATIM_URL}?${params}`, {
      headers: { 'User-Agent': 'Kover Route Manager (dev)' },
    })

    if (!res.ok) return []

    const data: NominatimResult[] = await res.json()
    return data.map((item) => ({
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      displayName: item.display_name,
    }))
  } catch {
    return []
  }
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
