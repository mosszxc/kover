import { utils, write, writeFile } from 'xlsx'
import { isTauri } from '@/shared/lib/platform'
import type { SheetData } from '../types'

function buildWorkbook(sheets: SheetData[]) {
  const workbook = utils.book_new()

  for (const sheet of sheets) {
    const data = [sheet.header, ...sheet.rows]
    const worksheet = utils.aoa_to_sheet(data)

    // Auto-width columns based on content
    const colWidths = sheet.header.map((h, colIdx) => {
      const maxLen = Math.max(
        h.length,
        ...sheet.rows.map((row) => String(row[colIdx] ?? '').length),
      )
      return { wch: Math.min(maxLen + 2, 40) }
    })
    worksheet['!cols'] = colWidths

    utils.book_append_sheet(workbook, worksheet, sheet.name)
  }

  return workbook
}

export async function exportToExcel(sheets: SheetData[], filename: string) {
  const workbook = buildWorkbook(sheets)

  if (isTauri()) {
    const { tauriSaveFile } = await import('@/shared/lib/tauri-fs')
    const buffer = write(workbook, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer
    const data = new Uint8Array(buffer)
    await tauriSaveFile(data, filename, [
      { name: 'Excel', extensions: ['xlsx'] },
    ])
    return
  }

  writeFile(workbook, filename)
}
