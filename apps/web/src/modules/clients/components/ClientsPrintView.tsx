import type { PaymentInfo } from './ClientsTable'
import type { Client } from '../types'

interface ClientsPrintViewProps {
  clients: Client[]
  paymentInfoMap?: Map<string, PaymentInfo>
  title?: string
}

const STATUS_LABELS: Record<string, string> = {
  paid: 'Оплачен',
  partial: 'Частично',
  overdue: 'Просрочен',
  pending: 'Ожидает',
}

export function ClientsPrintView({ clients, paymentInfoMap, title }: ClientsPrintViewProps) {
  if (clients.length === 0) return null

  const now = new Date()
  const dateStr = now.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="hidden print:block">
      <div className="mb-4">
        <h1 className="text-lg font-bold">{title ?? 'Список клиентов'}</h1>
        <p className="text-sm text-gray-500">{dateStr} — {clients.length} клиент(ов)</p>
      </div>

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b-2 border-black">
            <th className="py-1 pr-2 text-left font-semibold">№</th>
            <th className="py-1 pr-2 text-left font-semibold">Клиент</th>
            <th className="py-1 pr-2 text-left font-semibold">Адрес</th>
            {paymentInfoMap && (
              <>
                <th className="py-1 pr-2 text-right font-semibold">Долг</th>
                <th className="py-1 pr-2 text-left font-semibold">Статус</th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {clients.map((client, i) => {
            const payment = paymentInfoMap?.get(client.id)
            return (
              <tr key={client.id} className="border-b border-gray-300">
                <td className="py-1 pr-2 tabular-nums">{i + 1}</td>
                <td className="py-1 pr-2">{client.name}</td>
                <td className="py-1 pr-2 text-gray-600">{client.address}</td>
                {paymentInfoMap && (
                  <>
                    <td className="py-1 pr-2 text-right tabular-nums">
                      {payment && payment.debt > 0
                        ? `${payment.debt.toLocaleString('ru-RU')} ₽`
                        : '—'}
                    </td>
                    <td className="py-1 pr-2">
                      {payment ? STATUS_LABELS[payment.status] ?? payment.status : '—'}
                    </td>
                  </>
                )}
              </tr>
            )
          })}
        </tbody>
      </table>

      {paymentInfoMap && (() => {
        const totalDebt = clients.reduce((sum, c) => {
          const info = paymentInfoMap.get(c.id)
          return sum + (info?.debt ?? 0)
        }, 0)
        return totalDebt > 0 ? (
          <div className="mt-3 text-right text-sm font-semibold">
            Итого долг: {totalDebt.toLocaleString('ru-RU')} ₽
          </div>
        ) : null
      })()}
    </div>
  )
}
