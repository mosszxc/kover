import { Outlet } from "react-router"
import { Sidebar } from "./Sidebar"
import { TopBar } from "./TopBar"
import { BottomTabs } from "./BottomTabs"

export function AppLayout() {
  return (
    <div className="min-h-screen bg-slate-950">
      <Sidebar />

      <div className="md:pl-60 flex flex-col min-h-screen">
        <TopBar />

        <main className="flex-1 p-4 md:p-6 pb-20 md:pb-6">
          <Outlet />
        </main>
      </div>

      <BottomTabs />
    </div>
  )
}
