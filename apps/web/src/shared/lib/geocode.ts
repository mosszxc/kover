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

export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  const params = new URLSearchParams({
    q: address,
    format: 'json',
    limit: '1',
    countrycodes: 'ru',
  })

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
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
