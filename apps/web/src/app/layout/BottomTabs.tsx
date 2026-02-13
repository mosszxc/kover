import { NavLink } from "react-router"
import { MapPin, Users } from "lucide-react"
import { cn } from "@/shared/lib/utils"

const navItems = [
  { to: "/", label: "Маршрут", icon: MapPin },
  { to: "/clients", label: "Клиенты", icon: Users },
] as const

export function BottomTabs() {
  return (
    <nav className="no-print md:hidden fixed bottom-0 inset-x-0 z-50 bg-slate-900 border-t border-slate-700 flex">
      {navItems.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === "/"}
          className={({ isActive }) =>
            cn(
              "flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors duration-150 cursor-pointer",
              isActive
                ? "text-white"
                : "text-slate-400"
            )
          }
        >
          <Icon className="h-5 w-5" />
          {label}
        </NavLink>
      ))}
    </nav>
  )
}
