import { WhatsNewContent } from "@/modules/whats-new"

export function WhatsNewPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-8 p-6">
      <h1 className="text-2xl font-bold text-foreground">Нововведения</h1>
      <WhatsNewContent />
    </div>
  )
}
