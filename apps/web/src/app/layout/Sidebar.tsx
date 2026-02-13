import { NavLink } from "react-router"
import { MapPin, Users } from "lucide-react"
import { cn } from "@/shared/lib/utils"

const navItems = [
  { to: "/", label: "Маршрут", icon: MapPin },
  { to: "/clients", label: "Клиенты", icon: Users },
] as const

export function Sidebar() {
  return (
    <aside className="hidden md:flex md:w-60 md:flex-col md:fixed md:inset-y-0 bg-slate-900 border-r border-slate-700">
      <div className="flex h-14 items-center px-4">
        <span className="text-lg font-bold text-slate-50">Kover</span>
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
                  ? "bg-slate-800 text-white"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
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
