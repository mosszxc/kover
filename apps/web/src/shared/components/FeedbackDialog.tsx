import { MessageSquare, Send } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/dialog'

const TELEGRAM_URL = 'https://t.me/mosszxc'

export function FeedbackDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Обратная связь"
        >
          <MessageSquare className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Обратная связь</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Нашли баг или есть предложение? Напишите в Telegram:
        </p>
        <a
          href={TELEGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-500 w-fit"
        >
          <Send className="size-4" />
          @mosszxc
        </a>
      </DialogContent>
    </Dialog>
  )
}
