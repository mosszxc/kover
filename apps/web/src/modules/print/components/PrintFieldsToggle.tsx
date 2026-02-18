import { Check } from 'lucide-react'
import { usePrintSettingsStore } from '../store'

const FIELD_LABELS: Record<string, string> = {
  phone: 'Телефон',
}

export function PrintFieldsToggle() {
  const columns = usePrintSettingsStore((s) => s.columns)
  const setColumn = usePrintSettingsStore((s) => s.setColumn)

  return (
    <div className="space-y-1">
      <p className="text-sm font-medium">Поля в печати</p>
      {(Object.keys(FIELD_LABELS) as Array<keyof typeof columns>).map((key) => (
        <button
          key={key}
          type="button"
          onClick={() => setColumn(key, !columns[key])}
          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
        >
          <span className="flex h-4 w-4 items-center justify-center rounded border border-primary">
            {columns[key] && <Check className="h-3 w-3 text-primary" />}
          </span>
          {FIELD_LABELS[key]}
        </button>
      ))}
    </div>
  )
}
