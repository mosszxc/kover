import type { SheetData } from '../types'
import type { DayOfWeek } from '@/shared/types'
import { DAY_LABELS_FULL } from '@/shared/types'
import type { Client, MatSpec } from '@/modules/clients'
import type { Driver } from '@/modules/drivers'
import type { DayRoute } from '@/modules/routes'
import type { MatSizeConfig } from '@/shared/types'
import type { ServiceLogEntry } from '@/shared/stores/serviceLogStore'

interface BuildExportSheetsParams {
  clients: Client[]
  drivers: Driver[]
  routes: DayRoute[]
  matSizes: MatSizeConfig[]
  serviceLog: ServiceLogEntry[]
}

function formatMats(mats: MatSpec[], labelMap: Map<string, string>): string {
  return mats.map((m) => `${labelMap.get(m.size) ?? m.size} x${m.quantity}`).join(', ')
}

function formatMatColors(mats: MatSpec[]): string {
  return mats
    .filter((m) => m.color)
    .map((m) => `${m.size}: ${m.color}`)
    .join(', ')
}

function stopStatus(stop: { isCompleted: boolean; skippedUntil?: string }): string {
  if (stop.isCompleted) return 'Выполнено'
  if (stop.skippedUntil && new Date(stop.skippedUntil) > new Date()) return 'Пропущено'
  return ''
}

function matArea(sizeId: string, areaMap: Map<string, number>): number {
  return areaMap.get(sizeId) ?? 0
}

function stopMatsText(clientMats: MatSpec[], labelMap: Map<string, string>): string {
  return clientMats.map((m) => `${labelMap.get(m.size) ?? m.size} x${m.quantity}`).join(', ')
}

function stopTotalArea(clientMats: MatSpec[], areaMap: Map<string, number>): number {
  return clientMats.reduce((sum, m) => sum + matArea(m.size, areaMap) * m.quantity, 0)
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  completed: 'Выполнено',
  removed: 'Удалено',
  transferred: 'Перенесено',
  paused: 'Пауза',
  unpaused: 'Снятие паузы',
  skipped: 'Пропуск',
}

export function buildExportSheets({
  clients,
  drivers,
  routes,
  matSizes,
  serviceLog,
}: BuildExportSheetsParams): SheetData[] {
  const clientMap = new Map(clients.map((c) => [c.id, c]))
  const driverMap = new Map(drivers.map((d) => [d.id, d.name]))
  const areaMap = new Map(matSizes.map((s) => [s.id, s.area]))
  const labelMap = new Map(matSizes.map((s) => [s.id, s.label]))

  // 1. Клиенты
  const clientSheet: SheetData = {
    name: 'Клиенты',
    header: [
      'Имя', 'Адрес', 'Коврики', 'Цвет ковриков', 'Дни обслуживания', 'Частота',
      'Заметки', 'Активен', 'Часы работы', 'Пауза до', 'Координаты', 'Дата создания',
    ],
    rows: clients.map((c) => [
      c.name,
      c.address,
      formatMats(c.mats, labelMap),
      formatMatColors(c.mats),
      c.days.map((d) => DAY_LABELS_FULL[d as DayOfWeek]).join(', '),
      c.frequency,
      c.notes,
      c.isActive ? 'Да' : 'Нет',
      c.workingHoursStart && c.workingHoursEnd
        ? `${c.workingHoursStart}–${c.workingHoursEnd}`
        : '',
      c.pausedUntil ?? '',
      c.lat != null && c.lng != null ? `${c.lat}, ${c.lng}` : '',
      c.createdAt ? new Date(c.createdAt).toLocaleDateString('ru-RU') : '',
    ]),
  }

  // 2. Водители
  const driverSheet: SheetData = {
    name: 'Водители',
    header: ['Имя', 'Телефон', 'Рабочие дни', 'Активен'],
    rows: drivers.map((d) => [
      d.name,
      d.phone,
      d.workDays.map((day) => DAY_LABELS_FULL[day as DayOfWeek]).join(', '),
      d.isActive ? 'Да' : 'Нет',
    ]),
  }

  // 3. Маршруты (расширенный)
  const routeSheet: SheetData = {
    name: 'Маршруты',
    header: ['День', 'Позиция', 'Клиент', 'Водитель', 'Статус', 'Коврики', 'Площадь (м²)'],
    rows: routes.flatMap((route) =>
      route.stops.map((stop) => {
        const client = clientMap.get(stop.clientId)
        const mats = client?.mats ?? []
        return [
          DAY_LABELS_FULL[route.day as DayOfWeek],
          stop.position + 1,
          client?.name ?? stop.clientId,
          stop.driverId ? (driverMap.get(stop.driverId) ?? stop.driverId) : '',
          stopStatus(stop),
          stopMatsText(mats, labelMap),
          Math.round(stopTotalArea(mats, areaMap) * 100) / 100,
        ]
      }),
    ),
  }

  // 4. Размеры ковриков
  const matSizeSheet: SheetData = {
    name: 'Размеры ковриков',
    header: ['ID', 'Название', 'Площадь (м²)'],
    rows: matSizes.map((s) => [s.id, s.label, s.area]),
  }

  // 5. Журнал обслуживания
  const serviceLogSheet: SheetData = {
    name: 'Журнал обслуживания',
    header: ['Дата', 'Клиент', 'День', 'Тип события', 'Водитель'],
    rows: serviceLog.map((entry) => [
      new Date(entry.timestamp).toLocaleDateString('ru-RU'),
      clientMap.get(entry.clientId)?.name ?? entry.clientId,
      DAY_LABELS_FULL[entry.day as DayOfWeek],
      EVENT_TYPE_LABELS[entry.type] ?? entry.type,
      entry.driverName ?? '',
    ]),
  }

  // 6. Сводка
  const summaryRows: (string | number)[][] = []

  // 6a. Коврики в обороте по размерам
  summaryRows.push(['— Коврики в обороте —', '', ''])
  summaryRows.push(['Размер', 'Количество', 'Площадь (м²)'])
  const matTotals = new Map<string, { qty: number; area: number }>()
  for (const c of clients) {
    if (!c.isActive) continue
    for (const m of c.mats) {
      const prev = matTotals.get(m.size) ?? { qty: 0, area: 0 }
      const a = matArea(m.size, areaMap)
      matTotals.set(m.size, { qty: prev.qty + m.quantity, area: prev.area + a * m.quantity })
    }
  }
  let totalQty = 0
  let totalArea = 0
  for (const [sizeId, { qty, area }] of matTotals) {
    const label = matSizes.find((s) => s.id === sizeId)?.label ?? sizeId
    summaryRows.push([label, qty, Math.round(area * 100) / 100])
    totalQty += qty
    totalArea += area
  }
  summaryRows.push(['ИТОГО', totalQty, Math.round(totalArea * 100) / 100])

  // 6b. Нагрузка по дням
  summaryRows.push(['', '', ''])
  summaryRows.push(['— Нагрузка по дням —', '', ''])
  summaryRows.push(['День', 'Остановок', 'Площадь (м²)'])
  for (const route of routes) {
    let dayArea = 0
    for (const stop of route.stops) {
      const mats = clientMap.get(stop.clientId)?.mats ?? []
      dayArea += stopTotalArea(mats, areaMap)
    }
    summaryRows.push([
      DAY_LABELS_FULL[route.day as DayOfWeek],
      route.stops.length,
      Math.round(dayArea * 100) / 100,
    ])
  }

  // 6c. Нагрузка по водителям
  summaryRows.push(['', '', ''])
  summaryRows.push(['— Нагрузка по водителям —', '', ''])
  summaryRows.push(['Водитель', 'Остановок', 'Площадь (м²)'])
  const driverLoad = new Map<string, { stops: number; area: number }>()
  for (const route of routes) {
    for (const stop of route.stops) {
      const driverName = stop.driverId
        ? (driverMap.get(stop.driverId) ?? stop.driverId)
        : 'Без водителя'
      const prev = driverLoad.get(driverName) ?? { stops: 0, area: 0 }
      const mats = clientMap.get(stop.clientId)?.mats ?? []
      driverLoad.set(driverName, {
        stops: prev.stops + 1,
        area: prev.area + stopTotalArea(mats, areaMap),
      })
    }
  }
  for (const [name, { stops, area }] of driverLoad) {
    summaryRows.push([name, stops, Math.round(area * 100) / 100])
  }

  const summarySheet: SheetData = {
    name: 'Сводка',
    header: ['', '', ''],
    rows: summaryRows,
  }

  return [clientSheet, driverSheet, routeSheet, matSizeSheet, serviceLogSheet, summarySheet]
}
