import { MapPin, Users, Warehouse, BarChart3 } from 'lucide-react'
import { Link } from 'react-router'

const links = [
  { to: '/', label: 'Маршрут', icon: MapPin },
  { to: '/clients', label: 'Клиенты', icon: Users },
  { to: '/inventory', label: 'Инвентарь', icon: Warehouse },
  { to: '/stats', label: 'Статистика', icon: BarChart3 },
] as const

export function QuickLinks() {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {links.map(({ to, label, icon: Icon }) => (
        <Link
          key={to}
          to={to}
          className="flex items-center gap-2 rounded-lg border border-border bg-card p-3 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <Icon className="size-4" />
          {label}
        </Link>
      ))}
    </div>
  )
}
