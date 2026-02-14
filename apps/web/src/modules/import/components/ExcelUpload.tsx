import { useState, useCallback } from 'react'
import { Upload, FileSpreadsheet, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/shared/ui/button'
import { isTauri } from '@/shared/lib/platform'
import { parseExcel, parseExcelFromBuffer } from '../utils/parseExcel'
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

  const handleParsed = useCallback(
    (parsed: { masterRows: string[][]; routesByDay: Record<DayOfWeek, string[]> }) => {
      const clients = parsed.masterRows
        .map((row) => row[0] ?? '')
        .filter((name) => name.trim().length > 0)
        .map((name) => parseClientName(name))

      onParsed({ clients, routesByDay: parsed.routesByDay })
    },
    [onParsed],
  )

  const processFile = useCallback(
    async (file: File) => {
      if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
        toast.error('Поддерживаются только файлы .xlsx')
        return
      }

      setIsLoading(true)
      try {
        const parsed = await parseExcel(file)
        handleParsed(parsed)
      } catch {
        toast.error('Ошибка при чтении файла')
      } finally {
        setIsLoading(false)
      }
    },
    [handleParsed],
  )

  const handleTauriOpen = useCallback(async () => {
    setIsLoading(true)
    try {
      const { tauriOpenFile } = await import('@/shared/lib/tauri-fs')
      const result = await tauriOpenFile([
        { name: 'Excel', extensions: ['xlsx', 'xls'] },
      ])
      if (!result) {
        setIsLoading(false)
        return
      }
      const parsed = parseExcelFromBuffer(result.data)
      handleParsed(parsed)
    } catch {
      toast.error('Ошибка при чтении файла')
    } finally {
      setIsLoading(false)
    }
  }, [handleParsed])

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

  const handleButtonClick = () => {
    if (isTauri()) {
      handleTauriOpen()
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-3 rounded-lg border border-dashed border-border p-12">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        <span className="text-muted-foreground">Обработка файла...</span>
      </div>
    )
  }

  return (
    <div
      className={`flex flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed p-12 transition-colors ${
        isDragging
          ? 'border-blue-500 bg-blue-500/5'
          : 'border-border hover:border-ring'
      }`}
      onDragOver={(e) => {
        e.preventDefault()
        setIsDragging(true)
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      <FileSpreadsheet className="h-10 w-10 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">
        Перетащите файл .xlsx сюда или выберите вручную
      </p>
      {isTauri() ? (
        <Button variant="outline" onClick={handleButtonClick}>
          <Upload className="h-4 w-4" />
          Выбрать файл
        </Button>
      ) : (
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
      )}
    </div>
  )
}
