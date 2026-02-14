import { RouterProvider } from "react-router"
import { router } from "@/app/router"
import { seedIfNeeded } from "@/app/seed"
import { useAuthListener } from "@/shared/lib/auth"

seedIfNeeded()

export function App() {
  useAuthListener()
  return <RouterProvider router={router} />
}
