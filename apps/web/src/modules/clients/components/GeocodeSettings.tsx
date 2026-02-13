import { useState } from 'react'
import { Settings, Check } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/shared/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/dialog'
import { useSettingsStore } from '@/shared/stores/settingsStore'

export function GeocodeSettings() {
  const geocodeCity = useSettingsStore((s) => s.geocodeCity)
  const setGeocodeCity = useSettingsStore((s) => s.setGeocodeCity)
  const [open, setOpen] = useState(false)
  const [city, setCity] = useState(geocodeCity)

  function handleSave() {
    setGeocodeCity(city)
    setOpen(false)
    toast.success(city.trim() ? `Город для геокодирования: ${city.trim()}` : 'Город сброшен')
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v)
        if (v) setCity(geocodeCity)
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Settings className="h-4 w-4" />
          {geocodeCity || 'Город не задан'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Город для геокодирования</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Адреса клиентов будут искаться в первую очередь в этом городе.
          </p>
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Например: Курган"
            className="h-11 w-full rounded-md border border-border bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave()
            }}
          />
        </div>
        <DialogFooter>
          <Button onClick={handleSave}>
            <Check className="h-4 w-4" />
            Сохранить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
