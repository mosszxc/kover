import { RouterProvider } from "react-router"
import { router } from "@/app/router"
import { seedIfNeeded } from "@/app/seed"
import { applyStartMinimized } from "@/shared/lib/autostart"
import { checkForUpdates } from "@/shared/lib/updater"

seedIfNeeded()
applyStartMinimized()
checkForUpdates()

export function App() {
  return <RouterProvider router={router} />
}
