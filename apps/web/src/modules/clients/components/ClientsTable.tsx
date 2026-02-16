import { useMemo, useState } from 'react'
import {
  type ColumnDef,
  type SortingState,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { Check, ChevronDown, ChevronUp, ChevronsUpDown, Search, AlertTriangle, Pause, Play, MapPin, TriangleAlert, CalendarClock, Clock, Printer } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { toast } from 'sonner'
import { useClientStore } from '../store'
import type { Client, ClientCategory } from '../types'
import { isClientPaused, formatPausedUntil, formatWorkingHours, CLIENT_CATEGORIES } from '../types'
import { PauseClientDialog } from './PauseClientDialog'
import { DAY_LABELS } from '@/shared/types'
import type { DayOfWeek } from '@/shared/types'
import { useMatSizeStore } from '@/shared/stores/matSizeStore'
import { MAT_SIZE_STYLES } from '@/shared/constants'
import type { MatSize } from '@/shared/types'
import { ClientsFilters, type StatusFilter, type PaymentFilter } from './ClientsFilters'
import { Banknote } from 'lucide-react'
import { ClientsPrintView } from './ClientsPrintView'
import { useCostSettingsStore } from '@/shared/stores/costSettingsStore'

export interface PaymentInfo {
  status: 'paid' | 'partial' | 'overdue' | 'pending'
  debt: number
}

interface ClientsTableProps {
  onRowClick?: (client: Client) => void
  isClientInRoute?: (clientId: string, day: DayOfWeek) => boolean
  onToggleActive?: (client: Client) => void
  onPauseClient?: (client: Client, pausedUntil: string | null) => void
  anomalyIds?: Set<string>
  paymentStatusMap?: Map<string, PaymentInfo>
  onRecordPayment?: (client: Client) => void
  onQuickPay?: (client: Client) => void
}

type SortField = 'name' | 'address' | 'mats' | 'area' | 'cost' | 'revenue' | 'margin' | 'frequency' | 'days'

export function ClientsTable({ onRowClick, isClientInRoute, onToggleActive, onPauseClient, anomalyIds, paymentStatusMap, onRecordPayment, onQuickPay }: ClientsTableProps) {
  const clients = useClientStore((s) => s.clients)
  const updateClient = useClientStore((s) => s.updateClient)
  const sizes = useMatSizeStore((s) => s.sizes)
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [pauseDialogClient, setPauseDialogClient] = useState<Client | null>(null)

  const areaMap = useMemo(
    () => Object.fromEntries(sizes.map((s) => [s.id, s.area])),
    [sizes],
  )
  const labelMap = useMemo(
    () => Object.fromEntries(sizes.map((s) => [s.id, s.label])),
    [sizes],
  )
  const priceMap = useMemo(
    () => Object.fromEntries(sizes.map((s) => [s.id, s.rentalPrice])),
    [sizes],
  )
  const hasPrices = useMemo(
    () => sizes.some((s) => s.rentalPrice > 0),
    [sizes],
  )
  const laundryCostPerSqm = useCostSettingsStore((s) => s.laundryCostPerSqm)
  const logisticsCostPerStop = useCostSettingsStore((s) => s.logisticsCostPerStop)
  const hasCostSettings = laundryCostPerSqm > 0 || logisticsCostPerStop > 0

  function groupMats(client: Client) {
    const grouped = new Map<string, number>()
    for (const m of client.mats) {
      grouped.set(m.size, (grouped.get(m.size) ?? 0) + m.quantity)
    }
    return Array.from(grouped.entries())
  }

  function getClientArea(client: Client): number {
    return client.mats.reduce((sum, m) => m.quantity * (areaMap[m.size] ?? 0) + sum, 0)
  }

  function getClientCost(client: Client): number {
    return client.mats.reduce((sum, m) => sum + m.quantity * (priceMap[m.size] ?? 0), 0)
  }

  const WEEKS_PER_MONTH = 4.33

  function getClientMonthlyRevenue(client: Client): number {
    if (client.customMonthlyPrice != null && client.customMonthlyPrice > 0) {
      return client.customMonthlyPrice
    }
    const costPerVisit = getClientCost(client)
    return Math.round(costPerVisit * client.frequency * WEEKS_PER_MONTH * 100) / 100
  }

  function getClientMonthlyCostOfService(client: Client): number {
    const area = getClientArea(client)
    const visitsPerMonth = client.frequency * WEEKS_PER_MONTH
    const laundryCost = area * laundryCostPerSqm * visitsPerMonth
    const logisticsCost = logisticsCostPerStop * visitsPerMonth
    return Math.round((laundryCost + logisticsCost) * 100) / 100
  }

  function getClientMargin(client: Client): number {
    return Math.round((getClientMonthlyRevenue(client) - getClientMonthlyCostOfService(client)) * 100) / 100
  }

  const columns = useMemo<ColumnDef<Client>[]>(() => {
    const cols: ColumnDef<Client>[] = [
      { accessorKey: 'name', header: 'Название' },
      { accessorKey: 'address', header: 'Адрес' },
      { id: 'mats', header: 'Коврики', accessorFn: (row) => row.mats.reduce((sum, m) => sum + m.quantity, 0) },
      { id: 'area', header: 'Метраж', accessorFn: (row) => getClientArea(row) },
    ]
    if (hasPrices) {
      cols.push(
        { id: 'cost', header: 'Стоимость', accessorFn: (row) => getClientCost(row) },
        { id: 'revenue', header: 'Выручка/мес', accessorFn: (row) => getClientMonthlyRevenue(row) },
      )
      if (hasCostSettings) {
        cols.push(
          { id: 'margin', header: 'Маржа/мес', accessorFn: (row) => getClientMargin(row) },
        )
      }
    }
    cols.push(
      { accessorKey: 'frequency', header: 'Частота' },
      { id: 'days', header: 'Дни', accessorFn: (row) => row.days.length },
      { accessorKey: 'isActive', header: 'Статус' },
    )
    return cols
  }, [getClientArea, getClientCost, getClientMonthlyRevenue, getClientMargin, hasPrices, hasCostSettings])

  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>([])
  const [selectedFrequency, setSelectedFrequency] = useState<number | null>(null)
  const [selectedMatSize, setSelectedMatSize] = useState<string | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>('all')
  const [selectedCategory, setSelectedCategory] = useState<ClientCategory | null>(null)
  const [selectedPayment, setSelectedPayment] = useState<PaymentFilter>('all')
  const hasPayments = (paymentStatusMap?.size ?? 0) > 0

  const filteredClients = useMemo(() => {
    let result = clients
    if (selectedStatus === 'active') {
      result = result.filter((c) => !isClientPaused(c))
    } else if (selectedStatus === 'paused') {
      result = result.filter((c) => isClientPaused(c))
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
    if (selectedCategory !== null) {
      result = result.filter((c) => c.category === selectedCategory)
    }
    if (selectedPayment !== 'all' && paymentStatusMap) {
      result = result.filter((c) => {
        const info = paymentStatusMap.get(c.id)
        if (selectedPayment === 'paid') return info?.status === 'paid'
        if (selectedPayment === 'unpaid') return !info || info.status !== 'paid'
        if (selectedPayment === 'overdue') return info?.status === 'overdue'
        return true
      })
    }
    return result
  }, [clients, selectedDays, selectedFrequency, selectedMatSize, selectedStatus, selectedCategory, selectedPayment, paymentStatusMap])

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

  function toggleSort(field: SortField) {
    setSorting((prev) => {
      const current = prev.find((s) => s.id === field)
      if (!current) return [{ id: field, desc: false }]
      if (!current.desc) return [{ id: field, desc: true }]
      return []
    })
  }

  function sortIcon(field: SortField) {
    const sort = sorting.find((s) => s.id === field)
    if (!sort) return <ChevronsUpDown className="size-3.5 text-muted-foreground" />
    return sort.desc
      ? <ChevronDown className="size-3.5 text-blue-400" />
      : <ChevronUp className="size-3.5 text-blue-400" />
  }

  const sortButtons: { field: SortField; label: string }[] = [
    { field: 'name', label: 'Имя' },
    { field: 'area', label: 'Метраж' },
    ...(hasPrices ? [
      { field: 'cost' as SortField, label: 'Стоимость' },
      { field: 'revenue' as SortField, label: 'Выручка/мес' },
      ...(hasCostSettings ? [{ field: 'margin' as SortField, label: 'Маржа' }] : []),
    ] : []),
    { field: 'frequency', label: 'Частота' },
    { field: 'days', label: 'Дни' },
  ]

  const rows = table.getRowModel().rows
  const finalFilteredClients = table.getFilteredRowModel().rows.map((r) => r.original)

  const hasActiveFilters = selectedDays.length > 0 || selectedFrequency !== null || selectedMatSize !== null || selectedStatus !== 'all' || selectedPayment !== 'all' || globalFilter !== ''

  function getPrintTitle(): string {
    const parts: string[] = []
    if (selectedPayment === 'overdue') parts.push('Должники')
    else if (selectedPayment === 'unpaid') parts.push('Неоплаченные')
    else if (selectedPayment === 'paid') parts.push('Оплаченные')
    if (selectedStatus === 'paused') parts.push('На паузе')
    else if (selectedStatus === 'active') parts.push('Активные')
    return parts.length > 0 ? parts.join(' · ') : 'Список клиентов'
  }

  return (
    <>
    <div className="space-y-4 print:hidden">
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
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        selectedPayment={selectedPayment}
        onPaymentChange={setSelectedPayment}
        hasPayments={hasPayments}
      />

      <div className="flex items-center justify-between text-xs text-muted-foreground">
      <div className="flex items-center gap-1">
        <span>Сортировка:</span>
        {sortButtons.map(({ field, label }) => (
          <button
            key={field}
            type="button"
            onClick={() => toggleSort(field)}
            className={cn(
              'inline-flex items-center gap-0.5 rounded-md px-2 py-1 transition-colors hover:bg-muted',
              sorting.some((s) => s.id === field) && 'bg-muted text-foreground',
            )}
          >
            {label}
            {sortIcon(field)}
          </button>
        ))}
      </div>
      {hasActiveFilters && (
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          title="Печать отфильтрованного списка"
        >
          <Printer className="size-3.5" />
          Печать
        </button>
      )}
      </div>

      <div className="space-y-2">
        {rows.map((row) => {
          const client = row.original
          const isAnomaly = anomalyIds?.has(client.id) ?? false
          const hasNoCoords = client.lat == null || client.lng == null
          const paused = isClientPaused(client)
          const isActive = !paused
          const entries = groupMats(client)
          const area = getClientArea(client)
          const cost = hasPrices ? getClientCost(client) : 0
          const revenue = hasPrices ? getClientMonthlyRevenue(client) : 0
          const margin = hasPrices && hasCostSettings ? getClientMargin(client) : null
          const paymentInfo = paymentStatusMap?.get(client.id)

          return (
            <div
              key={client.id}
              onClick={() => onRowClick?.(client)}
              className={cn(
                'rounded-lg border px-4 py-3 transition-colors',
                onRowClick && 'cursor-pointer',
                isAnomaly
                  ? 'border-amber-500/40 bg-amber-500/5'
                  : hasNoCoords
                    ? 'border-red-500/30 bg-red-500/5'
                    : 'border-border',
                isActive ? 'hover:bg-muted/50' : 'opacity-60 hover:bg-muted/30',
              )}
            >
              {/* Line 1: name · address | days */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="truncate font-medium text-foreground">{client.name}</span>
                  {client.category && (
                    <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                      {CLIENT_CATEGORIES.find((c) => c.value === client.category)?.label}
                    </span>
                  )}
                  {paymentInfo && (
                    <span
                      className={cn('inline-block size-2 shrink-0 rounded-full', {
                        'bg-emerald-400': paymentInfo.status === 'paid',
                        'bg-amber-400': paymentInfo.status === 'partial',
                        'bg-red-400': paymentInfo.status === 'overdue',
                        'bg-muted-foreground': paymentInfo.status === 'pending',
                      })}
                      title={`Оплата: ${paymentInfo.status === 'paid' ? 'Оплачен' : paymentInfo.status === 'partial' ? 'Частично' : paymentInfo.status === 'overdue' ? 'Просрочен' : 'Ожидает'}${paymentInfo.debt > 0 ? ` (долг: ${paymentInfo.debt.toLocaleString('ru-RU')} ₽)` : ''}`}
                    />
                  )}
                  <span className="hidden text-muted-foreground sm:inline">·</span>
                  <span className="hidden min-w-0 items-center gap-1 text-sm text-muted-foreground sm:inline-flex">
                    <span className={cn('truncate', isAnomaly && 'text-amber-400', hasNoCoords && !isAnomaly && 'text-red-400')}>{client.address}</span>
                    {isAnomaly ? (
                      <span title="Далеко от остальных — проверьте адрес">
                        <TriangleAlert className="size-3.5 shrink-0 text-amber-400" />
                      </span>
                    ) : hasNoCoords ? (
                      <span title="Адрес не геокодирован">
                        <MapPin className="size-3.5 shrink-0 text-red-400" />
                      </span>
                    ) : (
                      <MapPin className="size-3.5 shrink-0 text-green-400" />
                    )}
                  </span>
                </div>
                <div className="flex shrink-0 gap-1">
                  {client.days
                    .slice()
                    .sort((a, b) => a - b)
                    .map((d) => {
                      const inRoute = isClientInRoute?.(client.id, d) ?? false
                      return (
                        <span
                          key={d}
                          className={cn(
                            'inline-flex items-center gap-0.5 rounded border px-1.5 py-0.5 text-xs font-semibold',
                            inRoute
                              ? 'border-green-500/30 bg-green-500/20 text-green-400'
                              : 'border-orange-500/30 bg-orange-500/20 text-orange-400',
                          )}
                        >
                          {inRoute ? (
                            <Check className="size-3" />
                          ) : (
                            <AlertTriangle className="size-3" />
                          )}
                          {DAY_LABELS[d]}
                        </span>
                      )
                    })}
                </div>
              </div>

              {/* Mobile: address on second line */}
              <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground sm:hidden">
                <span className={cn('truncate', isAnomaly && 'text-amber-400', hasNoCoords && !isAnomaly && 'text-red-400')}>{client.address}</span>
                {isAnomaly ? (
                  <span title="Далеко от остальных — проверьте адрес">
                    <TriangleAlert className="size-3.5 shrink-0 text-amber-400" />
                  </span>
                ) : hasNoCoords ? (
                  <span title="Адрес не геокодирован">
                    <MapPin className="size-3.5 shrink-0 text-red-400" />
                  </span>
                ) : (
                  <MapPin className="size-3.5 shrink-0 text-green-400" />
                )}
              </div>

              {/* Line 2: mats · area · frequency | status */}
              <div className="mt-1.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm tabular-nums text-muted-foreground">
                  <span className="text-foreground">
                    {entries.map(([size, qty], i) => {
                      const style = MAT_SIZE_STYLES[size as MatSize]
                      return (
                        <span key={size}>
                          {i > 0 && <span className="text-muted-foreground">{' · '}</span>}
                          <span
                            className={cn('mr-0.5 inline-block size-2 rounded-full', style?.dot ?? 'bg-muted-foreground')}
                          />
                          {labelMap[size] ?? size}
                          {'\u00d7'}
                          {qty}
                        </span>
                      )
                    })}
                  </span>
                  <span className="text-muted-foreground">·</span>
                  <span>{area.toFixed(1)}{'\u00a0'}м²</span>
                  {hasPrices && cost > 0 && (
                    <>
                      <span className="text-muted-foreground">·</span>
                      <span className="text-emerald-400">{cost.toLocaleString('ru-RU')}{'\u00a0'}₽</span>
                      <span className="text-muted-foreground">·</span>
                      <span className="text-emerald-400 font-medium">{revenue.toLocaleString('ru-RU')}{'\u00a0'}₽/мес</span>
                    </>
                  )}
                  {margin !== null && (
                    <>
                      <span className="text-muted-foreground">·</span>
                      <span className={cn('font-medium', margin > 0 ? 'text-emerald-400' : margin < 0 ? 'text-red-400' : 'text-muted-foreground')}>
                        {margin > 0 ? '+' : ''}{margin.toLocaleString('ru-RU')}{'\u00a0'}₽
                      </span>
                    </>
                  )}
                  <span className="text-muted-foreground">·</span>
                  <span>{client.frequency}×/нед</span>
                  {formatWorkingHours(client) && (
                    <>
                      <span className="text-muted-foreground">·</span>
                      <span className="inline-flex items-center gap-0.5">
                        <Clock className="size-3" />
                        {formatWorkingHours(client)}
                      </span>
                    </>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                {paymentInfo && paymentInfo.status !== 'paid' && onRecordPayment && (
                  <div className="flex items-center gap-1">
                    {onQuickPay && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          onQuickPay(client)
                        }}
                        title="Отметить полную оплату"
                        className="inline-flex size-6 items-center justify-center rounded-full bg-emerald-600/20 text-emerald-400 transition-colors hover:bg-emerald-600/30"
                      >
                        <Check className="size-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onRecordPayment(client)
                      }}
                      className={cn(
                        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold transition-colors',
                        paymentInfo.status === 'overdue'
                          ? 'bg-red-600/20 text-red-400 hover:bg-red-600/30'
                          : 'bg-amber-600/20 text-amber-400 hover:bg-amber-600/30',
                      )}
                    >
                      <Banknote className="size-3" />
                      {paymentInfo.debt > 0 ? `${paymentInfo.debt.toLocaleString('ru-RU')} ₽` : 'Оплатить'}
                    </button>
                  </div>
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    if (isActive) {
                      // Активен → открыть диалог паузы
                      setPauseDialogClient(client)
                    } else {
                      // На паузе → активировать
                      if (onToggleActive) {
                        onToggleActive({ ...client, isActive: false })
                      } else {
                        updateClient(client.id, { isActive: true, pausedUntil: null })
                      }
                      toast.success('Клиент активирован', { duration: 2000 })
                    }
                  }}
                  className={cn(
                    'inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold transition-colors',
                    isActive
                      ? 'bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30'
                      : 'bg-amber-600/20 text-amber-400 hover:bg-amber-600/30',
                  )}
                  aria-label={isActive ? 'Поставить на паузу' : 'Активировать'}
                >
                  {isActive ? (
                    <>
                      <Pause className="size-3" />
                      Активен
                    </>
                  ) : client.pausedUntil ? (
                    <>
                      <CalendarClock className="size-3" />
                      До {formatPausedUntil(client.pausedUntil)}
                    </>
                  ) : (
                    <>
                      <Play className="size-3" />
                      На паузе
                    </>
                  )}
                </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Показано {table.getFilteredRowModel().rows.length} из {clients.length} клиентов</span>
        {hasPrices && (
          <div className="flex items-center gap-3">
            <span className="font-medium text-emerald-400">
              Выручка/мес: {(Math.round(
                table.getFilteredRowModel().rows.reduce(
                  (sum, row) => sum + getClientMonthlyRevenue(row.original), 0
                ) * 100
              ) / 100).toLocaleString('ru-RU')}{'\u00a0'}₽
            </span>
            {hasCostSettings && (() => {
              const totalMargin = Math.round(
                table.getFilteredRowModel().rows.reduce(
                  (sum, row) => sum + getClientMargin(row.original), 0
                ) * 100
              ) / 100
              return (
                <span className={cn('font-medium', totalMargin > 0 ? 'text-emerald-400' : totalMargin < 0 ? 'text-red-400' : 'text-muted-foreground')}>
                  Маржа: {totalMargin > 0 ? '+' : ''}{totalMargin.toLocaleString('ru-RU')}{'\u00a0'}₽
                </span>
              )
            })()}
          </div>
        )}
      </div>

      {pauseDialogClient && (
        <PauseClientDialog
          open={!!pauseDialogClient}
          onOpenChange={(open) => { if (!open) setPauseDialogClient(null) }}
          clientName={pauseDialogClient.name}
          onPause={(pausedUntil) => {
            if (onPauseClient) {
              onPauseClient(pauseDialogClient, pausedUntil)
            } else {
              updateClient(pauseDialogClient.id, { isActive: false, pausedUntil })
            }
            toast.success(
              pausedUntil
                ? `Клиент на паузе до ${formatPausedUntil(pausedUntil)}`
                : 'Клиент на паузе',
              { duration: 2000 },
            )
            setPauseDialogClient(null)
          }}
        />
      )}
    </div>
    <ClientsPrintView
      clients={finalFilteredClients}
      paymentInfoMap={paymentStatusMap}
      title={getPrintTitle()}
    />
    </>
  )
}
