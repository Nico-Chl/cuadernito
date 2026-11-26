import type { LanguageEngine } from '../conj'

export type QuizMode = 'form' | 'tense'
export type QuizPool = 'common' | 'mine' | 'both'

export interface QuizConfig {
  mode: QuizMode
  tenseIds: string[]
  pool: QuizPool
  count: number
}

/** Une forme isolée : verbe + temps + personne. */
export interface FormQuestion {
  kind: 'form'
  verb: string
  tenseId: string
  person: number
  expected: string
}

/** Un temps complet : une réponse par personne. */
export interface TenseQuestion {
  kind: 'tense'
  verb: string
  tenseId: string
  answers: { person: number; expected: string }[]
}

export type Question = FormQuestion | TenseQuestion

export const COUNTS = [5, 10, 20] as const

export function defaultConfig(engine: LanguageEngine): QuizConfig {
  return {
    mode: 'form',
    tenseIds: engine.tenses.filter((t) => t.common).map((t) => t.id),
    pool: 'common',
    count: 10,
  }
}

/** Complète / nettoie une config sauvegardée (temps disparus, valeurs inattendues). */
export function normalizeConfig(saved: Partial<QuizConfig> | null, engine: LanguageEngine): QuizConfig {
  const base = defaultConfig(engine)
  if (!saved) return base
  const known = new Set(engine.tenses.map((t) => t.id))
  const tenseIds = (saved.tenseIds ?? []).filter((id) => known.has(id))
  return {
    mode: saved.mode === 'tense' ? 'tense' : 'form',
    tenseIds: tenseIds.length > 0 ? tenseIds : base.tenseIds,
    pool: saved.pool === 'mine' || saved.pool === 'both' ? saved.pool : 'common',
    count: (COUNTS as readonly number[]).includes(saved.count ?? 0) ? (saved.count as number) : base.count,
  }
}

/**
 * Formes attendues pour un verbe et un temps, une par personne (null si la personne n'existe pas).
 * Si le verbe a plusieurs modèles de conjugaison, toutes les variantes sont acceptées (« a / b »).
 */
export function expectedForms(engine: LanguageEngine, verb: string, tenseId: string): (string | null)[] {
  const tables = engine.conjugate(verb)
  return engine.persons.map((_, i) => {
    const forms = [...new Set(tables.map((t) => t.tenses[tenseId]?.[i]).filter((f): f is string => !!f))]
    return forms.length > 0 ? forms.join(' / ') : null
  })
}

export function pickVerbs(common: string[], mine: string[], pool: QuizPool): string[] {
  const list = pool === 'common' ? common : pool === 'mine' ? mine : [...common, ...mine]
  return [...new Set(list)]
}

/** Construit les questions d'une session, sans doublons exacts tant que c'est possible. */
export function buildQuestions(
  engine: LanguageEngine,
  config: Pick<QuizConfig, 'mode' | 'tenseIds' | 'count'>,
  verbs: string[],
  rng: () => number = Math.random,
): Question[] {
  if (verbs.length === 0 || config.tenseIds.length === 0) return []
  const pick = <T>(xs: T[]): T => xs[Math.floor(rng() * xs.length)]
  const seen = new Set<string>()
  const out: Question[] = []

  for (let attempt = 0; attempt < config.count * 30 && out.length < config.count; attempt++) {
    const verb = pick(verbs)
    const tenseId = pick(config.tenseIds)
    const forms = expectedForms(engine, verb, tenseId)
    const available = forms.flatMap((f, person) => (f ? [{ person, expected: f }] : []))
    if (available.length === 0) continue

    if (config.mode === 'form') {
      const a = pick(available)
      const key = `${verb}|${tenseId}|${a.person}`
      if (seen.has(key)) continue
      seen.add(key)
      out.push({ kind: 'form', verb, tenseId, person: a.person, expected: a.expected })
    } else {
      const key = `${verb}|${tenseId}`
      if (seen.has(key)) continue
      seen.add(key)
      out.push({ kind: 'tense', verb, tenseId, answers: available })
    }
  }
  return out
}
