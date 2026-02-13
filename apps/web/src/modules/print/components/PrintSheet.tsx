import type { DayOfWeek, MatSize } from '@/shared/types'
import type { RouteStop } from '@/modules/routes'
import type { Client } from '@/modules/clients'
import { MAT_SIZES } from '@/shared/types'

const DAY_LABELS_FULL: Record<DayOfWeek, string> = {
  0: 'Понедельник',
  1: 'Вторник',
  2: 'Среда',
  3: 'Четверг',
  4: 'Пятница',
}


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

  const totals = Object.fromEntries(
    MAT_SIZES.map((size) => [
      size,
      rows.reduce((sum, { client }) => {
        if (!client) return sum
        return sum + getMatQuantity(client, size)
      }, 0),
    ]),
  ) as Record<MatSize, number>

  return (
    <div className="hidden print:block">
      <h1 className="print-header">{DAY_LABELS_FULL[selectedDay]}, {formatDate()}</h1>

      <table className="print-table">
        <thead>
          <tr>
            <th className="num">#</th>
            <th className="col-name">Название</th>
            {MAT_SIZES.map((size) => (
              <th key={size} className="num">{size}</th>
            ))}
            <th className="num">✓</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ stop, client }, index) => (
            <tr key={stop.id}>
              <td className="num">{index + 1}</td>
              <td>{client?.originalName ?? '—'}</td>
              {MAT_SIZES.map((size) => {
                const qty = client ? getMatQuantity(client, size) : 0
                return <td key={size} className="num">{qty > 0 ? qty : ''}</td>
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
            {MAT_SIZES.map((size) => (
              <td key={size} className="num">
                {(totals[size] ?? 0) > 0 ? totals[size] : ''}
              </td>
            ))}
            <td />
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
