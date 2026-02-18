import { useEffect, useRef } from 'react'
import { MapPin, RefreshCw, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/shared/ui/button'
import { geocodeAddress, delay } from '@/shared/lib/geocode'
import { waitForSync } from '@/shared/lib/sync'
import { useSettingsStore } from '@/shared/stores/settingsStore'
import { useClientStore } from '../store'
import { useGeocodeProgressStore } from '../geocodeProgressStore'

export function BatchGeocode() {
  const clients = useClientStore((s) => s.clients)
  const updateClient = useClientStore((s) => s.updateClient)
  const geocodeCity = useSettingsStore((s) => s.geocodeCity)

  const status = useGeocodeProgressStore((s) => s.status)
  const done = useGeocodeProgressStore((s) => s.done)
  const total = useGeocodeProgressStore((s) => s.total)

  const running = status === 'running'
  const toastShownRef = useRef(false)

  // Show toast when returning to tab if process completed while away
  useEffect(() => {
    function handleVisibilityChange() {
      if (document.hidden) return
      const state = useGeocodeProgressStore.getState()
      if (state.status === 'completed' && !toastShownRef.current) {
        toastShownRef.current = true
        toast.success(`Геокодирование завершено: ${state.success}/${state.total}`)
        state.reset()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  // Reset completed state when component mounts and process is done
  useEffect(() => {
    const state = useGeocodeProgressStore.getState()
    if (state.status === 'completed') {
      state.reset()
    }
  }, [])

  const activeWithAddress = clients.filter(
    (c) => c.isActive && c.address.trim(),
  )
  const clientsWithoutCoords = activeWithAddress.filter((c) => c.lat == null)
  const clientsWithCoords = activeWithAddress.filter((c) => c.lat != null)

  async function runBatchGeocode(targets: typeof clients) {
    const store = useGeocodeProgressStore.getState()
    store.start()
    store.setTotal(targets.length)
    toastShownRef.current = false

    let successCount = 0

    for (let i = 0; i < targets.length; i++) {
      const client = targets[i]!
      let ok = false
      try {
        const result = await geocodeAddress(client.address.trim(), geocodeCity || undefined)
        if (result) {
          updateClient(client.id, { lat: result.lat, lng: result.lng })
          ok = true
          successCount++
        }
      } catch {
        // skip failed ones
      }
      useGeocodeProgressStore.getState().tick(ok)

      if (i < targets.length - 1) {
        await delay(1100) // Nominatim rate limit: 1 req/sec
      }
    }

    // Wait for all sync operations to complete before showing success
    await waitForSync()

    useGeocodeProgressStore.getState().finish(successCount, targets.length)

    // Show toast only if tab is visible; otherwise visibility handler will show it
    if (!document.hidden) {
      toastShownRef.current = true
      toast.success(`Геокодирование завершено: ${successCount}/${targets.length}`)
      useGeocodeProgressStore.getState().reset()
    }
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
              {done}/{total}
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
              {done}/{total}
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
