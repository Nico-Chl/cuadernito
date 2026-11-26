import { db, type Card, type LangCode } from '../db'
import type { ImportRow } from './csv'
import { nextState } from './srs'

/** Langue étudiée. Fixée à l'espagnol pour la V1 (le schéma est prêt pour d'autres). */
export const STUDY_LANG: LangCode = 'es'

/** Mots du vocabulaire qui sont des verbes à l'infinitif connus du moteur (pour les exercices de conjugaison). */
export async function loadMyVerbs(
  engine: { hasVerb(v: string): boolean },
  lang: LangCode = STUDY_LANG,
): Promise<string[]> {
  const words = await db.words.where('lang').equals(lang).toArray()
  const verbs = words.map((w) => w.term.trim().toLowerCase()).filter((v) => engine.hasVerb(v))
  return [...new Set(verbs)]
}

type NewCard = Omit<Card, 'id'>

const key = (s: string) => s.trim().toLowerCase()

function newCards(wordId: number, now: number): NewCard[] {
  return (['fwd', 'rev'] as const).map((direction) => ({ wordId, direction, box: 0, due: now }))
}

export interface WordInput {
  term: string
  translation: string
  note?: string
}

/** Ajoute un mot et ses deux cartes. Retourne false si le mot existe déjà. */
export async function addWord(input: WordInput, lang: LangCode = STUDY_LANG): Promise<boolean> {
  return db.transaction('rw', db.words, db.cards, async () => {
    const dup = await db.words
      .where('term')
      .equals(input.term.trim())
      .filter((w) => w.lang === lang)
      .first()
    if (dup) return false
    const now = Date.now()
    const id = await db.words.add({
      lang,
      term: input.term.trim(),
      translation: input.translation.trim(),
      note: input.note?.trim() || undefined,
      createdAt: now,
    })
    await db.cards.bulkAdd(newCards(id as number, now))
    return true
  })
}

export async function updateWord(id: number, input: WordInput) {
  await db.words.update(id, {
    term: input.term.trim(),
    translation: input.translation.trim(),
    note: input.note?.trim() || undefined,
  })
}

export async function deleteWord(id: number) {
  await db.transaction('rw', db.words, db.cards, async () => {
    await db.cards.where('wordId').equals(id).delete()
    await db.words.delete(id)
  })
}

/** Importe des lignes CSV en ignorant les doublons (en base et dans le fichier). */
export async function importWords(
  rows: ImportRow[],
  lang: LangCode = STUDY_LANG,
): Promise<{ added: number; skipped: number }> {
  return db.transaction('rw', db.words, db.cards, async () => {
    const existing = new Set((await db.words.where('lang').equals(lang).toArray()).map((w) => key(w.term)))
    let added = 0
    let skipped = 0
    const now = Date.now()
    for (const r of rows) {
      const k = key(r.term)
      if (existing.has(k)) {
        skipped++
        continue
      }
      existing.add(k)
      const id = await db.words.add({
        lang,
        term: r.term.trim(),
        translation: r.translation.trim(),
        note: r.note?.trim() || undefined,
        createdAt: now,
      })
      await db.cards.bulkAdd(newCards(id as number, now))
      added++
    }
    return { added, skipped }
  })
}

export interface DueItem {
  card: Card
  prompt: string
  expected: string
  note?: string
}

/** Cartes à réviser maintenant, mélangées, prêtes pour le quiz. */
export async function loadDueItems(now = Date.now()): Promise<DueItem[]> {
  const cards = await db.cards.where('due').belowOrEqual(now).toArray()
  const words = new Map((await db.words.bulkGet([...new Set(cards.map((c) => c.wordId))])).map((w) => [w?.id, w]))
  const items: DueItem[] = []
  for (const card of cards) {
    const w = words.get(card.wordId)
    if (!w) continue
    items.push(
      card.direction === 'fwd'
        ? { card, prompt: w.term, expected: w.translation, note: w.note }
        : { card, prompt: w.translation, expected: w.term, note: w.note },
    )
  }
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[items[i], items[j]] = [items[j], items[i]]
  }
  return items
}

export async function recordAnswer(card: Card, correct: boolean) {
  await db.cards.update(card.id, nextState(card.box, correct, Date.now()))
}
