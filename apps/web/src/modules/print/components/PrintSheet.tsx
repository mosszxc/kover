import type { DayOfWeek, MatSize } from '@/shared/types'
import type { RouteStop } from '@/modules/routes'
import type { Client } from '@/modules/clients'
import { MAT_AREA } from '@/shared/types'

const DAY_LABELS_FULL: Record<DayOfWeek, string> = {
  0: 'Понедельник',
  1: 'Вторник',
  2: 'Среда',
  3: 'Четверг',
  4: 'Пятница',
}

const MAT_SIZES: MatSize[] = ['180', '150', '60x80', '400', '250']

interface PrintSheetProps {
  stops: RouteStop[]
  clients: Client[]
  selectedDay: DayOfWeek
}

function getMatQuantity(client: Client, size: MatSize): number {
  return client.mats
    .filter((m) => m.size === size)
    .reduce((sum, m) => sum + m.quantity, 0)
}

function getClientArea(client: Client): number {
  return client.mats.reduce((sum, m) => m.quantity * MAT_AREA[m.size] + sum, 0)
}

function formatDate(): string {
  return new Date().toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function PrintSheet({ stops, clients, selectedDay }: PrintSheetProps) {
  const clientMap = new Map(clients.map((c) => [c.id, c]))

  const sortedStops = [...stops].sort((a, b) => a.position - b.position)

  const rows = sortedStops.map((stop) => {
    const client = clientMap.get(stop.clientId)
    return { stop, client }
  })

  const totals = {
    mats: Object.fromEntries(
      MAT_SIZES.map((size) => [
        size,
        rows.reduce((sum, { client }) => {
          if (!client) return sum
          return sum + getMatQuantity(client, size)
        }, 0),
      ]),
    ) as Record<MatSize, number>,
    area: rows.reduce((sum, { client }) => {
      if (!client) return sum
      return sum + getClientArea(client)
    }, 0),
  }

  return (
    <div className="hidden print:block">
      <h1>{DAY_LABELS_FULL[selectedDay]}, {formatDate()}</h1>

      <table className="print-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Название</th>
            <th>180</th>
            <th>150</th>
            <th>60x80</th>
            <th>400</th>
            <th>250</th>
            <th>Кв.м</th>
            <th>✓</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ stop, client }, index) => (
            <tr key={stop.id}>
              <td>{index + 1}</td>
              <td>{client?.originalName ?? '—'}</td>
              {MAT_SIZES.map((size) => {
                const qty = client ? getMatQuantity(client, size) : 0
                return <td key={size}>{qty > 0 ? qty : ''}</td>
              })}
              <td>{client ? getClientArea(client).toFixed(1) : ''}</td>
              <td>
                <span className="print-checkbox" />
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td />
            <td><strong>Итого</strong></td>
            {MAT_SIZES.map((size) => (
              <td key={size}>
                <strong>{totals.mats[size] > 0 ? totals.mats[size] : ''}</strong>
              </td>
            ))}
            <td>
              <strong>{totals.area.toFixed(1)}</strong>
            </td>
            <td />
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
