import { useMemo } from 'react'
import type { Client } from '@/modules/clients'
import { detectGeoAnomalies } from '@/shared/lib/geoAnomalies'

export function useGeoAnomalies(clients: Client[]): Set<string> {
  return useMemo(() => detectGeoAnomalies(clients), [clients])
}
