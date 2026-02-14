import type { CollectionAdapter } from './types'
import type { MatSizeConfig } from '@/shared/types'
import type { Client } from '@/modules/clients/types'
import type { Driver } from '@/modules/drivers/types'
import type { DayRoute, RouteStop } from '@/modules/routes/types'
import type { ChangeLogEntry } from '@/shared/stores/changelogStore'
import type { DayOfWeek } from '@/shared/types'

// ─── mat_sizes ───────────────────────────────────────────────

interface MatSizeState {
  sizes: MatSizeConfig[]
}

export const matSizesAdapter: CollectionAdapter<MatSizeState> = {
  collection: 'mat_sizes',

  toRecords: (state) =>
    state.sizes.map((s) => ({ id: s.id, label: s.label, area: s.area })),

  fromRecords: (records) => ({
    sizes: records.map((r) => ({
      id: r.id,
      label: r['label'] as string,
      area: r['area'] as number,
    })),
  }),

  toBody: (item) => ({
    label: item.label,
    area: item.area,
  }),
}

// ─── settings ────────────────────────────────────────────────

interface SettingsState {
  geocodeCity: string
  fileSyncEnabled: boolean
}

// Settings is a singleton — we use a fixed ID
const SETTINGS_ID = 'app_settings'

export const settingsAdapter: CollectionAdapter<SettingsState> = {
  collection: 'settings',

  toRecords: (state) => [
    {
      id: SETTINGS_ID,
      geocodeCity: state.geocodeCity,
      fileSyncEnabled: state.fileSyncEnabled,
    },
  ],

  fromRecords: (records) => {
    const r = records[0]
    if (!r) return {}
    return {
      geocodeCity: r['geocodeCity'] as string,
      fileSyncEnabled: r['fileSyncEnabled'] as boolean,
    }
  },

  toBody: (item) => ({
    geocodeCity: item.geocodeCity,
    fileSyncEnabled: item.fileSyncEnabled,
  }),
}

// ─── drivers ─────────────────────────────────────────────────

interface DriverState {
  drivers: Driver[]
}

export const driversAdapter: CollectionAdapter<DriverState> = {
  collection: 'drivers',

  toRecords: (state) =>
    state.drivers.map((d) => ({
      id: d.id,
      name: d.name,
      phone: d.phone,
      isActive: d.isActive,
      workDays: d.workDays,
    })),

  fromRecords: (records) => ({
    drivers: records.map((r) => ({
      id: r.id,
      name: r['name'] as string,
      phone: r['phone'] as string,
      isActive: r['isActive'] as boolean,
      workDays: r['workDays'] as DayOfWeek[],
      createdAt: r['created'] as string,
    })),
  }),

  toBody: (item) => ({
    name: item.name,
    phone: item.phone,
    isActive: item.isActive,
    workDays: item.workDays,
  }),
}

// ─── clients ─────────────────────────────────────────────────

interface ClientState {
  clients: Client[]
}

export const clientsAdapter: CollectionAdapter<ClientState> = {
  collection: 'clients',

  toRecords: (state) =>
    state.clients.map((c) => ({
      id: c.id,
      name: c.name,
      originalName: c.originalName,
      address: c.address,
      mats: c.mats,
      frequency: c.frequency,
      days: c.days,
      dayReplacements: c.dayReplacements,
      notes: c.notes,
      isActive: c.isActive,
      lat: c.lat,
      lng: c.lng,
    })),

  fromRecords: (records) => ({
    clients: records.map((r) => ({
      id: r.id,
      name: r['name'] as string,
      originalName: (r['originalName'] as string) || '',
      address: (r['address'] as string) || '',
      mats: (r['mats'] as Client['mats']) || [],
      frequency: (r['frequency'] as number) || 1,
      days: (r['days'] as DayOfWeek[]) || [],
      dayReplacements: r['dayReplacements'] as Client['dayReplacements'],
      notes: (r['notes'] as string) || '',
      isActive: r['isActive'] as boolean,
      createdAt: r['created'] as string,
      lat: r['lat'] as number | undefined,
      lng: r['lng'] as number | undefined,
    })),
  }),

  toBody: (item) => ({
    name: item.name,
    originalName: item.originalName,
    address: item.address,
    mats: item.mats,
    frequency: item.frequency,
    days: item.days,
    dayReplacements: item.dayReplacements,
    notes: item.notes,
    isActive: item.isActive,
    lat: item.lat,
    lng: item.lng,
  }),
}

// ─── changelog ───────────────────────────────────────────────

interface ChangeLogState {
  entries: ChangeLogEntry[]
}

export const changelogAdapter: CollectionAdapter<ChangeLogState> = {
  collection: 'changelog',

  toRecords: (state) =>
    state.entries.map((e) => ({
      id: e.id,
      type: e.type,
      action: e.action,
      description: e.description,
    })),

  fromRecords: (records) => ({
    entries: records.map((r) => ({
      id: r.id,
      timestamp: r['created'] as string,
      type: r['type'] as 'route' | 'client',
      action: r['action'] as string,
      description: (r['description'] as string) || '',
    })),
  }),

  toBody: (item) => ({
    type: item.type,
    action: item.action,
    description: item.description,
  }),
}

// ─── routes (day_routes + route_stops) ───────────────────────
// This is the complex one: Zustand has DayRoute[] with embedded stops,
// PocketBase has day_routes + route_stops (normalized with relations).
// We handle this as TWO separate sync registrations.

interface RouteState {
  routes: DayRoute[]
}

/** day_routes adapter — syncs the 7 day containers */
export const dayRoutesAdapter: CollectionAdapter<RouteState> = {
  collection: 'day_routes',

  toRecords: (state) =>
    state.routes.map((r) => ({
      id: `day_${r.day}`,
      day: r.day,
    })),

  fromRecords: (_records) => {
    // day_routes hydration is handled together with route_stops
    // This adapter is mainly for write-through of day containers
    return {}
  },

  toBody: (item) => ({
    day: item.day,
  }),
}

/** route_stops adapter — syncs individual stops with dayRoute relations */
export const routeStopsAdapter: CollectionAdapter<RouteState> = {
  collection: 'route_stops',

  toRecords: (state) => {
    const records: ({ id: string } & Record<string, unknown>)[] = []
    for (const route of state.routes) {
      const dayRouteId = `day_${route.day}`
      for (const stop of route.stops) {
        records.push({
          id: stop.id,
          dayRoute: dayRouteId,
          client: stop.clientId,
          driver: stop.driverId || '',
          position: stop.position,
          isCompleted: stop.isCompleted,
          skippedUntil: stop.skippedUntil || '',
        })
      }
    }
    return records
  },

  fromRecords: (records) => {
    // Group stops by dayRoute
    const dayMap = new Map<string, RouteStop[]>()

    for (const r of records) {
      const dayRouteId = r['dayRoute'] as string
      const stop: RouteStop = {
        id: r.id,
        clientId: r['client'] as string,
        position: r['position'] as number,
        isCompleted: r['isCompleted'] as boolean,
        driverId: (r['driver'] as string) || undefined,
        skippedUntil: (r['skippedUntil'] as string) || undefined,
      }

      const existing = dayMap.get(dayRouteId) || []
      existing.push(stop)
      dayMap.set(dayRouteId, existing)
    }

    // Build DayRoute[] for all 7 days
    const routes: DayRoute[] = []
    for (let day = 0; day <= 6; day++) {
      const dayRouteId = `day_${day}`
      const stops = (dayMap.get(dayRouteId) || []).sort((a, b) => a.position - b.position)
      routes.push({ day: day as DayOfWeek, stops })
    }

    return { routes }
  },

  toBody: (item) => ({
    dayRoute: item.dayRoute,
    client: item.client,
    driver: item.driver || '',
    position: item.position,
    isCompleted: item.isCompleted,
    skippedUntil: item.skippedUntil || '',
  }),
}
