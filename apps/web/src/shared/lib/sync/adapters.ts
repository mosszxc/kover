import type { SyncAdapter } from './types'
import type { Client, ClientNote, MatSpec } from '@/modules/clients/types'
import type { ClientCategory } from '@/modules/clients/types'
import type { Driver } from '@/modules/drivers/types'
import type { RouteStop } from '@/modules/routes/types'
import type { MatSizeConfig, DayOfWeek } from '@/shared/types'
import type { ChangeLogEntry } from '@/shared/stores/changelogStore'
import type { ServiceLogEntry } from '@/shared/stores/serviceLogStore'
import type { Payment } from '@/modules/payments/types'
import type { RouteException } from '@/shared/stores/routeExceptionsStore'
import type { ServiceReport, MatCount } from '@/shared/stores/serviceReportStore'
import type { DebtContact, DebtContactNote, DebtContactStatus } from '@/modules/payments/debtContactStore'
import type { MatInventory, MatBatch, InventoryTransaction, TransactionType } from '@/modules/inventory/types'
import type { Database, Json } from '@/shared/types/database'

type Row<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']
type Insert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']

// ── Mat Sizes ──

export const matSizesAdapter: SyncAdapter<MatSizeConfig, Insert<'mat_sizes'>> = {
  table: 'mat_sizes',
  toRemote: (local) => ({
    id: local.id,
    label: local.label,
    area: local.area,
    rental_price: local.rentalPrice,
    max_wash_cycles: local.maxWashCycles,
  }),
  toLocal: (remote) => ({
    id: remote.id!,
    label: remote.label!,
    area: remote.area!,
    rentalPrice: remote.rental_price ?? 0,
    maxWashCycles: remote.max_wash_cycles ?? 300,
  }),
}

// ── Drivers ──

export const driversAdapter: SyncAdapter<Driver, Insert<'drivers'>> = {
  table: 'drivers',
  toRemote: (local) => ({
    id: local.id,
    name: local.name,
    phone: local.phone,
    is_active: local.isActive,
    work_days: local.workDays as number[],
    created_at: local.createdAt,
  }),
  toLocal: (remote) => ({
    id: remote.id!,
    name: remote.name!,
    phone: remote.phone ?? '',
    isActive: remote.is_active ?? true,
    workDays: (remote.work_days ?? [0, 1, 2, 3, 4, 5, 6]) as DayOfWeek[],
    createdAt: remote.created_at ?? new Date().toISOString(),
  }),
}

// ── Clients ──

export const clientsAdapter: SyncAdapter<Client, Insert<'clients'>> = {
  table: 'clients',
  toRemote: (local) => ({
    id: local.id,
    name: local.name,
    original_name: local.originalName,
    address: local.address,
    mats: local.mats as unknown as Database['public']['Tables']['clients']['Insert']['mats'],
    frequency: local.frequency,
    days: local.days as number[],
    day_replacements: (local.dayReplacements ?? {}) as unknown as Database['public']['Tables']['clients']['Insert']['day_replacements'],
    notes: local.notes,
    client_notes: (local.clientNotes ?? []) as unknown as Json,
    is_active: local.isActive,
    paused_until: local.pausedUntil ?? null,
    lat: local.lat ?? null,
    lng: local.lng ?? null,
    working_hours_start: local.workingHoursStart ?? null,
    working_hours_end: local.workingHoursEnd ?? null,
    contact_name: local.contactName ?? null,
    contact_phone: local.contactPhone ?? null,
    custom_monthly_price: local.customMonthlyPrice ?? null,
    category: local.category ?? null,
    contract_number: local.contractNumber ?? null,
    contract_date: local.contractDate ?? null,
    created_at: local.createdAt,
  }),
  toLocal: (remote) => ({
    id: remote.id!,
    name: remote.name!,
    originalName: (remote.original_name as string) ?? '',
    address: (remote.address as string) ?? '',
    mats: (remote.mats ?? []) as unknown as MatSpec[],
    frequency: (remote.frequency as number) ?? 1,
    days: (remote.days ?? []) as DayOfWeek[],
    dayReplacements: (remote.day_replacements ?? {}) as Partial<Record<DayOfWeek, number>>,
    notes: (remote.notes as string) ?? '',
    clientNotes: (remote.client_notes ?? []) as unknown as ClientNote[],
    isActive: remote.is_active ?? true,
    pausedUntil: (remote.paused_until as string) ?? null,
    lat: remote.lat ?? undefined,
    lng: remote.lng ?? undefined,
    workingHoursStart: remote.working_hours_start ?? null,
    workingHoursEnd: remote.working_hours_end ?? null,
    contactName: remote.contact_name ?? null,
    contactPhone: remote.contact_phone ?? null,
    customMonthlyPrice: remote.custom_monthly_price ?? null,
    category: (remote.category as ClientCategory) ?? undefined,
    contractNumber: remote.contract_number ?? null,
    contractDate: remote.contract_date ?? null,
    createdAt: remote.created_at ?? new Date().toISOString(),
  }),
}

// ── Changelog ──

export const changelogAdapter: SyncAdapter<ChangeLogEntry, Insert<'changelog'>> = {
  table: 'changelog',
  toRemote: (local) => ({
    id: local.id,
    type: local.type,
    action: local.action,
    description: local.description,
    created_at: local.timestamp,
  }),
  toLocal: (remote) => ({
    id: remote.id!,
    type: remote.type! as 'route' | 'client',
    action: remote.action!,
    description: remote.description ?? '',
    timestamp: remote.created_at ?? new Date().toISOString(),
  }),
}

// ── Service Log ──

export interface ServiceLogRemote {
  id: string
  client_id: string
  day: number | null
  type: string
  driver_id?: string | null
  target_day?: number | null
  details?: string | null
  created_at?: string
}

export const serviceLogAdapter: SyncAdapter<ServiceLogEntry, Insert<'service_log'>> = {
  table: 'service_log',
  toRemote: (local) => ({
    id: local.id,
    client_id: local.clientId,
    day: local.day ?? null,
    type: local.type,
    driver_id: null,
    target_day: local.targetDay ?? null,
    details: local.details ?? null,
    created_at: local.timestamp,
  }),
  toLocal: (remote) => ({
    id: remote.id!,
    clientId: remote.client_id!,
    day: remote.day != null ? (remote.day as DayOfWeek) : undefined,
    type: remote.type! as ServiceLogEntry['type'],
    driverName: undefined,
    targetDay: (remote.target_day as DayOfWeek) ?? undefined,
    details: remote.details ?? undefined,
    timestamp: remote.created_at ?? new Date().toISOString(),
  }),
}

// ── Payments ──

export const paymentsAdapter: SyncAdapter<Payment, Insert<'payments'>> = {
  table: 'payments',
  toRemote: (local) => ({
    id: local.id,
    client_id: local.clientId,
    period: local.period,
    expected_amount: local.expectedAmount,
    paid_amount: local.paidAmount,
    paid_at: local.paidAt ?? null,
    notes: local.notes,
    created_at: local.createdAt,
  }),
  toLocal: (remote) => ({
    id: remote.id!,
    clientId: remote.client_id!,
    period: remote.period!,
    expectedAmount: remote.expected_amount ?? 0,
    paidAmount: remote.paid_amount ?? 0,
    paidAt: remote.paid_at ?? null,
    notes: remote.notes ?? '',
    createdAt: remote.created_at ?? new Date().toISOString(),
  }),
}

// ── Route Exceptions ──

export const routeExceptionsAdapter: SyncAdapter<RouteException, Insert<'route_exceptions'>> = {
  table: 'route_exceptions',
  toRemote: (local) => ({
    id: local.id,
    client_id: local.clientId,
    date: local.date,
    type: local.type,
    day: local.day,
    reason: local.reason ?? null,
    created_at: local.createdAt,
  }),
  toLocal: (remote) => ({
    id: remote.id!,
    clientId: remote.client_id!,
    date: remote.date!,
    type: remote.type! as 'skip' | 'add',
    day: remote.day! as DayOfWeek,
    reason: remote.reason ?? undefined,
    createdAt: remote.created_at ?? new Date().toISOString(),
  }),
}

// ── Service Reports ──

export const serviceReportsAdapter: SyncAdapter<ServiceReport, Insert<'service_reports'>> = {
  table: 'service_reports',
  toRemote: (local) => ({
    id: local.id,
    client_id: local.clientId,
    day: local.day,
    date: local.date,
    mats: local.mats as unknown as Json,
    has_discrepancy: local.hasDiscrepancy,
    notes: local.notes,
    created_at: local.createdAt,
  }),
  toLocal: (remote) => ({
    id: remote.id!,
    clientId: remote.client_id!,
    day: remote.day!,
    date: remote.date!,
    mats: (remote.mats ?? []) as unknown as MatCount[],
    hasDiscrepancy: remote.has_discrepancy ?? false,
    notes: remote.notes ?? '',
    createdAt: remote.created_at ?? new Date().toISOString(),
  }),
}

// ── Debt Contacts ──

export const debtContactsAdapter: SyncAdapter<DebtContact, Insert<'debt_contacts'>> = {
  table: 'debt_contacts',
  toRemote: (local) => ({
    id: local.id,
    client_id: local.clientId,
    status: local.status,
    last_contacted_at: local.lastContactedAt ?? null,
    notes: local.notes as unknown as Json,
    updated_at: local.updatedAt,
  }),
  toLocal: (remote) => ({
    id: remote.id!,
    clientId: remote.client_id!,
    status: (remote.status ?? 'not_contacted') as DebtContactStatus,
    lastContactedAt: remote.last_contacted_at ?? null,
    notes: (remote.notes ?? []) as unknown as DebtContactNote[],
    updatedAt: remote.updated_at ?? new Date().toISOString(),
  }),
}

// ── Mat Inventory ──

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const matInventoryAdapter: SyncAdapter<any, Insert<'mat_inventory'>> = {
  table: 'mat_inventory',
  toRemote: (local: MatInventory) => ({
    id: local.sizeId,
    total_owned: local.totalOwned,
    in_laundry: local.inLaundry,
    damaged: local.damaged,
    wash_cycles: local.washCycles,
    max_wash_cycles: local.maxWashCycles,
  }),
  toLocal: (remote): MatInventory => ({
    sizeId: remote.id!,
    totalOwned: remote.total_owned ?? 0,
    inLaundry: remote.in_laundry ?? 0,
    damaged: remote.damaged ?? 0,
    washCycles: remote.wash_cycles ?? 0,
    maxWashCycles: remote.max_wash_cycles ?? 300,
  }),
}

// ── Mat Batches ──

export const matBatchesAdapter: SyncAdapter<MatBatch, Insert<'mat_batches'>> = {
  table: 'mat_batches',
  toRemote: (local) => ({
    id: local.id,
    size_id: local.sizeId,
    quantity: local.quantity,
    remaining: local.remaining,
    wash_cycles: local.washCycles,
    max_wash_cycles: local.maxWashCycles,
    purchased_at: local.purchasedAt,
  }),
  toLocal: (remote) => ({
    id: remote.id!,
    sizeId: remote.size_id!,
    quantity: remote.quantity ?? 0,
    remaining: remote.remaining ?? 0,
    washCycles: remote.wash_cycles ?? 0,
    maxWashCycles: remote.max_wash_cycles ?? 300,
    purchasedAt: remote.purchased_at ?? new Date().toISOString(),
  }),
}

// ── Inventory Transactions ──

export const inventoryTransactionsAdapter: SyncAdapter<InventoryTransaction, Insert<'inventory_transactions'>> = {
  table: 'inventory_transactions',
  toRemote: (local) => ({
    id: local.id,
    size_id: local.sizeId,
    type: local.type,
    quantity: local.quantity,
    notes: local.notes,
    created_at: local.createdAt,
  }),
  toLocal: (remote) => ({
    id: remote.id!,
    sizeId: remote.size_id!,
    type: remote.type! as TransactionType,
    quantity: remote.quantity ?? 0,
    notes: remote.notes ?? '',
    createdAt: remote.created_at ?? new Date().toISOString(),
  }),
}

// ── Route Stops (flat) ──

export interface RouteStopRemote {
  id: string
  day_route_id: string
  client_id: string
  driver_id?: string | null
  position: number
  is_completed: boolean
  skipped_until?: string | null
}

export function routeStopToRemote(
  stop: RouteStop,
  dayRouteId: string,
): Insert<'route_stops'> {
  return {
    id: stop.id,
    day_route_id: dayRouteId,
    client_id: stop.clientId,
    driver_id: stop.driverId ?? null,
    position: stop.position,
    is_completed: stop.isCompleted,
    skipped_until: stop.skippedUntil ?? null,
  }
}

export function routeStopToLocal(remote: Row<'route_stops'>): RouteStop {
  return {
    id: remote.id,
    clientId: remote.client_id,
    position: remote.position,
    isCompleted: remote.is_completed,
    driverId: remote.driver_id ?? undefined,
    skippedUntil: remote.skipped_until ?? undefined,
  }
}

export function dayRouteToRemote(day: number): Insert<'day_routes'> {
  return { day }
}
