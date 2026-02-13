import { useState } from 'react'
import { MapPin, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/shared/ui/button'
import { geocodeAddress, delay } from '@/shared/lib/geocode'
import { useSettingsStore } from '@/shared/stores/settingsStore'
import { useClientStore } from '../store'

export function BatchGeocode() {
  const clients = useClientStore((s) => s.clients)
  const updateClient = useClientStore((s) => s.updateClient)
  const geocodeCity = useSettingsStore((s) => s.geocodeCity)
  const [running, setRunning] = useState(false)
  const [progress, setProgress] = useState({ done: 0, total: 0 })

  const clientsWithoutCoords = clients.filter(
    (c) => c.isActive && c.address.trim() && c.lat == null,
  )

  if (clientsWithoutCoords.length === 0) return null

  async function handleBatchGeocode() {
    setRunning(true)
    const total = clientsWithoutCoords.length
    setProgress({ done: 0, total })
    let success = 0

    for (let i = 0; i < clientsWithoutCoords.length; i++) {
      const client = clientsWithoutCoords[i]!
      try {
        const result = await geocodeAddress(client.address.trim(), geocodeCity || undefined)
        if (result) {
          updateClient(client.id, { lat: result.lat, lng: result.lng })
          success++
        }
      } catch {
        // skip failed ones
      }
      setProgress({ done: i + 1, total })
      if (i < clientsWithoutCoords.length - 1) {
        await delay(1100) // Nominatim rate limit: 1 req/sec
      }
    }

    setRunning(false)
    toast.success(`Геокодирование завершено: ${success}/${total}`)
  }

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={running}
      onClick={handleBatchGeocode}
    >
      {running ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          {progress.done}/{progress.total}
        </>
      ) : (
        <>
          <MapPin className="h-4 w-4" />
          Геокодировать ({clientsWithoutCoords.length})
        </>
      )}
    </Button>
  )
}
