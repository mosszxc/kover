import { utils, writeFile, write } from 'xlsx'
import { isTauri } from '@/shared/lib/platform'
import type { InvoiceSettings } from '@/shared/stores/invoiceSettingsStore'

interface MatLine {
  label: string
  quantity: number
  area: number
  pricePerUnit: number
  frequency: number
}

export interface InvoiceData {
  invoiceNumber: string
  date: string
  period: string
  clientName: string
  clientAddress: string
  mats: MatLine[]
}

const WEEKS_PER_MONTH = 4.33
const MONTHS_RU = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь']

export function formatPeriodLabel(period: string): string {
  const [y, m] = period.split('-')
  const monthIdx = parseInt(m ?? '1', 10) - 1
  return `${MONTHS_RU[monthIdx] ?? m} ${y}`
}

function buildInvoiceSheet(invoice: InvoiceData, settings: InvoiceSettings) {
  const rows: (string | number)[][] = []

  rows.push([`Счёт ${invoice.invoiceNumber} от ${invoice.date}`])
  rows.push([])

  if (settings.companyName) {
    rows.push(['Поставщик:', settings.companyName])
    if (settings.inn) rows.push(['ИНН:', settings.inn])
    if (settings.bankName) rows.push(['Банк:', settings.bankName])
    if (settings.bankAccount) rows.push(['Р/с:', settings.bankAccount])
    if (settings.bik) rows.push(['БИК:', settings.bik])
    if (settings.corrAccount) rows.push(['К/с:', settings.corrAccount])
    rows.push([])
  }

  rows.push(['Покупатель:', invoice.clientName])
  if (invoice.clientAddress) rows.push(['Адрес:', invoice.clientAddress])
  rows.push(['Период:', invoice.period])
  rows.push([])

  rows.push(['№', 'Наименование', 'Кол-во', 'Площадь м²', 'Цена/шт', 'Частота/нед', 'Визитов/мес', 'Сумма'])

  let total = 0
  invoice.mats.forEach((mat, i) => {
    const visitsPerMonth = Math.round(mat.frequency * WEEKS_PER_MONTH * 100) / 100
    const lineTotal = Math.round(mat.quantity * mat.pricePerUnit * visitsPerMonth * 100) / 100
    total += lineTotal
    rows.push([
      i + 1,
      `Коврик ${mat.label}`,
      mat.quantity,
      Math.round(mat.area * mat.quantity * 100) / 100,
      mat.pricePerUnit,
      mat.frequency,
      visitsPerMonth,
      lineTotal,
    ])
  })

  rows.push([])
  rows.push(['', '', '', '', '', '', 'ИТОГО:', Math.round(total * 100) / 100])

  return rows
}

export async function exportInvoices(invoices: InvoiceData[], settings: InvoiceSettings, period: string) {
  const workbook = utils.book_new()

  if (invoices.length === 1) {
    const rows = buildInvoiceSheet(invoices[0]!, settings)
    const ws = utils.aoa_to_sheet(rows)
    ws['!cols'] = [{ wch: 5 }, { wch: 25 }, { wch: 8 }, { wch: 12 }, { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 12 }]
    utils.book_append_sheet(workbook, ws, 'Счёт')
  } else {
    // Summary sheet
    const summary: (string | number)[][] = [
      ['Счета за период:', formatPeriodLabel(period)],
      [],
      ['№ счёта', 'Клиент', 'Адрес', 'Сумма'],
    ]
    for (const inv of invoices) {
      const total = inv.mats.reduce((sum, m) => {
        const visits = Math.round(m.frequency * WEEKS_PER_MONTH * 100) / 100
        return sum + Math.round(m.quantity * m.pricePerUnit * visits * 100) / 100
      }, 0)
      summary.push([inv.invoiceNumber, inv.clientName, inv.clientAddress, Math.round(total * 100) / 100])
    }
    const grandTotal = invoices.reduce((sum, inv) => {
      return sum + inv.mats.reduce((s, m) => {
        const visits = Math.round(m.frequency * WEEKS_PER_MONTH * 100) / 100
        return s + Math.round(m.quantity * m.pricePerUnit * visits * 100) / 100
      }, 0)
    }, 0)
    summary.push([])
    summary.push(['', '', 'ИТОГО:', Math.round(grandTotal * 100) / 100])

    const summaryWs = utils.aoa_to_sheet(summary)
    summaryWs['!cols'] = [{ wch: 15 }, { wch: 30 }, { wch: 30 }, { wch: 12 }]
    utils.book_append_sheet(workbook, summaryWs, 'Сводка')

    // Individual sheets (max 30 to avoid Excel limits)
    const maxSheets = Math.min(invoices.length, 30)
    for (let i = 0; i < maxSheets; i++) {
      const inv = invoices[i]!
      const rows = buildInvoiceSheet(inv, settings)
      const ws = utils.aoa_to_sheet(rows)
      ws['!cols'] = [{ wch: 5 }, { wch: 25 }, { wch: 8 }, { wch: 12 }, { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 12 }]
      const sheetName = inv.clientName.slice(0, 28).replace(/[\\/*?[\]:]/g, '_')
      utils.book_append_sheet(workbook, ws, sheetName)
    }
  }

  const filename = `Счета_${period}.xlsx`

  if (isTauri()) {
    const { tauriSaveFile } = await import('@/shared/lib/tauri-fs')
    const buffer = write(workbook, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer
    const data = new Uint8Array(buffer)
    await tauriSaveFile(data, filename, [{ name: 'Excel', extensions: ['xlsx'] }])
    return
  }

  writeFile(workbook, filename)
}
