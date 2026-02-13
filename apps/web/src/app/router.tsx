import { lazy, Suspense } from "react"
import { createBrowserRouter, Navigate } from "react-router"
import { AppLayout } from "@/app/layout/AppLayout"
import { RoutesPage } from "@/pages/RoutesPage"
import { ClientsPage } from "@/pages/ClientsPage"
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
        path: "*",
        element: <Navigate to="/" replace />,
      },
    ],
  },
])
