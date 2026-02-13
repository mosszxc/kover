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
    'h-11 w-full rounded-md border border-slate-700 bg-slate-900 px-3 text-base text-slate-50 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors'

  if (drivers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-700 py-12 text-center">
        <User className="mb-3 h-10 w-10 text-slate-600" />
        <p className="text-sm text-slate-400">Водителей пока нет</p>
        <p className="mt-1 text-xs text-slate-500">
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
            className="flex w-full items-center gap-3 rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-3 text-left transition-colors hover:border-slate-600 hover:bg-slate-800"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-700 text-slate-300">
              <User className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-50">
                {driver.name}
              </p>
              {driver.phone && (
                <p className="flex items-center gap-1 text-xs text-slate-400">
                  <Phone className="h-3 w-3" />
                  {driver.phone}
                </p>
              )}
            </div>
            {!driver.isActive && (
              <span className="shrink-0 rounded-full bg-slate-700 px-2 py-0.5 text-xs text-slate-400">
                Неактивен
              </span>
            )}
          </button>
        ))}

        {filtered.length === 0 && search && (
          <p className="py-4 text-center text-sm text-slate-500">
            Ничего не найдено
          </p>
        )}
      </div>
    </div>
  )
}
