import { createBrowserRouter, Navigate } from "react-router"
import { AppLayout } from "@/app/layout/AppLayout"
import { RoutesPage } from "@/pages/RoutesPage"
import { ClientsPage } from "@/pages/ClientsPage"
import { ImportPage } from "@/pages/ImportPage"
import { StatsPage } from "@/pages/StatsPage"

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
        element: <ImportPage />,
      },
      {
        path: "/stats",
        element: <StatsPage />,
      },
      {
        path: "*",
        element: <Navigate to="/" replace />,
      },
    ],
  },
])
