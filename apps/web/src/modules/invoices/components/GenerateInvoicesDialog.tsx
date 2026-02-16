import { useState, useMemo } from 'react'
import { FileSpreadsheet } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/shared/ui/dialog'
import { toast } from 'sonner'
import { useInvoiceSettingsStore } from '@/shared/stores/invoiceSettingsStore'
import { exportInvoices, formatPeriodLabel, type InvoiceData } from '../lib/generateInvoiceExcel'
import type { MatSizeConfig } from '@/shared/types'

interface ClientData {
  id: string
  name: string
  address: string
  mats: { size: string; quantity: number }[]
  frequency: number
  isActive: boolean
  customMonthlyPrice?: number | null
}

interface GenerateInvoicesDialogProps {
  clients: ClientData[]
  sizes: MatSizeConfig[]
}

function getCurrentPeriod(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export function GenerateInvoicesDialog({ clients, sizes }: GenerateInvoicesDialogProps) {
  const [open, setOpen] = useState(false)
  const [period, setPeriod] = useState(getCurrentPeriod)
  const [generating, setGenerating] = useState(false)
  const settings = useInvoiceSettingsStore()

  const priceMap = useMemo(
    () => Object.fromEntries(sizes.map((s) => [s.id, s.rentalPrice])),
    [sizes],
  )
  const labelMap = useMemo(
    () => Object.fromEntries(sizes.map((s) => [s.id, s.label])),
    [sizes],
  )
  const areaMap = useMemo(
    () => Object.fromEntries(sizes.map((s) => [s.id, s.area])),
    [sizes],
  )

  const hasPrices = useMemo(() => sizes.some((s) => s.rentalPrice > 0), [sizes])

  const activeClients = useMemo(
    () => clients.filter((c) => c.isActive),
    [clients],
  )

  const eligibleCount = useMemo(
    () => activeClients.filter((c) =>
      (c.customMonthlyPrice != null && c.customMonthlyPrice > 0) ||
      c.mats.some((m) => (priceMap[m.size] ?? 0) > 0),
    ).length,
    [activeClients, priceMap],
  )

  async function handleGenerate() {
    setGenerating(true)
    try {
      const prefix = settings.invoicePrefix || 'К'
      const periodDate = period.replace('-', '')

      const invoices: InvoiceData[] = []
      let counter = 1

      for (const client of activeClients) {
        if (client.customMonthlyPrice != null && client.customMonthlyPrice > 0) {
          invoices.push({
            invoiceNumber: `${prefix}-${periodDate}-${String(counter).padStart(3, '0')}`,
            date: new Date().toLocaleDateString('ru-RU'),
            period: formatPeriodLabel(period),
            clientName: client.name,
            clientAddress: client.address,
            customTotal: client.customMonthlyPrice,
            mats: [],
          })
          counter++
          continue
        }

        const matLines = client.mats
          .filter((m) => (priceMap[m.size] ?? 0) > 0)
          .map((m) => ({
            label: labelMap[m.size] ?? m.size,
            quantity: m.quantity,
            area: areaMap[m.size] ?? 0,
            pricePerUnit: priceMap[m.size] ?? 0,
            frequency: client.frequency,
          }))

        if (matLines.length === 0) continue

        invoices.push({
          invoiceNumber: `${prefix}-${periodDate}-${String(counter).padStart(3, '0')}`,
          date: new Date().toLocaleDateString('ru-RU'),
          period: formatPeriodLabel(period),
          clientName: client.name,
          clientAddress: client.address,
          mats: matLines,
        })
        counter++
      }

      if (invoices.length === 0) {
        toast.error('Нет клиентов с ценами для генерации счетов')
        return
      }

      await exportInvoices(invoices, settings, period)
      toast.success(`Сгенерировано ${invoices.length} счетов`)
      setOpen(false)
    } catch (err) {
      toast.error('Ошибка при генерации счетов')
      console.error(err)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5" disabled={!hasPrices}>
          <FileSpreadsheet className="size-4" />
          Счета
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Генерация счетов</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="invoice-period" className="text-sm text-muted-foreground">
              Период
            </label>
            <input
              id="invoice-period"
              type="month"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/50"
            />
          </div>
          <div className="rounded-lg border border-border p-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Активных клиентов:</span>
              <span className="font-medium">{activeClients.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">С ценами (для счетов):</span>
              <span className="font-medium">{eligibleCount}</span>
            </div>
          </div>
          {!settings.companyName && (
            <p className="text-xs text-amber-400">
              Реквизиты не заполнены. Счета будут без данных поставщика.
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Отмена</Button>
          <Button onClick={handleGenerate} disabled={generating || eligibleCount === 0}>
            {generating ? 'Генерация...' : `Сформировать ${eligibleCount} счетов`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
