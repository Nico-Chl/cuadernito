import { db } from './db'

const FORMAT = 'cuadernito-backup'
const VERSION = 1

interface BackupFile {
  format: typeof FORMAT
  version: number
  exportedAt: string
  data: {
    words: unknown[]
    cards: unknown[]
    settings: unknown[]
  }
}

export async function exportBackup(): Promise<Blob> {
  const [words, cards, settings] = await Promise.all([
    db.words.toArray(),
    db.cards.toArray(),
    db.settings.toArray(),
  ])
  const file: BackupFile = {
    format: FORMAT,
    version: VERSION,
    exportedAt: new Date().toISOString(),
    data: { words, cards, settings },
  }
  return new Blob([JSON.stringify(file)], { type: 'application/json' })
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export async function exportBackupToFile() {
  const blob = await exportBackup()
  const date = new Date().toISOString().slice(0, 10)
  downloadBlob(blob, `cuadernito-${date}.json`)
}

function isBackup(x: unknown): x is BackupFile {
  if (typeof x !== 'object' || x === null) return false
  const f = x as Partial<BackupFile>
  return (
    f.format === FORMAT &&
    typeof f.version === 'number' &&
    typeof f.data === 'object' &&
    f.data !== null &&
    Array.isArray(f.data.words) &&
    Array.isArray(f.data.cards) &&
    Array.isArray(f.data.settings)
  )
}

/** Remplace TOUTES les données locales par celles du fichier. */
export async function importBackup(file: File): Promise<{ words: number; cards: number }> {
  let parsed: unknown
  try {
    parsed = JSON.parse(await file.text())
  } catch {
    throw new Error('invalid')
  }
  if (!isBackup(parsed)) throw new Error('invalid')
  if (parsed.version > VERSION) throw new Error('too-new')

  const { words, cards, settings } = parsed.data
  await db.transaction('rw', db.words, db.cards, db.settings, async () => {
    await Promise.all([db.words.clear(), db.cards.clear(), db.settings.clear()])
    await db.words.bulkAdd(words as never[])
    await db.cards.bulkAdd(cards as never[])
    await db.settings.bulkAdd(settings as never[])
  })
  return { words: words.length, cards: cards.length }
}
