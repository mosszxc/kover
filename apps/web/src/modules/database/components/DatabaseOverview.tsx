import { Download, FileDown, Users, Truck, Ruler, MapPin } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import type { DatabaseStats, SheetData } from '../types'
import type { MatSizeConfig } from '@/shared/types'
import { exportToExcel } from '../lib/exportExcel'
import { buildTemplateSheets } from '../lib/buildTemplateSheets'

interface DatabaseOverviewProps {
  stats: DatabaseStats
  sheets: SheetData[]
  matSizes: MatSizeConfig[]
  importButton?: React.ReactNode
}

function StatCard({ icon: Icon, label, value, sub }: {
  icon: React.ElementType
  label: string
  value: number
  sub?: string
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>
        <div>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
          {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
        </div>
      </div>
    </div>
  )
}

export function DatabaseOverview({ stats, sheets, matSizes, importButton }: DatabaseOverviewProps) {
  const handleExport = async () => {
    const date = new Date().toISOString().slice(0, 10)
    await exportToExcel(sheets, `kover-export-${date}.xlsx`)
  }

  const handleDownloadTemplate = async () => {
    const templateSheets = buildTemplateSheets(matSizes)
    await exportToExcel(templateSheets, 'kover-template.xlsx')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">База данных</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleDownloadTemplate} className="gap-2">
            <FileDown className="h-4 w-4" />
            Скачать шаблон
          </Button>
          {importButton}
          <Button onClick={handleExport} className="gap-2">
            <Download className="h-4 w-4" />
            Выгрузить в Excel
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={Users}
          label="Клиенты"
          value={stats.clients}
          sub={`${stats.activeClients} активных`}
        />
        <StatCard
          icon={Truck}
          label="Водители"
          value={stats.drivers}
          sub={`${stats.activeDrivers} активных`}
        />
        <StatCard
          icon={Ruler}
          label="Размеры ковриков"
          value={stats.matSizes}
        />
        <StatCard
          icon={MapPin}
          label="Остановок в маршрутах"
          value={stats.totalStops}
        />
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <h2 className="mb-2 text-sm font-medium text-muted-foreground">
          Содержимое выгрузки
        </h2>
        <ul className="space-y-1 text-sm text-foreground">
          {sheets.map((sheet) => (
            <li key={sheet.name} className="flex items-center justify-between">
              <span>{sheet.name}</span>
              <span className="text-muted-foreground">
                {sheet.rows.length} {pluralRows(sheet.rows.length)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function pluralRows(n: number): string {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod100 >= 11 && mod100 <= 19) return 'записей'
  if (mod10 === 1) return 'запись'
  if (mod10 >= 2 && mod10 <= 4) return 'записи'
  return 'записей'
}
