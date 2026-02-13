import { Outlet } from "react-router"
import { Sidebar } from "./Sidebar"
import { TopBar } from "./TopBar"
import { BottomTabs } from "./BottomTabs"

export function AppLayout() {
  return (
    <div className="min-h-screen bg-slate-950 print:bg-white">
      <Sidebar />

      <div className="md:pl-60 print:pl-0 flex flex-col min-h-screen">
        <TopBar />

        <main className="flex-1 p-4 md:p-6 pb-20 md:pb-6 print:p-0">
          <Outlet />
        </main>
      </div>

      <BottomTabs />
    </div>
  )
}
