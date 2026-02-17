import { MapPin, Users, Warehouse, BarChart3 } from 'lucide-react'
import { Link } from 'react-router'
import { Button } from '@/shared/ui/button'

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
        <Button key={to} variant="outline" size="lg" asChild className="justify-start">
          <Link to={to}>
            <Icon className="size-4" />
            {label}
          </Link>
        </Button>
      ))}
    </div>
  )
}
