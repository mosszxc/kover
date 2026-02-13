import { useState } from 'react'
import { Phone, User } from 'lucide-react'
import { useDriverStore } from '../store'
import type { Driver } from '../types'

interface DriversListProps {
  onRowClick?: (driver: Driver) => void
}

export function DriversList({ onRowClick }: DriversListProps) {
  const drivers = useDriverStore((s) => s.drivers)
  const [search, setSearch] = useState('')

  const filtered = drivers.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.phone.includes(search),
  )

  const inputClass =
    'h-11 w-full rounded-md border border-border bg-card px-3 text-base text-foreground placeholder:text-muted-foreground focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors'

  if (drivers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-12 text-center">
        <User className="mb-3 h-10 w-10 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Водителей пока нет</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Добавьте первого водителя кнопкой выше
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {drivers.length > 3 && (
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск по имени или телефону..."
          className={inputClass}
        />
      )}

      <div className="space-y-2">
        {filtered.map((driver) => (
          <button
            key={driver.id}
            type="button"
            onClick={() => onRowClick?.(driver)}
            className="flex w-full items-center gap-3 rounded-lg border border-border bg-muted/50 px-4 py-3 text-left transition-colors hover:border-ring hover:bg-muted"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-foreground">
              <User className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                {driver.name}
              </p>
              {driver.phone && (
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Phone className="h-3 w-3" />
                  {driver.phone}
                </p>
              )}
            </div>
            {!driver.isActive && (
              <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                Неактивен
              </span>
            )}
          </button>
        ))}

        {filtered.length === 0 && search && (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Ничего не найдено
          </p>
        )}
      </div>
    </div>
  )
}
