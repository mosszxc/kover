import { read, utils, type WorkBook } from 'xlsx'
import type { DayOfWeek } from '@/shared/types'
import type { ParsedExcel } from '../types'

const MASTER_SHEET = 'Неделя'

const DAY_SHEET_NAMES: Record<string, DayOfWeek> = {
  'ПН': 0,
  'ВТ': 1,
  'СР': 2,
  'ЧТ': 3,
  'ПТ': 4,
  'СБ': 5,
  'ВС': 6,
}

function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as ArrayBuffer)
    reader.onerror = () => reject(new Error('Не удалось прочитать файл'))
    reader.readAsArrayBuffer(file)
  })
}

function parseWorkbook(workbook: WorkBook): ParsedExcel {
  const masterSheet = workbook.Sheets[MASTER_SHEET]
  if (!masterSheet) {
    throw new Error(`Лист «${MASTER_SHEET}» не найден в файле`)
  }

  const masterRows: string[][] = utils.sheet_to_json(masterSheet, {
    header: 1,
    defval: '',
    raw: false,
  })

  const routesByDay = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] } as Record<DayOfWeek, string[]>

  for (const [sheetName, day] of Object.entries(DAY_SHEET_NAMES)) {
    const sheet = workbook.Sheets[sheetName]
    if (!sheet) continue

    const rows: string[][] = utils.sheet_to_json(sheet, {
      header: 1,
      defval: '',
      raw: false,
    })

    routesByDay[day] = rows
      .map((row) => row.find((cell) => cell.trim() !== '') ?? '')
      .filter((value) => value !== '')
  }

  return { masterRows, routesByDay }
}

export function parseExcelFromBuffer(buffer: ArrayBuffer | Uint8Array): ParsedExcel {
  return parseWorkbook(read(buffer, { type: 'array' }))
}

export async function parseExcel(file: File): Promise<ParsedExcel> {
  const buffer = await readFileAsArrayBuffer(file)
  return parseWorkbook(read(buffer, { type: 'array' }))
}
