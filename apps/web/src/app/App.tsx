import { Button } from "@/shared/ui/button"

export function App() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-6">
        <h1 className="text-2xl font-bold text-foreground">Kover</h1>
        <p className="text-muted-foreground">
          Система управления маршрутами
        </p>
        <Button>Начать</Button>
      </div>
    </div>
  )
}
