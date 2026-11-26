import { describe, expect, it } from 'vitest'
import { createSpanishEngine } from '../conj/es'
import { COMMON_VERBS } from './commonVerbs'
import { buildQuestions, defaultConfig, expectedForms, normalizeConfig, pickVerbs } from './conjQuiz'

const es = createSpanishEngine()

/** Générateur pseudo-aléatoire déterministe (mulberry32). */
function seeded(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

describe('verbes courants', () => {
  it('existent tous dans le moteur, sans doublon', () => {
    const verbs = COMMON_VERBS.es
    expect(verbs.filter((v) => !es.hasVerb(v))).toEqual([])
    expect(new Set(verbs).size).toBe(verbs.length)
  })
})

describe('expectedForms', () => {
  it('formes simples et personnes absentes', () => {
    expect(expectedForms(es, 'hablar', 'ind.presente')[3]).toBe('hablamos')
    expect(expectedForms(es, 'hablar', 'imp.afirmativo')[0]).toBeNull()
  })
  it('fusionne les variantes des verbes à deux modèles', () => {
    expect(expectedForms(es, 'apostar', 'imp.afirmativo')[1]).toBe('aposta / apuesta')
  })
})

describe('buildQuestions', () => {
  const tenseIds = ['ind.presente', 'imp.afirmativo']
  const verbs = ['hablar', 'comer', 'vivir', 'ir', 'tener']

  it('questions « forme » : bonne réponse attendue et jamais de personne absente', () => {
    const qs = buildQuestions(es, { mode: 'form', tenseIds, count: 20 }, verbs, seeded(1))
    expect(qs).toHaveLength(20)
    for (const q of qs) {
      expect(q.kind).toBe('form')
      if (q.kind !== 'form') continue
      expect(expectedForms(es, q.verb, q.tenseId)[q.person]).toBe(q.expected)
      expect(q.expected).toBeTruthy()
    }
  })

  it('questions « temps » : toutes les personnes présentes, pas de null', () => {
    const qs = buildQuestions(es, { mode: 'tense', tenseIds, count: 10 }, verbs, seeded(2))
    expect(qs.length).toBeGreaterThan(0)
    for (const q of qs) {
      if (q.kind !== 'tense') throw new Error('kind')
      const expected = expectedForms(es, q.verb, q.tenseId).filter(Boolean)
      expect(q.answers).toHaveLength(expected.length)
      if (q.tenseId === 'imp.afirmativo') expect(q.answers).toHaveLength(5)
      else expect(q.answers).toHaveLength(6)
    }
  })

  it('pas de doublon exact', () => {
    const qs = buildQuestions(es, { mode: 'form', tenseIds, count: 20 }, verbs, seeded(3))
    const keys = qs.map((q) => (q.kind === 'form' ? `${q.verb}|${q.tenseId}|${q.person}` : ''))
    expect(new Set(keys).size).toBe(keys.length)
  })

  it('se limite au nombre de combinaisons possibles', () => {
    const qs = buildQuestions(es, { mode: 'tense', tenseIds: ['ind.presente'], count: 10 }, ['ir', 'ser'], seeded(4))
    expect(qs).toHaveLength(2)
  })

  it('liste vide si pas de verbes ou pas de temps', () => {
    expect(buildQuestions(es, { mode: 'form', tenseIds, count: 5 }, [])).toEqual([])
    expect(buildQuestions(es, { mode: 'form', tenseIds: [], count: 5 }, verbs)).toEqual([])
  })
})

describe('config', () => {
  it('valeurs par défaut = temps courants', () => {
    const c = defaultConfig(es)
    expect(c.tenseIds).toContain('ind.presente')
    expect(c.tenseIds).not.toContain('ind.anterior')
  })
  it('normalise une config invalide', () => {
    const c = normalizeConfig({ mode: 'x' as never, tenseIds: ['inconnu'], pool: 'zzz' as never, count: 7 }, es)
    expect(c).toEqual(defaultConfig(es))
  })
  it('garde une config valide', () => {
    const c = normalizeConfig({ mode: 'tense', tenseIds: ['ind.futuro'], pool: 'mine', count: 20 }, es)
    expect(c).toEqual({ mode: 'tense', tenseIds: ['ind.futuro'], pool: 'mine', count: 20 })
  })
  it('pickVerbs fusionne sans doublon', () => {
    expect(pickVerbs(['a', 'b'], ['b', 'c'], 'both')).toEqual(['a', 'b', 'c'])
    expect(pickVerbs(['a'], ['c'], 'mine')).toEqual(['c'])
  })
})
