import { useState } from 'react'
import { MapPin, RefreshCw, Loader2 } from 'lucide-react'
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

  const activeWithAddress = clients.filter(
    (c) => c.isActive && c.address.trim(),
  )
  const clientsWithoutCoords = activeWithAddress.filter((c) => c.lat == null)
  const clientsWithCoords = activeWithAddress.filter((c) => c.lat != null)

  async function runBatchGeocode(targets: typeof clients) {
    setRunning(true)
    const total = targets.length
    setProgress({ done: 0, total })
    let success = 0

    for (let i = 0; i < targets.length; i++) {
      const client = targets[i]!
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
      if (i < targets.length - 1) {
        await delay(1100) // Nominatim rate limit: 1 req/sec
      }
    }

    setRunning(false)
    toast.success(`Геокодирование завершено: ${success}/${total}`)
  }

  if (activeWithAddress.length === 0) return null

  return (
    <div className="flex items-center gap-1">
      {clientsWithoutCoords.length > 0 && (
        <Button
          variant="outline"
          size="sm"
          disabled={running}
          onClick={() => runBatchGeocode(clientsWithoutCoords)}
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
      )}
      {clientsWithCoords.length > 0 && (
        <Button
          variant="ghost"
          size="sm"
          disabled={running}
          onClick={() => runBatchGeocode(activeWithAddress)}
          title="Перегеокодировать всех клиентов заново"
        >
          {running && clientsWithoutCoords.length === 0 ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {progress.done}/{progress.total}
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4" />
              Перегеокодировать всех
            </>
          )}
        </Button>
      )}
    </div>
  )
}
