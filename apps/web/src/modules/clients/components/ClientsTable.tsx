import { useMemo, useState } from 'react'
import {
  type ColumnDef,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { Check, ChevronDown, ChevronUp, ChevronsUpDown, Search, AlertTriangle, Pause, Play, MapPin, TriangleAlert } from 'lucide-react'
import { toast } from 'sonner'
import { useClientStore } from '../store'
import type { Client } from '../types'
import { DAY_LABELS } from '@/shared/types'
import type { DayOfWeek } from '@/shared/types'
import { useMatSizeStore } from '@/shared/stores/matSizeStore'
import { ClientsFilters, type StatusFilter } from './ClientsFilters'

interface ClientsTableProps {
  onRowClick?: (client: Client) => void
  isClientInRoute?: (clientId: string, day: DayOfWeek) => boolean
  onToggleActive?: (client: Client) => void
  anomalyIds?: Set<string>
}

export function ClientsTable({ onRowClick, isClientInRoute, onToggleActive, anomalyIds }: ClientsTableProps) {
  const clients = useClientStore((s) => s.clients)
  const updateClient = useClientStore((s) => s.updateClient)
  const sizes = useMatSizeStore((s) => s.sizes)
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')

  const areaMap = useMemo(
    () => Object.fromEntries(sizes.map((s) => [s.id, s.area])),
    [sizes],
  )
  const labelMap = useMemo(
    () => Object.fromEntries(sizes.map((s) => [s.id, s.label])),
    [sizes],
  )

  function formatMats(client: Client): string {
    const grouped = new Map<string, number>()
    for (const m of client.mats) {
      grouped.set(m.size, (grouped.get(m.size) ?? 0) + m.quantity)
    }
    return Array.from(grouped.entries())
      .map(([size, qty]) => `${qty}\u00d7${labelMap[size] ?? size}`)
      .join(', ')
  }

  function getClientArea(client: Client): number {
    return client.mats.reduce((sum, m) => m.quantity * (areaMap[m.size] ?? 0) + sum, 0)
  }

  const columns = useMemo<ColumnDef<Client>[]>(() => [
    {
      accessorKey: 'name',
      header: 'Название',
      cell: (info) => info.getValue(),
    },
    {
      accessorKey: 'address',
      header: 'Адрес',
      cell: ({ row }) => {
        const isAnomaly = anomalyIds?.has(row.original.id) ?? false
        return (
          <span className="flex items-center gap-1.5">
            {row.original.address}
            {isAnomaly ? (
              <span title="Далеко от остальных — проверьте адрес">
                <TriangleAlert className="h-3.5 w-3.5 shrink-0 text-amber-400" />
              </span>
            ) : row.original.lat != null && row.original.lng != null ? (
              <MapPin className="h-3.5 w-3.5 shrink-0 text-green-400" />
            ) : null}
          </span>
        )
      },
    },
    {
      id: 'mats',
      header: 'Коврики',
      accessorFn: (row) => row.mats.reduce((sum, m) => sum + m.quantity, 0),
      cell: ({ row }) => (
        <span className="tabular-nums">{formatMats(row.original)}</span>
      ),
    },
    {
      id: 'area',
      header: 'Метраж',
      accessorFn: (row) => getClientArea(row),
      cell: ({ row }) => (
        <span className="tabular-nums">
          {getClientArea(row.original).toFixed(1)}
        </span>
      ),
    },
    {
      accessorKey: 'frequency',
      header: 'Частота',
      cell: (info) => (
        <span className="tabular-nums">{info.getValue() as number}</span>
      ),
    },
    {
      id: 'days',
      header: 'Дни',
      accessorFn: (row) => row.days.length,
      cell: ({ row }) => (
        <div className="flex gap-1">
          {row.original.days
            .slice()
            .sort((a, b) => a - b)
            .map((d) => {
              const inRoute = isClientInRoute?.(row.original.id, d) ?? false
              return (
                <span
                  key={d}
                  className={`inline-flex items-center gap-0.5 rounded border px-1.5 py-0.5 text-xs font-semibold ${
                    inRoute
                      ? 'border-green-500/30 bg-green-500/20 text-green-400'
                      : 'border-orange-500/30 bg-orange-500/20 text-orange-400'
                  }`}
                >
                  {inRoute ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <AlertTriangle className="h-3 w-3" />
                  )}
                  {DAY_LABELS[d]}
                </span>
              )
            })}
        </div>
      ),
    },
    {
      accessorKey: 'isActive',
      header: 'Статус',
      cell: ({ row }) => {
        const client = row.original
        const isActive = client.isActive
        return (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              if (onToggleActive) {
                onToggleActive(client)
              } else {
                updateClient(client.id, { isActive: !isActive })
              }
              toast.success(isActive ? 'Клиент на паузе' : 'Клиент активирован', { duration: 2000 })
            }}
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold transition-colors ${
              isActive
                ? 'bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30'
                : 'bg-amber-600/20 text-amber-400 hover:bg-amber-600/30'
            }`}
            aria-label={isActive ? 'Поставить на паузу' : 'Активировать'}
          >
            {isActive ? (
              <>
                <Pause className="size-3" />
                Активен
              </>
            ) : (
              <>
                <Play className="size-3" />
                На паузе
              </>
            )}
          </button>
        )
      },
    },
  ], [isClientInRoute, updateClient, onToggleActive, anomalyIds, formatMats, getClientArea])
  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>([])
  const [selectedFrequency, setSelectedFrequency] = useState<number | null>(null)
  const [selectedMatSize, setSelectedMatSize] = useState<string | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>('all')

  const filteredClients = useMemo(() => {
    let result = clients
    if (selectedStatus === 'active') {
      result = result.filter((c) => c.isActive)
    } else if (selectedStatus === 'paused') {
      result = result.filter((c) => !c.isActive)
    }
    if (selectedDays.length > 0) {
      result = result.filter((c) =>
        selectedDays.some((d) => c.days.includes(d)),
      )
    }
    if (selectedFrequency !== null) {
      result = result.filter((c) => c.frequency === selectedFrequency)
    }
    if (selectedMatSize !== null) {
      result = result.filter((c) =>
        c.mats.some((m) => m.size === selectedMatSize),
      )
    }
    return result
  }, [clients, selectedDays, selectedFrequency, selectedMatSize, selectedStatus])

  const table = useReactTable({
    data: filteredClients,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, _columnId, filterValue: string) => {
      const query = filterValue.toLowerCase()
      return (
        row.original.name.toLowerCase().includes(query) ||
        row.original.address.toLowerCase().includes(query)
      )
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  const sortIcon = (columnId: string) => {
    const sort = sorting.find((s) => s.id === columnId)
    if (!sort) return <ChevronsUpDown className="size-4 text-muted-foreground" />
    return sort.desc ? (
      <ChevronDown className="size-4 text-blue-400" />
    ) : (
      <ChevronUp className="size-4 text-blue-400" />
    )
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Поиск по названию или адресу..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="w-full rounded-lg border border-border bg-card py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/50"
        />
      </div>

      <ClientsFilters
        selectedDays={selectedDays}
        onDaysChange={setSelectedDays}
        selectedFrequency={selectedFrequency}
        onFrequencyChange={setSelectedFrequency}
        selectedMatSize={selectedMatSize}
        onMatSizeChange={setSelectedMatSize}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
      />

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full">
          <thead className="sticky top-0 z-10 bg-card">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                    className="cursor-pointer select-none border-b border-border px-4 py-3 text-left text-sm font-medium text-muted-foreground hover:text-accent-foreground"
                  >
                    <div className="flex items-center gap-1">
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                      {sortIcon(header.id)}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row, i) => (
              <tr
                key={row.id}
                onClick={() => onRowClick?.(row.original)}
                className={`border-b border-border ${i % 2 === 1 ? 'bg-card/50' : ''} hover:bg-muted/50 ${onRowClick ? 'cursor-pointer' : ''}`}
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className="min-h-12 px-4 py-3 text-sm text-foreground"
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-sm text-muted-foreground">
        Показано {table.getFilteredRowModel().rows.length} из {clients.length} клиентов
      </p>
    </div>
  )
}
