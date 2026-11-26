/**
 * Révision espacée type Leitner.
 *
 * - Faux (à n'importe quel niveau) → boîte 0, redemandé le lendemain.
 * - Juste → boîte suivante : 1 semaine, puis 1 mois, puis 3 mois, puis 6 mois.
 *
 * Les échéances tombent au début de la journée : une carte due « demain »
 * est disponible dès le matin.
 */

/** Intervalle (en jours) selon la boîte atteinte après une bonne réponse. */
export const INTERVAL_DAYS: Record<number, number> = { 0: 1, 1: 7, 2: 30, 3: 90, 4: 180 }
export const MAX_BOX = 4

export function startOfDay(ts: number): number {
  const d = new Date(ts)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

export function addDays(ts: number, days: number): number {
  const d = new Date(ts)
  d.setDate(d.getDate() + days)
  return d.getTime()
}

export interface CardState {
  box: number
  due: number
  lastReviewed: number
}

export function nextState(box: number, correct: boolean, now: number): CardState {
  const newBox = correct ? Math.min(box + 1, MAX_BOX) : 0
  return {
    box: newBox,
    due: addDays(startOfDay(now), INTERVAL_DAYS[newBox]),
    lastReviewed: now,
  }
}
