import type { SyncAdapter } from './types'
import type { Client, MatSpec } from '@/modules/clients/types'
import type { Driver } from '@/modules/drivers/types'
import type { RouteStop } from '@/modules/routes/types'
import type { MatSizeConfig, DayOfWeek } from '@/shared/types'
import type { ChangeLogEntry } from '@/shared/stores/changelogStore'
import type { ServiceLogEntry } from '@/shared/stores/serviceLogStore'
import type { Database } from '@/shared/types/database'

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
  }),
  toLocal: (remote) => ({
    id: remote.id!,
    label: remote.label!,
    area: remote.area!,
    rentalPrice: remote.rental_price ?? 0,
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
    workDays: (remote.work_days ?? [0, 1, 2, 3, 4]) as DayOfWeek[],
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
    is_active: local.isActive,
    paused_until: local.pausedUntil ?? null,
    lat: local.lat ?? null,
    lng: local.lng ?? null,
    working_hours_start: local.workingHoursStart ?? null,
    working_hours_end: local.workingHoursEnd ?? null,
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
    isActive: remote.is_active ?? true,
    pausedUntil: (remote.paused_until as string) ?? null,
    lat: remote.lat ?? undefined,
    lng: remote.lng ?? undefined,
    workingHoursStart: remote.working_hours_start ?? null,
    workingHoursEnd: remote.working_hours_end ?? null,
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
