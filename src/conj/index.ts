import type { LanguageEngine } from './types'

export type { ConjugationTable, Forms, LanguageEngine, MoodDef, TenseDef } from './types'

const cache = new Map<string, Promise<LanguageEngine>>()

/**
 * Charge le moteur d'une langue à la demande (la bibliothèque de conjugaison est
 * lourde : elle n'est téléchargée qu'à la première visite de la conjugaison).
 * Pour ajouter une langue : créer son moteur et l'ajouter ici.
 */
export function loadEngine(lang: string): Promise<LanguageEngine> {
  let p = cache.get(lang)
  if (!p) {
    switch (lang) {
      case 'es':
        p = import('./es').then((m) => m.createSpanishEngine())
        break
      default:
        return Promise.reject(new Error(`No conjugation engine for "${lang}"`))
    }
    cache.set(lang, p)
  }
  return p
}
