import { RouterProvider } from "react-router"
import { router } from "@/app/router"
import { seedIfNeeded } from "@/app/seed"

seedIfNeeded()

export function App() {
  return <RouterProvider router={router} />
}
