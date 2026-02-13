import { useMatSizeStore } from '@/shared/stores/matSizeStore'
import type { ParsedClient, ParsedMatSpec } from '../types'

/** Map non-standard sizes to valid size ids */
const SIZE_ALIASES: Record<string, string> = {
  '200': '180',
  '240': '180',
}

/** Words to strip from parsed text (conditions, colors, etc.) */
const NOISE_WORDS = [
  'новый', 'новые', 'нов', 'новая',
  'старый', 'старые', 'стар',
  'резаный', 'резаные', 'рез',
  'хороший', 'хорошие',
  'коричневый', 'коричневые', 'коричнев', 'кор',
  'серый', 'серые', 'сер',
  'чёрный', 'черный', 'чёрные', 'черные',
]

/** Potential note phrases to extract (found in parentheses or after specific patterns) */
const NOTE_PATTERNS = [
  /\(([^)]+)\)/g, // text in parentheses
  /(\d+[- ]?(?:ий|ой|й)\s*вход)/gi, // "3ий вход", "2ой вход", "1 вх"
  /(\d+\s*вх)\b/gi, // "1 вх"
  /стелим на себя/gi,
]

/**
 * Regex for mat specs: captures quantity and size in various formats.
 *
 * Supported formats:
 * - `2x180`, `2х180`, `2X180`, `2Х180`, `2×180` — qty × size
 * - `180*2`, `180х2`, `180x2` — size × qty (reversed)
 * - `180 2шт`, `180 2 шт`, `180 3шт.` — size + qty with "шт"
 * - `150+150` — addition (handled separately)
 * - `60x80`, `60х80`, `80x80`, `80х80` — small mat dimensions
 * - bare `180`, `150`, `400`, `250`, `200`, `240` — single mat
 */

// Small mat pattern: 60x80, 60х80, 80x80, 80х80 (with optional qty prefix)
const SMALL_MAT_RE = /(?:(\d+)[- ]?)?(\d{2,3})[xхXХ×](\d{2,3})(?!\d)/g

// Qty × Size: 2x180, 3х150
const QTY_SIZE_RE = /(\d+)\s*[xхXХ×]\s*(180|150|400|250|200|240)(?!\d)/g

// Size × Qty (reversed): 180*2, 180х3
const SIZE_QTY_RE = /(180|150|400|250|200|240)\s*\*\s*(\d+)/g

// Size + "шт": 180 2шт, 150 3 шт.
const SIZE_SHT_RE = /(180|150|400|250|200|240)\s+(\d+)\s*шт\.?/gi

// Size + Size (addition): 150+150
const SIZE_PLUS_RE = /(180|150|400|250|200|240)\s*\+\s*(180|150|400|250|200|240)/g

// Bare size (no quantity prefix) — matched last as fallback
const BARE_SIZE_RE = /(?<!\d)(180|150|400|250|200|240)(?!\s*[xхXХ×*]\s*\d)(?!\d)/g

function normalizeSize(raw: string): string | null {
  if (SIZE_ALIASES[raw]) return SIZE_ALIASES[raw]
  const sizeIds = useMatSizeStore.getState().sizes.map((s) => s.id)
  if (sizeIds.includes(raw)) return raw
  return null
}

function isSmallMat(w: string, h: string): boolean {
  const dims = [parseInt(w), parseInt(h)].sort((a, b) => a - b) as [number, number]
  return dims[0] <= 80 && dims[1] <= 80
}

interface MatMatch {
  size: string
  quantity: number
  start: number
  end: number
}

function extractMats(text: string): { mats: ParsedMatSpec[]; matRanges: [number, number][] } {
  const matches: MatMatch[] = []
  const ranges: [number, number][] = []
  let m: RegExpExecArray | null

  // 1. Small mats: 60x80, 2-60х80, etc.
  const smallMatRe = new RegExp(SMALL_MAT_RE.source, SMALL_MAT_RE.flags)
  while ((m = smallMatRe.exec(text)) !== null) {
    const w = m[2] ?? ''
    const h = m[3] ?? ''
    if (w && h && isSmallMat(w, h)) {
      const qty = m[1] ? parseInt(m[1]) : 1
      matches.push({ size: '60x80', quantity: qty, start: m.index, end: m.index + m[0].length })
      ranges.push([m.index, m.index + m[0].length])
    }
  }

  // 2. Qty × Size: 2x180
  const qtySizeRe = new RegExp(QTY_SIZE_RE.source, QTY_SIZE_RE.flags)
  while ((m = qtySizeRe.exec(text)) !== null) {
    if (isOverlapping(m.index, m.index + m[0].length, ranges)) continue
    const sizeRaw = m[2] ?? ''
    const qtyRaw = m[1] ?? '1'
    const size = normalizeSize(sizeRaw)
    if (size) {
      matches.push({ size, quantity: parseInt(qtyRaw), start: m.index, end: m.index + m[0].length })
      ranges.push([m.index, m.index + m[0].length])
    }
  }

  // 3. Size × Qty: 180*2
  const sizeQtyRe = new RegExp(SIZE_QTY_RE.source, SIZE_QTY_RE.flags)
  while ((m = sizeQtyRe.exec(text)) !== null) {
    if (isOverlapping(m.index, m.index + m[0].length, ranges)) continue
    const sizeRaw = m[1] ?? ''
    const qtyRaw = m[2] ?? '1'
    const size = normalizeSize(sizeRaw)
    if (size) {
      matches.push({ size, quantity: parseInt(qtyRaw), start: m.index, end: m.index + m[0].length })
      ranges.push([m.index, m.index + m[0].length])
    }
  }

  // 4. Size + шт: 180 2шт
  const sizeShtRe = new RegExp(SIZE_SHT_RE.source, SIZE_SHT_RE.flags)
  while ((m = sizeShtRe.exec(text)) !== null) {
    if (isOverlapping(m.index, m.index + m[0].length, ranges)) continue
    const sizeRaw = m[1] ?? ''
    const qtyRaw = m[2] ?? '1'
    const size = normalizeSize(sizeRaw)
    if (size) {
      matches.push({ size, quantity: parseInt(qtyRaw), start: m.index, end: m.index + m[0].length })
      ranges.push([m.index, m.index + m[0].length])
    }
  }

  // 5. Size + Size: 150+150
  const sizePlusRe = new RegExp(SIZE_PLUS_RE.source, SIZE_PLUS_RE.flags)
  while ((m = sizePlusRe.exec(text)) !== null) {
    if (isOverlapping(m.index, m.index + m[0].length, ranges)) continue
    const s1 = normalizeSize(m[1] ?? '')
    const s2 = normalizeSize(m[2] ?? '')
    if (s1 && s2) {
      if (s1 === s2) {
        matches.push({ size: s1, quantity: 2, start: m.index, end: m.index + m[0].length })
      } else {
        matches.push({ size: s1, quantity: 1, start: m.index, end: m.index + m[0].length })
        matches.push({ size: s2, quantity: 1, start: m.index, end: m.index + m[0].length })
      }
      ranges.push([m.index, m.index + m[0].length])
    }
  }

  // 6. Bare size: standalone 180, 150, etc.
  const bareSizeRe = new RegExp(BARE_SIZE_RE.source, BARE_SIZE_RE.flags)
  while ((m = bareSizeRe.exec(text)) !== null) {
    if (isOverlapping(m.index, m.index + m[0].length, ranges)) continue
    const size = normalizeSize(m[1] ?? '')
    if (size) {
      matches.push({ size, quantity: 1, start: m.index, end: m.index + m[0].length })
      ranges.push([m.index, m.index + m[0].length])
    }
  }

  // Merge duplicate sizes
  const merged = new Map<string, number>()
  for (const mat of matches) {
    merged.set(mat.size, (merged.get(mat.size) || 0) + mat.quantity)
  }

  const mats: ParsedMatSpec[] = Array.from(merged.entries()).map(([size, quantity]) => ({
    size,
    quantity,
  }))

  return { mats, matRanges: ranges }
}

function isOverlapping(start: number, end: number, ranges: [number, number][]): boolean {
  return ranges.some(([s, e]) => start < e && end > s)
}

function extractNotes(text: string): { notes: string; cleanedText: string } {
  const noteFragments: string[] = []
  let cleaned = text

  for (const pattern of NOTE_PATTERNS) {
    const re = new RegExp(pattern.source, pattern.flags)
    let m: RegExpExecArray | null
    while ((m = re.exec(cleaned)) !== null) {
      const note = m[1] || m[0]
      noteFragments.push(note.trim())
    }
    cleaned = cleaned.replace(re, ' ')
  }

  return {
    notes: noteFragments.join(', '),
    cleanedText: cleaned,
  }
}

function stripNoise(text: string): string {
  let result = text
  for (const word of NOISE_WORDS) {
    const re = new RegExp(`\\b${word}\\.?\\b`, 'gi')
    result = result.replace(re, ' ')
  }
  // Also strip "сер." and "нов." abbreviations
  result = result.replace(/\bсер\.?\b/gi, ' ')
  result = result.replace(/\bнов\.?\b/gi, ' ')
  result = result.replace(/\bкор\.?\b/gi, ' ')
  result = result.replace(/\d+\s*шт\.?\b/gi, ' ')
  return result
}

function capitalize(s: string): string {
  if (!s) return s
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function cleanWhitespace(s: string): string {
  return s.replace(/\s+/g, ' ').trim()
}

/**
 * Split the text into name+address portion (before mats) and the rest.
 * The separator is typically a dash before mat specs, or the first mat spec position.
 */
function splitNameAddress(
  text: string,
  matRanges: [number, number][],
): { name: string; address: string } {
  if (matRanges.length === 0) {
    // No mats found — entire text is name
    const cleaned = cleanWhitespace(stripNoise(text))
    return { name: capitalize(cleaned), address: '' }
  }

  // Find the earliest mat position
  const firstMatStart = Math.min(...matRanges.map(([s]) => s))

  // Get the text before mats
  let prefix = text.slice(0, firstMatStart)

  // Remove trailing separators (dash, comma, space)
  prefix = prefix.replace(/[\s,\-–—]+$/, '')

  // Now split prefix into name and address
  // Address indicators: known street patterns, or text after known company name
  const parts = splitPrefixIntoNameAndAddress(prefix)

  return {
    name: capitalize(cleanWhitespace(parts.name)),
    address: cleanWhitespace(parts.address),
  }
}

/** Known street/address keywords that indicate start of address */
const ADDRESS_KEYWORDS = [
  'ленина', 'гоголя', 'советская', 'пушкина', 'кирова', 'красина',
  'куйбышева', 'пролетарская', 'володарского', 'юбилейный', 'горького',
  'м.горького', 'москва', 'мяготина', 'к.мяготина', 'к. мяготина',
  'к.маркса', 'к. маркса', 'к. Маркса', 'К.маркса', 'К.Маркса', 'К. маркса',
  'омская', 'томина', 'васильева', 'некрасова', 'космольская',
  'дзержинского', 'машиностроителей', 'машиностр',
  'площадь', 'площади',
]

function splitPrefixIntoNameAndAddress(prefix: string): { name: string; address: string } {
  const lower = prefix.toLowerCase()

  // Try to find address keyword
  let bestIdx = -1

  for (const kw of ADDRESS_KEYWORDS) {
    const idx = lower.indexOf(kw.toLowerCase())
    if (idx > 0 && (bestIdx === -1 || idx < bestIdx)) {
      bestIdx = idx
    }
  }

  if (bestIdx > 0) {
    const namePart = prefix.slice(0, bestIdx).replace(/[\s,\-–—]+$/, '')
    const addressPart = prefix.slice(bestIdx)
    return { name: stripNoise(namePart), address: stripNoise(addressPart) }
  }

  // No address keyword found — whole prefix is name
  return { name: stripNoise(prefix), address: '' }
}

export function parseClientName(raw: string): ParsedClient {
  const trimmed = raw.trim()
  if (!trimmed) {
    return {
      originalName: raw,
      name: '',
      address: '',
      mats: [],
      notes: '',
      confidence: 'low',
    }
  }

  // Step 1: Extract notes (parenthetical, special phrases)
  const { notes, cleanedText } = extractNotes(trimmed)

  // Step 2: Extract mat specs
  const { mats, matRanges } = extractMats(cleanedText)

  // Step 3: Split remaining text into name and address
  const { name, address } = splitNameAddress(cleanedText, matRanges)

  // Step 4: Determine confidence
  const confidence: 'high' | 'low' = name.length > 0 && mats.length > 0 ? 'high' : 'low'

  return {
    originalName: raw,
    name,
    address,
    mats,
    notes,
    confidence,
  }
}
