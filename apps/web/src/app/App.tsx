import { useEffect, useState } from "react"
import { RouterProvider } from "react-router"
import { router } from "@/app/router"
import { MaintenancePage } from "@/app/MaintenancePage"
import { applyStartMinimized } from "@/shared/lib/autostart"
import { checkForUpdates } from "@/shared/lib/updater"
import { fetchMaintenanceConfig, type MaintenanceConfig } from "@/shared/lib/maintenance"
import { useSettingsStore } from "@/shared/stores/settingsStore"

applyStartMinimized()
checkForUpdates()

// Apply persisted theme on load
const theme = useSettingsStore.getState().theme
document.documentElement.classList.toggle('dark', theme === 'dark')

export function App() {
  const [maintenance, setMaintenance] = useState<MaintenanceConfig | null>(null)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    fetchMaintenanceConfig().then((config) => {
      setMaintenance(config)
      setChecked(true)
    })
  }, [])

  if (!checked) return null

  if (maintenance?.enabled) {
    return <MaintenancePage config={maintenance} />
  }

  return <RouterProvider router={router} />
}
