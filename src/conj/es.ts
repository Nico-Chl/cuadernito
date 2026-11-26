import { Conjugator, type ResultTable } from '@jirimracek/conjugate-esp'
import type { ConjugationTable, Forms, LanguageEngine, MoodDef, TenseDef } from './types'

/** Moteur espagnol : générateur à règles MIT (RAE, ~14 000 verbes) + table de temps ci-dessous. */

const moods: MoodDef[] = [
  { id: 'indicativo', labels: { fr: 'Indicatif', en: 'Indicative' } },
  { id: 'subjuntivo', labels: { fr: 'Subjonctif', en: 'Subjunctive' } },
  { id: 'imperativo', labels: { fr: 'Impératif', en: 'Imperative' } },
]

const t = (id: string, mood: string, common: boolean, fr: string, en: string): TenseDef => ({
  id,
  mood,
  common,
  labels: { fr, en },
})

export const ES_TENSES: TenseDef[] = [
  t('ind.presente', 'indicativo', true, 'Présent', 'Present'),
  t('ind.indefinido', 'indicativo', true, 'Passé simple (indefinido)', 'Preterite (indefinido)'),
  t('ind.imperfecto', 'indicativo', true, 'Imparfait', 'Imperfect'),
  t('ind.perfecto', 'indicativo', true, 'Passé composé (perfecto)', 'Present perfect'),
  t('ind.pluscuamperfecto', 'indicativo', true, 'Plus-que-parfait', 'Pluperfect'),
  t('ind.futuro', 'indicativo', true, 'Futur', 'Future'),
  t('ind.condicional', 'indicativo', true, 'Conditionnel', 'Conditional'),
  t('ind.futuroPerfecto', 'indicativo', false, 'Futur antérieur', 'Future perfect'),
  t('ind.condicionalCompuesto', 'indicativo', false, 'Conditionnel passé', 'Conditional perfect'),
  t('ind.anterior', 'indicativo', false, 'Passé antérieur', 'Preterite perfect'),
  t('sub.presente', 'subjuntivo', true, 'Subjonctif présent', 'Present subjunctive'),
  t('sub.imperfectoRa', 'subjuntivo', true, 'Subjonctif imparfait (-ra)', 'Imperfect subjunctive (-ra)'),
  t('sub.perfecto', 'subjuntivo', true, 'Subjonctif passé', 'Perfect subjunctive'),
  t('sub.pluscuamperfectoRa', 'subjuntivo', true, 'Subjonctif plus-que-parfait (-ra)', 'Pluperfect subjunctive (-ra)'),
  t('sub.imperfectoSe', 'subjuntivo', false, 'Subjonctif imparfait (-se)', 'Imperfect subjunctive (-se)'),
  t('sub.pluscuamperfectoSe', 'subjuntivo', false, 'Subjonctif plus-que-parfait (-se)', 'Pluperfect subjunctive (-se)'),
  t('sub.futuro', 'subjuntivo', false, 'Subjonctif futur', 'Future subjunctive'),
  t('sub.futuroPerfecto', 'subjuntivo', false, 'Subjonctif futur antérieur', 'Future perfect subjunctive'),
  t('imp.afirmativo', 'imperativo', true, 'Impératif affirmatif', 'Affirmative imperative'),
  t('imp.negativo', 'imperativo', true, 'Impératif négatif', 'Negative imperative'),
]

const PERSONS = ['yo', 'tú', 'él / ella / usted', 'nosotros', 'vosotros', 'ellos / ellas / ustedes']

/** id du temps → [mode, clé] dans la sortie de la bibliothèque. */
const SOURCE: Record<string, ['Indicativo' | 'Subjuntivo' | 'Imperativo', string]> = {
  'ind.presente': ['Indicativo', 'Presente'],
  'ind.indefinido': ['Indicativo', 'PreteritoIndefinido'],
  'ind.imperfecto': ['Indicativo', 'PreteritoImperfecto'],
  'ind.perfecto': ['Indicativo', 'PreteritoPerfecto'],
  'ind.pluscuamperfecto': ['Indicativo', 'PreteritoPluscuamperfecto'],
  'ind.futuro': ['Indicativo', 'FuturoImperfecto'],
  'ind.condicional': ['Indicativo', 'CondicionalSimple'],
  'ind.futuroPerfecto': ['Indicativo', 'FuturoPerfecto'],
  'ind.condicionalCompuesto': ['Indicativo', 'CondicionalCompuesto'],
  'ind.anterior': ['Indicativo', 'PreteritoAnterior'],
  'sub.presente': ['Subjuntivo', 'Presente'],
  'sub.imperfectoRa': ['Subjuntivo', 'PreteritoImperfectoRa'],
  'sub.imperfectoSe': ['Subjuntivo', 'PreteritoImperfectoSe'],
  'sub.perfecto': ['Subjuntivo', 'PreteritoPerfecto'],
  'sub.pluscuamperfectoRa': ['Subjuntivo', 'PreteritoPluscuamperfectoRa'],
  'sub.pluscuamperfectoSe': ['Subjuntivo', 'PreteritoPluscuamperfectoSe'],
  'sub.futuro': ['Subjuntivo', 'FuturoImperfecto'],
  'sub.futuroPerfecto': ['Subjuntivo', 'FuturoPerfecto'],
  'imp.afirmativo': ['Imperativo', 'Afirmativo'],
  'imp.negativo': ['Imperativo', 'Negativo'],
}

/** Minuscules, sans accents (ñ conservé). Sert à la recherche. */
export function fold(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/ñ/g, '\u0001')
    .replace(/\p{M}/gu, '')
    .replaceAll('\u0001', 'ñ')
    .trim()
}

/** Clé de recherche : comme fold(), mais ñ → n pour trouver « añadir » en tapant « anadir ». */
function searchKey(s: string): string {
  return fold(s).replaceAll('ñ', 'n')
}

function toForms(raw: string[] | undefined): Forms {
  const out: Forms = (raw ?? []).map((f) => (f && f !== '-' ? f : null))
  while (out.length < PERSONS.length) out.push(null)
  return out
}

/**
 * En région « castellano », la bibliothèque ne donne l'impératif que pour tú, nosotros et vosotros.
 * La région « formal » le donne pour usted / ustedes, mais dans les colonnes « tú » (index 1)
 * et « vosotros » (index 4) : on les recopie aux positions usted (2) et ustedes (5).
 */
function mergeFormalImperative(forms: Forms, formal: string[] | undefined): Forms {
  const f = toForms(formal)
  const out = [...forms]
  out[2] = f[1]
  out[5] = f[4]
  return out
}

function toTable(c: ResultTable, formal: ResultTable | undefined): ConjugationTable {
  const tenses: Record<string, Forms> = {}
  for (const [id, [mood, key]] of Object.entries(SOURCE)) {
    const group = c[mood] as Record<string, string[]>
    tenses[id] = toForms(group[key])
    if (mood === 'Imperativo') {
      tenses[id] = mergeFormalImperative(tenses[id], formal?.Imperativo[key as 'Afirmativo' | 'Negativo'])
    }
  }
  return {
    infinitive: c.Impersonal.Infinitivo,
    gerund: c.Impersonal.Gerundio,
    participle: c.Impersonal.Participio,
    tenses,
  }
}

export function createSpanishEngine(): LanguageEngine {
  const conjugator = new Conjugator()
  const verbs = conjugator.getVerbListSync()
  const verbSet = new Set(verbs)
  const folded = verbs.map((v) => [searchKey(v), v] as const)

  return {
    lang: 'es',
    persons: PERSONS,
    moods,
    tenses: ES_TENSES,

    conjugate(verb) {
      const results = conjugator.conjugateSync(verb.trim().toLowerCase(), 'castellano')
      if (typeof results === 'string') return []
      const formal = conjugator.conjugateSync(verb.trim().toLowerCase(), 'formal')
      return results.map((r, i) => toTable(r.conjugation, typeof formal === 'string' ? undefined : formal[i]?.conjugation))
    },

    search(query, limit = 20) {
      const q = searchKey(query)
      if (!q) return []
      const starts: string[] = []
      const contains: string[] = []
      for (const [f, v] of folded) {
        if (f.startsWith(q)) starts.push(v)
        else if (f.includes(q)) contains.push(v)
        if (starts.length >= limit) break
      }
      return [...starts, ...contains].slice(0, limit)
    },

    hasVerb: (verb) => verbSet.has(verb.trim().toLowerCase()),
    verbCount: () => verbs.length,
  }
}
