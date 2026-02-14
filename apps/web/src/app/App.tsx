import { RouterProvider } from "react-router"
import { router } from "@/app/router"
import { seedIfNeeded } from "@/app/seed"
import { applyStartMinimized } from "@/shared/lib/autostart"

seedIfNeeded()
applyStartMinimized()

export function App() {
  return <RouterProvider router={router} />
}
