import { ChevronUp, ChevronDown, GripVertical, MapPinOff, Pencil, TriangleAlert, Clock, MoreHorizontal, ArrowRightLeft, X, ClipboardCheck, Phone, StickyNote, Check, SkipForward, AlertCircle } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { cn } from '@/shared/lib/utils'
import { StatusHint } from '@/shared/ui/status-hint'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/shared/ui/popover'
import type { Client } from '@/modules/clients'
import { getClientReplacements, formatWorkingHours } from '@/modules/clients'
import { useMatSizeStore } from '@/shared/stores/matSizeStore'
import { useMemo, useState } from 'react'
import { useRouteStore } from '../store'
import { RemoveStopDialog } from './RemoveStopDialog'
import { TransferStopDialog } from './TransferStopDialog'

import type { DayOfWeek } from '@/shared/types'
import {
  SelectGroup,
  SelectLabel,
  SelectSeparator,
} from '@/shared/ui/select'
import type { StopExecutionStatus } from '@/shared/stores/routeExecutionStore'

export interface DriverOption {
  id: string
  name: string
  workDays: DayOfWeek[]
  vehicleCapacity?: number | null
}

export interface StopPaymentInfo {
  status: 'paid' | 'partial' | 'overdue' | 'pending'
  debt: number
}

export interface StopExecutionInfo {
  status: StopExecutionStatus
  note?: string
}

interface StopCardProps {
  number: number
  client: Client
  stopId: string
  driverId?: string
  drivers: DriverOption[]
  stopIndex: number
  isFirst: boolean
  isLast: boolean
  isDndEnabled?: boolean
  isAnomaly?: boolean
  isMissingCoords?: boolean
  onEditClient?: (client: Client) => void
  paymentInfo?: StopPaymentInfo
  onServiceReport?: (client: Client) => void
  executionInfo?: StopExecutionInfo
  onSetExecution?: (stopId: string, clientId: string, status: StopExecutionStatus, note?: string) => void
  onRemoveExecution?: (stopId: string) => void
}

export function StopCard({ number, client, stopId, driverId, drivers, stopIndex, isFirst, isLast, isDndEnabled = true, isAnomaly = false, isMissingCoords = false, onEditClient, paymentInfo, onServiceReport, executionInfo, onSetExecution, onRemoveExecution }: StopCardProps) {
  const sizes = useMatSizeStore((s) => s.sizes)
  const areaMap = Object.fromEntries(sizes.map((s) => [s.id, s.area]))
  const labelMap = Object.fromEntries(sizes.map((s) => [s.id, s.label]))
  const selectedDay = useRouteStore((s) => s.selectedDay)
  const replacements = getClientReplacements(client, selectedDay)
  const area = client.mats.reduce((sum, m) => sum + m.quantity * (areaMap[m.size] ?? 0), 0) * replacements
  const assignDriver = useRouteStore((s) => s.assignDriver)
  const moveStop = useRouteStore((s) => s.moveStop)

  const [removeOpen, setRemoveOpen] = useState(false)
  const [transferOpen, setTransferOpen] = useState(false)
  const [notePopoverOpen, setNotePopoverOpen] = useState(false)
  const [noteText, setNoteText] = useState(executionInfo?.note ?? '')

  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: stopId,
    disabled: !isDndEnabled,
  })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: transition ?? undefined,
  }

  const driverName = drivers.find((d) => d.id === driverId)?.name

  const executionStatus = executionInfo?.status

  const borderClass = executionStatus === 'completed'
    ? 'border-l-green-500 bg-green-500/5'
    : executionStatus === 'skipped'
      ? 'border-l-muted-foreground bg-muted/10'
      : executionStatus === 'problem'
        ? 'border-l-red-500 bg-red-500/5'
        : isAnomaly
          ? 'border-l-amber-500 bg-amber-500/5'
          : isMissingCoords
            ? 'border-l-muted-foreground bg-muted/5'
            : driverId
              ? 'border-l-blue-500'
              : 'border-l-border'

  function handleExecutionClick(status: StopExecutionStatus) {
    if (executionStatus === status) {
      // Toggle off
      onRemoveExecution?.(stopId)
    } else if (status === 'completed') {
      onSetExecution?.(stopId, client.id, 'completed')
    } else {
      // For skipped/problem, open note popover
      setNoteText(executionInfo?.note ?? '')
      setNotePopoverOpen(true)
      // Set status immediately, note can be added via popover
      onSetExecution?.(stopId, client.id, status)
    }
  }

  function handleNoteSave(status: StopExecutionStatus) {
    onSetExecution?.(stopId, client.id, status, noteText.trim() || undefined)
    setNotePopoverOpen(false)
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group flex items-center gap-3 border-l-3 p-3 transition-colors hover:bg-accent',
        borderClass,
        isDragging && 'z-10 opacity-50 ring-2 ring-blue-500',
      )}
      {...attributes}
    >
      {isDndEnabled && (
        <button
          type="button"
          ref={setActivatorNodeRef}
          {...listeners}
          aria-label="Перетащить для изменения порядка"
          className="flex size-6 min-h-[44px] min-w-[44px] shrink-0 cursor-grab items-center justify-center rounded active:cursor-grabbing focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 print:hidden"
        >
          <GripVertical className="size-5 text-foreground/40" />
        </button>
      )}

      <div className="flex shrink-0 flex-col print:hidden">
        <button
          type="button"
          disabled={isFirst}
          onClick={() => moveStop(selectedDay, stopId, stopIndex - 1)}
          aria-label="Переместить вверх"
          className="flex size-6 min-h-[44px] min-w-[44px] items-center justify-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-30 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          <ChevronUp className="size-4" />
        </button>
        <button
          type="button"
          disabled={isLast}
          onClick={() => moveStop(selectedDay, stopId, stopIndex + 1)}
          aria-label="Переместить вниз"
          className="flex size-6 min-h-[44px] min-w-[44px] items-center justify-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-30 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          <ChevronDown className="size-4" />
        </button>
      </div>

      <span className="w-8 shrink-0 text-center text-sm tabular-nums text-muted-foreground">
        {number}
      </span>

      {/* Execution status button */}
      {onSetExecution && (
        <div className="flex shrink-0 items-center gap-0.5 print:hidden">
          <button
            type="button"
            onClick={() => handleExecutionClick('completed')}
            aria-label="Выполнено"
            className={cn(
              'flex size-8 items-center justify-center rounded-full transition-colors',
              executionStatus === 'completed'
                ? 'bg-green-500 text-white'
                : 'text-muted-foreground hover:bg-green-500/20 hover:text-green-500',
            )}
          >
            <Check className="size-4" />
          </button>
          <Popover open={notePopoverOpen && (executionStatus === 'skipped' || executionStatus === 'problem')} onOpenChange={setNotePopoverOpen}>
            <PopoverTrigger asChild>
              <span className="inline-flex gap-0.5">
                <button
                  type="button"
                  onClick={() => handleExecutionClick('skipped')}
                  aria-label="Пропущено"
                  className={cn(
                    'flex size-8 items-center justify-center rounded-full transition-colors',
                    executionStatus === 'skipped'
                      ? 'bg-muted-foreground text-white'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  <SkipForward className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleExecutionClick('problem')}
                  aria-label="Проблема"
                  className={cn(
                    'flex size-8 items-center justify-center rounded-full transition-colors',
                    executionStatus === 'problem'
                      ? 'bg-red-500 text-white'
                      : 'text-muted-foreground hover:bg-red-500/20 hover:text-red-500',
                  )}
                >
                  <AlertCircle className="size-4" />
                </button>
              </span>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-3" align="start">
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  {executionStatus === 'skipped' ? 'Причина пропуска' : 'Описание проблемы'}
                </p>
                <input
                  type="text"
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && executionStatus) {
                      handleNoteSave(executionStatus)
                    }
                  }}
                  placeholder="Короткая заметка..."
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  autoFocus
                />
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setNotePopoverOpen(false)}
                  >
                    Отмена
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => executionStatus && handleNoteSave(executionStatus)}
                  >
                    Сохранить
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          {isMissingCoords && (
            <span className="shrink-0 print:hidden">
              <StatusHint
                title="Нет координат"
                description="Адрес не геокодирован — остановка не отображается на карте."
                action="Откройте карточку клиента и укажите корректный адрес."
                variant="error"
              >
                <MapPinOff className="size-4 text-muted-foreground" aria-label="Нет координат" />
              </StatusHint>
            </span>
          )}
          {isAnomaly && (
            <span className="shrink-0 print:hidden">
              <StatusHint
                title="Гео-аномалия"
                description="Остановка далеко от остальных — возможно, адрес указан неверно."
                action="Проверьте адрес клиента и исправьте координаты."
                variant="warning"
              >
                <TriangleAlert className="size-4 text-amber-400" aria-label="Далеко от остальных остановок" />
              </StatusHint>
            </span>
          )}
          <p className={cn(
            'truncate lg:whitespace-normal text-base',
            executionStatus === 'completed' ? 'text-muted-foreground line-through' : 'text-foreground',
          )}>
            {client.originalName}
          </p>
          {paymentInfo && paymentInfo.status !== 'paid' && paymentInfo.status !== 'pending' && (
            <span
              className={cn(
                'shrink-0 rounded px-1.5 py-0.5 text-xs font-semibold',
                paymentInfo.status === 'overdue'
                  ? 'bg-red-600/20 text-red-400'
                  : 'bg-amber-600/20 text-amber-400',
              )}
            >
              {paymentInfo.debt > 0 ? `${paymentInfo.debt.toLocaleString('ru-RU')} ₽` : paymentInfo.status === 'overdue' ? 'Долг' : 'Частично'}
            </span>
          )}
          {formatWorkingHours(client) && (
            <span className="ml-1 inline-flex shrink-0 items-center gap-0.5 text-sm text-muted-foreground">
              <Clock className="size-3" />
              {formatWorkingHours(client)}
            </span>
          )}
          {client.contactPhone && (
            <a
              href={`tel:${client.contactPhone}`}
              onClick={(e) => e.stopPropagation()}
              className="ml-1 inline-flex shrink-0 items-center gap-0.5 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
              title={client.contactName ?? 'Позвонить'}
            >
              <Phone className="size-3" />
              {client.contactPhone}
            </a>
          )}
        </div>
        {executionInfo?.note && (
          <p className={cn(
            'mt-0.5 text-sm italic',
            executionStatus === 'problem' ? 'text-red-400' : 'text-muted-foreground',
          )}>
            {executionInfo.note}
          </p>
        )}
        {(client.notes || (client.clientNotes && client.clientNotes.length > 0)) && (
          <p className="mt-0.5 flex items-start gap-1 text-sm text-muted-foreground">
            <StickyNote className="mt-0.5 size-3 shrink-0" />
            <span className="line-clamp-2">
              {[
                client.notes,
                ...(client.clientNotes ?? [])
                  .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
                  .slice(0, 2)
                  .map((n) => n.text),
              ]
                .filter(Boolean)
                .join(' · ')}
            </span>
          </p>
        )}
        {isAnomaly && onEditClient && (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onEditClient(client)
            }}
            className="mt-1 h-auto gap-1 px-1.5 py-0.5 text-sm text-amber-400 hover:bg-amber-500/20 hover:text-amber-300 print:hidden"
          >
            <Pencil className="size-3" />
            Исправить адрес
          </Button>
        )}
      </div>

      {drivers.length > 0 && (
        <DriverSelect
          drivers={drivers}
          selectedDay={selectedDay}
          driverId={driverId}
          onValueChange={(value) => assignDriver(selectedDay, stopId, value === '__none__' ? null : value)}
        />
      )}

      <div className="flex shrink-0 items-center gap-1.5">
        {replacements > 1 && (
          <span className="rounded bg-blue-600/20 px-1.5 py-0.5 text-xs font-semibold text-blue-400">
            {replacements}×
          </span>
        )}
        {client.mats.map((mat, i) => (
          <span
            key={i}
            className="rounded bg-muted px-1.5 py-0.5 text-xs font-semibold text-foreground"
          >
            {labelMap[mat.size] ?? mat.size}
            {mat.quantity > 1 && <span className="opacity-60"> x{mat.quantity}</span>}
          </span>
        ))}
      </div>

      <span className="w-16 shrink-0 text-right text-sm font-semibold tabular-nums text-foreground">
        {area.toFixed(1)} м²
      </span>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="Действия с остановкой"
            className="flex size-6 min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 print:hidden"
          >
            <MoreHorizontal className="size-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {onServiceReport && (
            <DropdownMenuItem onClick={() => onServiceReport(client)}>
              <ClipboardCheck className="size-4" />
              Отчёт о визите
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => setTransferOpen(true)}>
            <ArrowRightLeft className="size-4" />
            Перенести в другой день
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={() => setRemoveOpen(true)}>
            <X className="size-4" />
            Убрать из маршрута
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <TransferStopDialog
        stopId={stopId}
        clientId={client.id}
        clientName={client.originalName}
        day={selectedDay}
        driverName={driverName}
        open={transferOpen}
        onOpenChange={setTransferOpen}
      />

      <RemoveStopDialog
        stopId={stopId}
        clientId={client.id}
        clientName={client.originalName}
        day={selectedDay}
        driverName={driverName}
        open={removeOpen}
        onOpenChange={setRemoveOpen}
      />
    </div>
  )
}

interface DriverSelectProps {
  drivers: DriverOption[]
  selectedDay: DayOfWeek
  driverId?: string
  onValueChange: (value: string) => void
}

function DriverSelect({ drivers, selectedDay, driverId, onValueChange }: DriverSelectProps) {
  const { working, notWorking } = useMemo(() => {
    const w: DriverOption[] = []
    const nw: DriverOption[] = []
    for (const d of drivers) {
      if (d.workDays.includes(selectedDay)) {
        w.push(d)
      } else {
        nw.push(d)
      }
    }
    return { working: w, notWorking: nw }
  }, [drivers, selectedDay])

  return (
    <Select value={driverId ?? '__none__'} onValueChange={onValueChange}>
      <SelectTrigger
        size="sm"
        aria-label="Назначить водителя"
        className={cn(
          'w-34 shrink-0 cursor-pointer truncate text-sm print:hidden',
          driverId
            ? 'border-blue-600/50 bg-blue-950/50 text-blue-300'
            : 'border-border bg-card text-muted-foreground',
        )}
      >
        <SelectValue placeholder="Водитель" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__none__">Без водителя</SelectItem>
        {working.map((d) => (
          <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
        ))}
        {notWorking.length > 0 && (
          <>
            <SelectSeparator />
            <SelectGroup>
              <SelectLabel className="text-sm text-muted-foreground">Не работают сегодня</SelectLabel>
              {notWorking.map((d) => (
                <SelectItem key={d.id} value={d.id} className="text-muted-foreground">
                  {d.name}
                </SelectItem>
              ))}
            </SelectGroup>
          </>
        )}
      </SelectContent>
    </Select>
  )
}
