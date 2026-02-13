import { useState, useCallback } from 'react'
import { Upload, FileSpreadsheet, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/shared/ui/button'
import { parseExcel } from '../utils/parseExcel'
import { parseClientName } from '../lib/parse-client-name'
import type { ParsedClient } from '../types'
import type { DayOfWeek } from '@/shared/types'

interface ExcelUploadProps {
  onParsed: (data: {
    clients: ParsedClient[]
    routesByDay: Record<DayOfWeek, string[]>
  }) => void
}

export function ExcelUpload({ onParsed }: ExcelUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const processFile = useCallback(
    async (file: File) => {
      if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
        toast.error('Поддерживаются только файлы .xlsx')
        return
      }

      setIsLoading(true)
      try {
        const parsed = await parseExcel(file)
        const clients = parsed.masterRows
          .map((row) => row[0] ?? '')
          .filter((name) => name.trim().length > 0)
          .map((name) => parseClientName(name))

        onParsed({ clients, routesByDay: parsed.routesByDay })
      } catch {
        toast.error('Ошибка при чтении файла')
      } finally {
        setIsLoading(false)
      }
    },
    [onParsed],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) processFile(file)
    },
    [processFile],
  )

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
    e.target.value = ''
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-3 rounded-lg border border-dashed border-slate-600 p-12">
        <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
        <span className="text-slate-400">Обработка файла...</span>
      </div>
    )
  }

  return (
    <div
      className={`flex flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed p-12 transition-colors ${
        isDragging
          ? 'border-blue-500 bg-blue-500/5'
          : 'border-slate-600 hover:border-slate-500'
      }`}
      onDragOver={(e) => {
        e.preventDefault()
        setIsDragging(true)
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      <FileSpreadsheet className="h-10 w-10 text-slate-500" />
      <p className="text-sm text-slate-400">
        Перетащите файл .xlsx сюда или выберите вручную
      </p>
      <label>
        <Button variant="outline" asChild>
          <span>
            <Upload className="h-4 w-4" />
            Выбрать файл
          </span>
        </Button>
        <input
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={handleFileChange}
        />
      </label>
    </div>
  )
}
