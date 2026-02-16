import { GuideContent } from "@/modules/guide"

export function GuidePage() {
  return (
    <div className="mx-auto max-w-2xl space-y-8 p-6">
      <h1 className="text-2xl font-bold text-foreground">Справка</h1>
      <GuideContent />
    </div>
  )
}
