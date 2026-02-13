import { read, utils } from 'xlsx'
import type { DayOfWeek } from '@/shared/types'
import type { ParsedExcel } from '../types'

const MASTER_SHEET = 'Неделя'

const DAY_SHEET_NAMES: Record<string, DayOfWeek> = {
  'ПН': 0,
  'ВТ': 1,
  'СР': 2,
  'ЧТ': 3,
  'ПТ': 4,
}

function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as ArrayBuffer)
    reader.onerror = () => reject(new Error('Не удалось прочитать файл'))
    reader.readAsArrayBuffer(file)
  })
}

export async function parseExcel(file: File): Promise<ParsedExcel> {
  const buffer = await readFileAsArrayBuffer(file)
  const workbook = read(buffer, { type: 'array' })

  // Extract master sheet rows
  const masterSheet = workbook.Sheets[MASTER_SHEET]
  if (!masterSheet) {
    throw new Error(`Лист «${MASTER_SHEET}» не найден в файле`)
  }

  const masterRows: string[][] = utils.sheet_to_json(masterSheet, {
    header: 1,
    defval: '',
    raw: false,
  })

  // Extract route sheets (ПН–ПТ)
  const routesByDay = { 0: [], 1: [], 2: [], 3: [], 4: [] } as Record<DayOfWeek, string[]>

  for (const [sheetName, day] of Object.entries(DAY_SHEET_NAMES)) {
    const sheet = workbook.Sheets[sheetName]
    if (!sheet) continue

    const rows: string[][] = utils.sheet_to_json(sheet, {
      header: 1,
      defval: '',
      raw: false,
    })

    // Each row is a stop — collect first non-empty cell as identifier
    routesByDay[day] = rows
      .map((row) => row.find((cell) => cell.trim() !== '') ?? '')
      .filter((value) => value !== '')
  }

  return { masterRows, routesByDay }
}
