import type { UiLang } from '../i18n'

/** Un temps (ou mode) de conjugaison. L'id est stable et sert aussi dans les sauvegardes. */
export interface TenseDef {
  id: string
  /** Regroupement d'affichage (indicatif, subjonctif, impératif). */
  mood: string
  /** Proposé par défaut dans les exercices (les temps rares sont exclus). */
  common: boolean
  labels: Record<UiLang, string>
}

export interface MoodDef {
  id: string
  labels: Record<UiLang, string>
}

/** Une forme absente (ex. impératif « yo ») vaut null. */
export type Forms = (string | null)[]

export interface ConjugationTable {
  infinitive: string
  gerund: string
  participle: string
  /** Formes par temps, dans l'ordre de `persons`. */
  tenses: Record<string, Forms>
}

/**
 * Moteur de conjugaison d'une langue. Chaque langue a le sien ;
 * l'interface et les exercices ne dépendent que de ce contrat.
 */
export interface LanguageEngine {
  lang: string
  /** Pronoms dans l'ordre des formes (6 pour l'espagnol). */
  persons: string[]
  moods: MoodDef[]
  tenses: TenseDef[]
  /** Toutes les conjugaisons d'un verbe (plusieurs si le verbe a deux modèles). */
  conjugate(verb: string): ConjugationTable[]
  /** Recherche insensible à la casse et aux accents (préfixe d'abord). */
  search(query: string, limit?: number): string[]
  hasVerb(verb: string): boolean
  verbCount(): number
}
