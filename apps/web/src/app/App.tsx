import { RouterProvider } from "react-router"
import { router } from "@/app/router"
import { seedIfNeeded } from "@/app/seed"
import { applyStartMinimized } from "@/shared/lib/autostart"
import { checkForUpdates } from "@/shared/lib/updater"
import { useSettingsStore } from "@/shared/stores/settingsStore"

seedIfNeeded()
applyStartMinimized()
checkForUpdates()

// Apply persisted theme on load
const theme = useSettingsStore.getState().theme
document.documentElement.classList.toggle('dark', theme === 'dark')

export function App() {
  return <RouterProvider router={router} />
}
