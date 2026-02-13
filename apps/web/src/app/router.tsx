import { createBrowserRouter, Navigate } from "react-router"
import { AppLayout } from "@/app/layout/AppLayout"
import { RoutesPage } from "@/pages/RoutesPage"
import { ClientsPage } from "@/pages/ClientsPage"
import { ImportPage } from "@/pages/ImportPage"

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
        path: "*",
        element: <Navigate to="/" replace />,
      },
    ],
  },
])
