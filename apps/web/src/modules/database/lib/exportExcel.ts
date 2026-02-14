import { utils, writeFile } from 'xlsx'
import type { SheetData } from '../types'

export function exportToExcel(sheets: SheetData[], filename: string) {
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

  writeFile(workbook, filename)
}
