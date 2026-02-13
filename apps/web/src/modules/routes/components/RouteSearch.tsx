import { Search } from 'lucide-react'

interface RouteSearchProps {
  value: string
  onChange: (value: string) => void
}

export function RouteSearch({ value, onChange }: RouteSearchProps) {
  return (
    <div className="relative print:hidden">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Поиск по маршруту..."
        className="h-11 w-full rounded-md border border-slate-700 bg-slate-900 pl-9 pr-3 text-sm text-slate-50 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors"
      />
    </div>
  )
}
