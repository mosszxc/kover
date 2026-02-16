import { read, utils } from 'xlsx'
import type { DayOfWeek } from '@/shared/types'
import { DAY_LABELS_FULL } from '@/shared/types'
import type { Client, MatSpec } from '@/modules/clients'
import type { Driver } from '@/modules/drivers'
import type { DayRoute, RouteStop } from '@/modules/routes'
import type { MatSizeConfig } from '@/shared/types'

export interface ImportData {
  clients: Client[]
  drivers: Driver[]
  routes: DayRoute[]
  matSizes: MatSizeConfig[]
}

export interface ImportDiff {
  clients: DiffResult<Client>
  drivers: DiffResult<Driver>
  routes: RouteDiffResult
  matSizes: DiffResult<MatSizeConfig>
}

export interface DiffResult<T> {
  added: T[]
  changed: { old: T; new: T }[]
  removed: T[]
  unchanged: number
}

export interface RouteDiffResult {
  addedStops: number
  removedStops: number
  changedStops: number
  unchangedStops: number
}

const DAY_NAME_TO_INDEX: Record<string, DayOfWeek> = Object.fromEntries(
  Object.entries(DAY_LABELS_FULL).map(([k, v]) => [v, Number(k) as DayOfWeek]),
) as Record<string, DayOfWeek>

export interface ImportError {
  sheet: string
  row: number
  message: string
}

export interface ParseResult {
  data: ImportData
  errors: ImportError[]
}

function getRows(workbook: ReturnType<typeof read>, sheetName: string): string[][] {
  const sheet = workbook.Sheets[sheetName]
  if (!sheet) return []
  return utils.sheet_to_json<string[]>(sheet, { header: 1, raw: false, defval: '' })
}

/** Build a column name → index map from header row */
function headerMap(rows: string[][]): Map<string, number> {
  const map = new Map<string, number>()
  const header = rows[0]
  if (!header) return map
  for (let i = 0; i < header.length; i++) {
    const name = header[i]?.trim()
    if (name) map.set(name, i)
  }
  return map
}

/** Get cell value by column name, with optional fallback */
function cell(row: string[], col: Map<string, number>, name: string, fallback = ''): string {
  const idx = col.get(name)
  if (idx === undefined) return fallback
  return row[idx]?.trim() ?? fallback
}

function parseMats(matsStr: string, matSizes: MatSizeConfig[]): MatSpec[] {
  if (!matsStr.trim()) return []
  const labelToId = new Map(matSizes.map((s) => [s.label, s.id]))
  const validIds = new Set(matSizes.map((s) => s.id))

  return matsStr.split(',').map((part) => {
    const trimmed = part.trim()
    // Format: "400 x2" or "60×80 x1"
    const match = trimmed.match(/^(.+?)\s*[xх×](\d+)$/i)
    const raw = match ? match[1]!.trim() : trimmed
    const quantity = match ? parseInt(match[2]!, 10) : 1
    // Try label first, then direct ID match, then raw as fallback
    const sizeId = labelToId.get(raw) ?? (validIds.has(raw) ? raw : raw)
    return { size: sizeId, quantity }
  }).filter((m) => m.size)
}

function parseDays(daysStr: string): DayOfWeek[] {
  if (!daysStr.trim()) return []
  return daysStr
    .split(',')
    .map((d) => DAY_NAME_TO_INDEX[d.trim()])
    .filter((d): d is DayOfWeek => d !== undefined)
}

export function parseExcelImport(buffer: ArrayBuffer): ParseResult {
  const workbook = read(buffer, { type: 'array' })
  const errors: ImportError[] = []

  // 1. Parse mat sizes first (needed for client mats parsing)
  const matSizeRows = getRows(workbook, 'Размеры ковриков')
  const matSizes: MatSizeConfig[] = []
  const msCol = headerMap(matSizeRows)
  if (matSizeRows.length > 1) {
    for (let i = 1; i < matSizeRows.length; i++) {
      const row = matSizeRows[i]!
      const id = cell(row, msCol, 'ID')
      const label = cell(row, msCol, 'Название')
      const area = parseFloat(cell(row, msCol, 'Площадь (м²)'))
      if (!id) {
        errors.push({ sheet: 'Размеры ковриков', row: i + 1, message: 'Пустой ID' })
        continue
      }
      if (!label) {
        errors.push({ sheet: 'Размеры ковриков', row: i + 1, message: 'Пустое название' })
        continue
      }
      if (isNaN(area)) {
        errors.push({ sheet: 'Размеры ковриков', row: i + 1, message: 'Невалидная площадь' })
        continue
      }
      const rentalPrice = parseFloat(cell(row, msCol, 'Цена (₽)')) || 0
      matSizes.push({ id, label, area, rentalPrice })
    }
  }

  // 2. Parse drivers
  const driverRows = getRows(workbook, 'Водители')
  const drivers: Driver[] = []
  const drCol = headerMap(driverRows)
  if (driverRows.length > 1) {
    for (let i = 1; i < driverRows.length; i++) {
      const row = driverRows[i]!
      const name = cell(row, drCol, 'Имя')
      if (!name) {
        errors.push({ sheet: 'Водители', row: i + 1, message: 'Пустое имя' })
        continue
      }
      drivers.push({
        id: crypto.randomUUID(),
        name,
        phone: cell(row, drCol, 'Телефон'),
        workDays: parseDays(cell(row, drCol, 'Рабочие дни')),
        isActive: cell(row, drCol, 'Активен', 'Да') !== 'Нет',
        createdAt: new Date().toISOString(),
      })
    }
  }

  // 3. Parse clients (header-aware — handles both old and new export formats)
  const clientRows = getRows(workbook, 'Клиенты')
  const clients: Client[] = []
  const clCol = headerMap(clientRows)
  if (clientRows.length > 1) {
    for (let i = 1; i < clientRows.length; i++) {
      const row = clientRows[i]!
      const name = cell(row, clCol, 'Имя')
      if (!name) {
        errors.push({ sheet: 'Клиенты', row: i + 1, message: 'Пустое имя' })
        continue
      }
      clients.push({
        id: crypto.randomUUID(),
        originalName: name,
        name,
        address: cell(row, clCol, 'Адрес'),
        mats: parseMats(cell(row, clCol, 'Коврики'), matSizes),
        days: parseDays(cell(row, clCol, 'Дни обслуживания')),
        frequency: parseInt(cell(row, clCol, 'Частота'), 10) || 1,
        notes: cell(row, clCol, 'Заметки'),
        isActive: cell(row, clCol, 'Активен', 'Да') !== 'Нет',
        createdAt: new Date().toISOString(),
      })
    }
  }

  // 4. Parse routes
  const routeRows = getRows(workbook, 'Маршруты')
  const routes: DayRoute[] = [
    { day: 0, stops: [] },
    { day: 1, stops: [] },
    { day: 2, stops: [] },
    { day: 3, stops: [] },
    { day: 4, stops: [] },
    { day: 5, stops: [] },
    { day: 6, stops: [] },
  ]

  const clientNameToId = new Map(clients.map((c) => [c.name, c.id]))
  const driverNameToId = new Map(drivers.map((d) => [d.name, d.id]))
  const rtCol = headerMap(routeRows)

  if (routeRows.length > 1) {
    for (let i = 1; i < routeRows.length; i++) {
      const row = routeRows[i]!
      const dayName = cell(row, rtCol, 'День')
      const position = parseInt(cell(row, rtCol, 'Позиция'), 10)
      const clientName = cell(row, rtCol, 'Клиент')
      const driverName = cell(row, rtCol, 'Водитель')

      if (!dayName || !clientName) {
        errors.push({ sheet: 'Маршруты', row: i + 1, message: 'Пустой день или клиент' })
        continue
      }

      const dayIndex = DAY_NAME_TO_INDEX[dayName]
      if (dayIndex === undefined) {
        errors.push({ sheet: 'Маршруты', row: i + 1, message: `Неизвестный день: ${dayName}` })
        continue
      }

      const clientId = clientNameToId.get(clientName)
      if (!clientId) {
        errors.push({ sheet: 'Маршруты', row: i + 1, message: `Клиент не найден: ${clientName}` })
        continue
      }

      const route = routes.find((r) => r.day === dayIndex)!
      const stop: RouteStop = {
        id: crypto.randomUUID(),
        clientId,
        position: isNaN(position) ? route.stops.length : position - 1,
        isCompleted: false,
        driverId: driverName ? driverNameToId.get(driverName) : undefined,
      }
      route.stops.push(stop)
    }

    // Normalize positions
    for (const route of routes) {
      route.stops.sort((a, b) => a.position - b.position)
      route.stops.forEach((s, i) => { s.position = i })
    }
  }

  return { data: { clients, drivers, routes, matSizes }, errors }
}

export function computeDiff(
  imported: ImportData,
  current: {
    clients: Client[]
    drivers: Driver[]
    routes: DayRoute[]
    matSizes: MatSizeConfig[]
  },
): ImportDiff {
  return {
    clients: diffByName(imported.clients, current.clients),
    drivers: diffByName(imported.drivers, current.drivers),
    matSizes: diffMatSizes(imported.matSizes, current.matSizes),
    routes: diffRoutes(imported.routes, current.routes, imported.clients, current.clients),
  }
}

function diffByName<T extends { name: string }>(imported: T[], current: T[]): DiffResult<T> {
  const currentMap = new Map(current.map((item) => [item.name, item]))
  const added: T[] = []
  const changed: { old: T; new: T }[] = []
  const matchedNames = new Set<string>()

  for (const item of imported) {
    const existing = currentMap.get(item.name)
    if (!existing) {
      added.push(item)
    } else {
      matchedNames.add(item.name)
      if (hasRelevantChanges(item, existing)) {
        changed.push({ old: existing, new: item })
      }
    }
  }

  const importedNames = new Set(imported.map((i) => i.name))
  const removed = current.filter((c) => !importedNames.has(c.name))
  const unchanged = matchedNames.size - changed.length

  return { added, changed, removed, unchanged }
}

function hasRelevantChanges<T extends Record<string, unknown>>(imported: T, current: T): boolean {
  // Compare relevant fields, ignoring id, createdAt, originalName
  const skip = new Set(['id', 'createdAt', 'originalName', 'lat', 'lng', 'pausedUntil', 'workingHoursStart', 'workingHoursEnd', 'dayReplacements'])
  for (const key of Object.keys(imported)) {
    if (skip.has(key)) continue
    const a = JSON.stringify(imported[key])
    const b = JSON.stringify(current[key])
    if (a !== b) return true
  }
  return false
}

function diffMatSizes(imported: MatSizeConfig[], current: MatSizeConfig[]): DiffResult<MatSizeConfig> {
  const currentMap = new Map(current.map((s) => [s.id, s]))
  const added: MatSizeConfig[] = []
  const changed: { old: MatSizeConfig; new: MatSizeConfig }[] = []
  const matchedIds = new Set<string>()

  for (const item of imported) {
    const existing = currentMap.get(item.id)
    if (!existing) {
      added.push(item)
    } else {
      matchedIds.add(item.id)
      if (existing.label !== item.label || existing.area !== item.area || existing.rentalPrice !== item.rentalPrice) {
        changed.push({ old: existing, new: item })
      }
    }
  }

  const importedIds = new Set(imported.map((i) => i.id))
  const removed = current.filter((c) => !importedIds.has(c.id))
  const unchanged = matchedIds.size - changed.length

  return { added, changed, removed, unchanged }
}

function diffRoutes(
  imported: DayRoute[],
  current: DayRoute[],
  importedClients: Client[],
  currentClients: Client[],
): RouteDiffResult {
  // Compare routes by (day, clientName, position)
  const importedClientMap = new Map(importedClients.map((c) => [c.id, c.name]))
  const currentClientMap = new Map(currentClients.map((c) => [c.id, c.name]))

  type StopKey = string
  function makeKey(day: DayOfWeek, clientName: string, position: number): StopKey {
    return `${day}:${clientName}:${position}`
  }

  const currentStopKeys = new Set<StopKey>()
  let currentTotal = 0
  for (const route of current) {
    for (const stop of route.stops) {
      const name = currentClientMap.get(stop.clientId) ?? stop.clientId
      currentStopKeys.add(makeKey(route.day, name, stop.position))
      currentTotal++
    }
  }

  let matched = 0
  let importedTotal = 0
  for (const route of imported) {
    for (const stop of route.stops) {
      importedTotal++
      const name = importedClientMap.get(stop.clientId) ?? stop.clientId
      if (currentStopKeys.has(makeKey(route.day, name, stop.position))) {
        matched++
      }
    }
  }

  return {
    addedStops: Math.max(0, importedTotal - matched),
    removedStops: Math.max(0, currentTotal - matched),
    changedStops: 0,
    unchangedStops: matched,
  }
}

export function applyImport(
  importData: ImportData,
  currentClients: Client[],
  currentDrivers: Driver[],
): ImportData {
  // Preserve IDs for matched entities (by name), assign new IDs for new ones
  const clientNameToId = new Map(currentClients.map((c) => [c.name, c]))
  const driverNameToId = new Map(currentDrivers.map((d) => [d.name, d]))

  const clientIdMap = new Map<string, string>() // importedId → finalId
  const driverIdMap = new Map<string, string>()

  const finalClients = importData.clients.map((c) => {
    const existing = clientNameToId.get(c.name)
    const finalId = existing?.id ?? c.id
    clientIdMap.set(c.id, finalId)
    return {
      ...c,
      id: finalId,
      // Preserve fields not in Excel
      originalName: existing?.originalName ?? c.name,
      createdAt: existing?.createdAt ?? c.createdAt,
      lat: existing?.lat,
      lng: existing?.lng,
      pausedUntil: existing?.pausedUntil,
      workingHoursStart: existing?.workingHoursStart,
      workingHoursEnd: existing?.workingHoursEnd,
      dayReplacements: existing?.dayReplacements,
    }
  })

  const finalDrivers = importData.drivers.map((d) => {
    const existing = driverNameToId.get(d.name)
    const finalId = existing?.id ?? d.id
    driverIdMap.set(d.id, finalId)
    return {
      ...d,
      id: finalId,
      createdAt: existing?.createdAt ?? d.createdAt,
    }
  })

  const finalRoutes = importData.routes.map((route) => ({
    ...route,
    stops: route.stops.map((stop) => ({
      ...stop,
      clientId: clientIdMap.get(stop.clientId) ?? stop.clientId,
      driverId: stop.driverId ? (driverIdMap.get(stop.driverId) ?? stop.driverId) : undefined,
    })),
  }))

  return { clients: finalClients, drivers: finalDrivers, routes: finalRoutes, matSizes: importData.matSizes }
}
