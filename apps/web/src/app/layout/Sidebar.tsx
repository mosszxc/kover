import { NavLink } from "react-router"
import { MapPin, Users, BarChart3, Map, Truck, Settings, Ruler, Database, BookOpen, Warehouse, Sun } from "lucide-react"
import { cn } from "@/shared/lib/utils"

const mainItems = [
  { to: "/briefing", label: "Сегодня", icon: Sun },
  { to: "/", label: "Маршрут", icon: MapPin },
  { to: "/map", label: "Карта", icon: Map },
  { to: "/clients", label: "Клиенты", icon: Users },
] as const

const managementItems = [
  { to: "/drivers", label: "Водители", icon: Truck },
  { to: "/mat-sizes", label: "Размеры", icon: Ruler },
  { to: "/inventory", label: "Инвентарь", icon: Warehouse },
  { to: "/stats", label: "Статистика", icon: BarChart3 },
] as const

const systemItems = [
  { to: "/database", label: "База данных", icon: Database },
  { to: "/guide", label: "Справка", icon: BookOpen },
  { to: "/settings", label: "Настройки", icon: Settings },
] as const

function NavGroup({ label, items }: { label: string; items: ReadonlyArray<{ to: string; label: string; icon: React.ComponentType<{ className?: string }> }> }) {
  return (
    <div>
      <div className="px-3 py-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
        {label}
      </div>
      <div className="space-y-1">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors duration-150 cursor-pointer",
                isActive
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )
            }
          >
            <Icon className="h-5 w-5 shrink-0" />
            {label}
          </NavLink>
        ))}
      </div>
    </div>
  )
}

export function Sidebar() {
  return (
    <aside className="no-print hidden md:flex md:w-60 md:flex-col md:fixed md:inset-y-0 bg-card border-r border-border">
      <div className="flex h-14 items-center px-4">
        <span className="text-lg font-bold text-foreground">Kover</span>
      </div>

      <nav className="flex-1 flex flex-col px-2 py-2">
        <NavGroup label="Основные" items={mainItems} />
        <div className="my-2 mx-3 border-t border-border" />
        <NavGroup label="Управление" items={managementItems} />
        <div className="mt-auto">
          <div className="my-2 mx-3 border-t border-border" />
          <NavGroup label="Система" items={systemItems} />
        </div>
      </nav>
    </aside>
  )
}
