import { useEffect } from "react"
import { Rocket, Bug, Zap } from "lucide-react"
import { Badge } from "@/shared/ui/badge"
import { releases } from "virtual:changelog"
import { useWhatsNewStore } from "../store"

const typeConfig: Record<string, { label: string; icon: typeof Rocket; variant: "default" | "secondary" | "outline" }> = {
  feature: { label: "Новое", icon: Rocket, variant: "default" },
  fix: { label: "Исправление", icon: Bug, variant: "secondary" },
  improvement: { label: "Улучшение", icon: Zap, variant: "outline" },
}

type Release = (typeof releases)[number]

function ReleaseCard({ release }: { release: Release }) {
  const formattedDate = new Date(release.date).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  return (
    <div className="space-y-3">
      <div className="flex items-baseline gap-3">
        <h2 className="text-lg font-semibold text-foreground">v{release.version}</h2>
        <span className="text-sm text-muted-foreground">{formattedDate}</span>
      </div>
      <ul className="space-y-2">
        {release.items.map((item, i) => {
          const config = typeConfig[item.type] ?? { label: "Улучшение", icon: Zap, variant: "outline" as const }
          const Icon = config.icon
          return (
            <li key={i} className="flex items-start gap-2">
              <Badge variant={config.variant} className="shrink-0 gap-1 mt-0.5">
                <Icon className="h-3 w-3" />
                {config.label}
              </Badge>
              <span className="text-sm text-foreground">{item.text}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export function WhatsNewContent() {
  const setLastSeenVersion = useWhatsNewStore((s) => s.setLastSeenVersion)

  useEffect(() => {
    const latest = releases[0]
    if (latest) {
      setLastSeenVersion(latest.version)
    }
  }, [setLastSeenVersion])

  return (
    <div className="space-y-8">
      {releases.map((release) => (
        <ReleaseCard key={release.version} release={release} />
      ))}
    </div>
  )
}
