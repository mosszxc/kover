import { NavLink } from "react-router"
import { MapPin, Users, BarChart3, Map, Truck, Settings, Ruler, Database, BookOpen, Warehouse, Sun } from "lucide-react"
import { cn } from "@/shared/lib/utils"

const navItems = [
  { to: "/briefing", label: "Сегодня", icon: Sun },
  { to: "/", label: "Маршрут", icon: MapPin },
  { to: "/map", label: "Карта", icon: Map },
  { to: "/clients", label: "Клиенты", icon: Users },
  { to: "/drivers", label: "Водители", icon: Truck },
  { to: "/mat-sizes", label: "Размеры", icon: Ruler },
  { to: "/inventory", label: "Инвентарь", icon: Warehouse },
  { to: "/stats", label: "Статистика", icon: BarChart3 },
  { to: "/database", label: "База данных", icon: Database },
  { to: "/guide", label: "Справка", icon: BookOpen },
  { to: "/settings", label: "Настройки", icon: Settings },
] as const

export function Sidebar() {
  return (
    <aside className="no-print hidden md:flex md:w-60 md:flex-col md:fixed md:inset-y-0 bg-card border-r border-border">
      <div className="flex h-14 items-center px-4">
        <span className="text-lg font-bold text-foreground">Kover</span>
      </div>

      <nav className="flex-1 px-2 py-2 space-y-1">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors duration-150 cursor-pointer",
                isActive
                  ? "bg-muted text-white"
                  : "text-muted-foreground hover:bg-muted hover:text-white"
              )
            }
          >
            <Icon className="h-5 w-5 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
