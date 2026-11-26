import Dexie, { type EntityTable } from 'dexie'

/** Code de langue ISO 639-1 (« es », « en », …) de la langue étudiée. */
export type LangCode = string

export interface Word {
  id: number
  lang: LangCode
  /** Mot dans la langue étudiée. */
  term: string
  /** Traduction (langue de l'utilisateur). */
  translation: string
  note?: string
  createdAt: number
}

/**
 * Une carte = un sens d'interrogation d'un mot.
 * Chaque sens a sa propre progression dans la révision espacée.
 */
export interface Card {
  id: number
  wordId: number
  /** 'fwd' = langue étudiée → langue maternelle, 'rev' = l'inverse. */
  direction: 'fwd' | 'rev'
  /** Boîte de Leitner (0 = nouvelle / ratée). */
  box: number
  /** Prochaine révision (timestamp ms). */
  due: number
  lastReviewed?: number
}

export interface Setting {
  key: string
  value: unknown
}

export class CuadernitoDB extends Dexie {
  words!: EntityTable<Word, 'id'>
  cards!: EntityTable<Card, 'id'>
  settings!: EntityTable<Setting, 'key'>

  constructor() {
    super('cuadernito')
    this.version(1).stores({
      words: '++id, lang, term, createdAt',
      cards: '++id, wordId, due, [wordId+direction]',
      settings: 'key',
    })
  }
}

export const db = new CuadernitoDB()

export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const row = await db.settings.get(key)
  return row ? (row.value as T) : fallback
}

export function setSetting(key: string, value: unknown) {
  return db.settings.put({ key, value })
}
