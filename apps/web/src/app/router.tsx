import { lazy, Suspense } from "react"
import { createBrowserRouter, Navigate } from "react-router"
import { AppLayout } from "@/app/layout/AppLayout"
import { RoutesPage } from "@/pages/RoutesPage"
import { ClientsPage } from "@/pages/ClientsPage"
import { DriversPage } from "@/pages/DriversPage"
import { SettingsPage } from "@/pages/SettingsPage"
import { MatSizesPage } from "@/pages/MatSizesPage"
import { LoadingFallback } from "@/shared/components/LoadingFallback"

const ImportPage = lazy(() =>
  import("@/pages/ImportPage").then((m) => ({ default: m.ImportPage })),
)
const StatsPage = lazy(() =>
  import("@/pages/StatsPage").then((m) => ({ default: m.StatsPage })),
)
const MapPage = lazy(() =>
  import("@/pages/MapPage").then((m) => ({ default: m.MapPage })),
)
const DatabasePage = lazy(() =>
  import("@/pages/DatabasePage").then((m) => ({ default: m.DatabasePage })),
)

function LazyPage({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<LoadingFallback />}>{children}</Suspense>
}

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
        children: [
          {
            path: "/",
            element: <RoutesPage />,
          },
          {
            path: "/clients",
            element: <ClientsPage />,
          },
          {
            path: "/drivers",
            element: <DriversPage />,
          },
          {
            path: "/mat-sizes",
            element: <MatSizesPage />,
          },
          {
            path: "/settings",
            element: <SettingsPage />,
          },
          {
            path: "/import",
            element: (
              <LazyPage>
                <ImportPage />
              </LazyPage>
            ),
          },
          {
            path: "/stats",
            element: (
              <LazyPage>
                <StatsPage />
              </LazyPage>
            ),
          },
          {
            path: "/map",
            element: (
              <LazyPage>
                <MapPage />
              </LazyPage>
            ),
          },
          {
            path: "/database",
            element: (
              <LazyPage>
                <DatabasePage />
              </LazyPage>
            ),
          },
          {
            path: "*",
            element: <Navigate to="/" replace />,
          },
    ],
  },
])
