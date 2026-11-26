/** Détecte le séparateur le plus fréquent dans la première ligne. */
function detectDelimiter(text: string): string {
  const first = text.split(/\r?\n/, 1)[0] ?? ''
  const candidates = [';', '\t', ',']
  let best = ','
  let max = 0
  for (const c of candidates) {
    const n = first.split(c).length - 1
    if (n > max) {
      max = n
      best = c
    }
  }
  return best
}

/** Mini-parseur CSV: séparateur auto, guillemets, guillemets doublés. */
export function parseCsv(text: string): string[][] {
  const src = text.replace(/^﻿/, '')
  const delim = detectDelimiter(src)
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let quoted = false

  for (let i = 0; i < src.length; i++) {
    const ch = src[i]
    if (quoted) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          cell += '"'
          i++
        } else quoted = false
      } else cell += ch
    } else if (ch === '"') {
      quoted = true
    } else if (ch === delim) {
      row.push(cell)
      cell = ''
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src[i + 1] === '\n') i++
      row.push(cell)
      rows.push(row)
      row = []
      cell = ''
    } else cell += ch
  }
  if (cell !== '' || row.length > 0) {
    row.push(cell)
    rows.push(row)
  }
  return rows.map((r) => r.map((c) => c.trim())).filter((r) => r.some((c) => c !== ''))
}

const HEADER_WORDS = new Set(['term', 'word', 'mot', 'palabra', 'vocabulaire', 'espagnol', 'spanish'])

export interface ImportRow {
  term: string
  translation: string
  note?: string
}

/** Colonnes attendues : mot, traduction, note (facultative). */
export function rowsToWords(rows: string[][]): ImportRow[] {
  const body = rows.length > 0 && HEADER_WORDS.has(rows[0][0]?.toLowerCase()) ? rows.slice(1) : rows
  const out: ImportRow[] = []
  for (const r of body) {
    const [term, translation, note] = r
    if (!term || !translation) continue
    out.push({ term, translation, ...(note ? { note } : {}) })
  }
  return out
}
