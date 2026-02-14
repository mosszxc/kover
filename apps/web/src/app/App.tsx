import { RouterProvider } from "react-router"
import { router } from "@/app/router"
import { seedIfNeeded } from "@/app/seed"
import { SyncProvider } from "@/shared/components/SyncProvider"

seedIfNeeded()

export function App() {
  return (
    <SyncProvider>
      <RouterProvider router={router} />
    </SyncProvider>
  )
}
