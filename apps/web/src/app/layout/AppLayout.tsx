import { Suspense } from "react"
import { Outlet } from "react-router"
import { Sidebar } from "./Sidebar"
import { TopBar } from "./TopBar"
import { BottomTabs } from "./BottomTabs"
import { Toaster } from "@/shared/ui/sonner"
import { ErrorBoundary } from "@/shared/components/ErrorBoundary"
import { LoadingFallback } from "@/shared/components/LoadingFallback"
import { useChangeLogger } from "@/shared/hooks/useChangeLogger"
import { useAutoBackup } from "@/shared/hooks/useAutoBackup"
import { useFileSync } from "@/shared/hooks/useFileSync"
import { useSyncProvider } from "@/shared/lib/sync"

export function AppLayout() {
  useChangeLogger()
  useAutoBackup()
  useFileSync()
  useSyncProvider()

  return (
    <div className="print-root min-h-screen bg-background">
      <Sidebar />

      <div className="print-content md:pl-60 flex flex-col min-h-screen">
        <TopBar />

        <main className="flex-1 p-4 md:p-6 lg:p-8 pb-20 md:pb-6 lg:pb-8">
          <ErrorBoundary>
            <Suspense fallback={<LoadingFallback />}>
              <Outlet />
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>

      <BottomTabs />
      <Toaster />
    </div>
  )
}
