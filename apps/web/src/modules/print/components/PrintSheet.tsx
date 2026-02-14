import type { DayOfWeek, MatSizeConfig } from '@/shared/types'
import type { RouteStop } from '@/modules/routes'
import type { Client } from '@/modules/clients'
import { getClientReplacements } from '@/modules/clients'
import { useMatSizeStore } from '@/shared/stores/matSizeStore'

const DAY_LABELS_FULL: Record<DayOfWeek, string> = {
  0: 'Понедельник',
  1: 'Вторник',
  2: 'Среда',
  3: 'Четверг',
  4: 'Пятница',
  5: 'Суббота',
  6: 'Воскресенье',
}

interface DriverInfo {
  id: string
  name: string
}

interface PrintSheetProps {
  stops: RouteStop[]
  clients: Client[]
  selectedDay: DayOfWeek
  drivers?: DriverInfo[]
}

function getMatQuantity(client: Client, sizeId: string, day: DayOfWeek): number {
  const replacements = getClientReplacements(client, day)
  return client.mats
    .filter((m) => m.size === sizeId)
    .reduce((sum, m) => sum + m.quantity, 0) * replacements
}

function formatDate(): string {
  return new Date().toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

interface PrintTableProps {
  title: string
  rows: { stop: RouteStop; client: Client | undefined }[]
  sizes: MatSizeConfig[]
  day: DayOfWeek
}

function PrintTable({ title, rows, sizes, day }: PrintTableProps) {
  const totals = Object.fromEntries(
    sizes.map((s) => [
      s.id,
      rows.reduce((sum, { client }) => {
        if (!client) return sum
        return sum + getMatQuantity(client, s.id, day)
      }, 0),
    ]),
  ) as Record<string, number>

  return (
    <>
      <h1 className="print-header">{title}</h1>

      <table className="print-table">
        <thead>
          <tr>
            <th className="num">#</th>
            <th className="col-name">Название</th>
            {sizes.map((s) => (
              <th key={s.id} className="num">{s.label}</th>
            ))}
            <th className="num">&#10003;</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ stop, client }, index) => (
            <tr key={stop.id}>
              <td className="num stop-num">{index + 1}</td>
              <td>{client?.originalName ?? '—'}</td>
              {sizes.map((s) => {
                const qty = client ? getMatQuantity(client, s.id, day) : 0
                return <td key={s.id} className="num">{qty > 0 ? qty : ''}</td>
              })}
              <td className="num">
                <span className="print-checkbox" />
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td className="num" />
            <td>Итого: {rows.length} точек</td>
            {sizes.map((s) => (
              <td key={s.id} className="num">
                {(totals[s.id] ?? 0) > 0 ? totals[s.id] : ''}
              </td>
            ))}
            <td />
          </tr>
        </tfoot>
      </table>
    </>
  )
}

export function PrintSheet({ stops, clients, selectedDay, drivers = [] }: PrintSheetProps) {
  const sizes = useMatSizeStore((s) => s.sizes)
  const clientMap = new Map(clients.map((c) => [c.id, c]))
  const sortedStops = [...stops].sort((a, b) => a.position - b.position)
  const dateStr = formatDate()
  const dayLabel = DAY_LABELS_FULL[selectedDay]

  const toRows = (filtered: RouteStop[]) =>
    filtered.map((stop) => ({ stop, client: clientMap.get(stop.clientId) }))

  // No drivers — single sheet (legacy behavior)
  if (drivers.length === 0) {
    return (
      <div className="hidden print:block">
        <PrintTable
          title={`${dayLabel}, ${dateStr}`}
          rows={toRows(sortedStops)}
          sizes={sizes}
          day={selectedDay}
        />
      </div>
    )
  }

  // Group stops by driver
  const driverMap = new Map(drivers.map((d) => [d.id, d.name]))
  const groups: { key: string; label: string; stops: RouteStop[] }[] = []

  // Per-driver groups
  for (const driver of drivers) {
    const driverStops = sortedStops.filter((s) => s.driverId === driver.id)
    if (driverStops.length > 0) {
      groups.push({ key: driver.id, label: driver.name, stops: driverStops })
    }
  }

  // Unassigned group
  const unassigned = sortedStops.filter((s) => !s.driverId || !driverMap.has(s.driverId))
  if (unassigned.length > 0) {
    groups.push({ key: '__unassigned', label: 'Нераспределённые', stops: unassigned })
  }

  return (
    <div className="hidden print:block">
      {groups.map((group, i) => (
        <div key={group.key} className={i > 0 ? 'print-page-break' : undefined}>
          <PrintTable
            title={`${group.label} — ${dayLabel}, ${dateStr}`}
            rows={toRows(group.stops)}
            sizes={sizes}
            day={selectedDay}
          />
        </div>
      ))}
    </div>
  )
}
