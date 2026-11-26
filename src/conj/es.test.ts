import { describe, expect, it } from 'vitest'
import { createSpanishEngine, ES_TENSES, fold } from './es'

const es = createSpanishEngine()
const first = (verb: string) => es.conjugate(verb)[0]

describe('moteur espagnol', () => {
  it('couvre tous les temps déclarés pour chaque verbe testé', () => {
    for (const v of ['hablar', 'comer', 'vivir', 'ir', 'ser', 'tener', 'pedir', 'volver', 'dormir']) {
      const table = first(v)
      for (const tense of ES_TENSES) expect(table.tenses[tense.id], `${v} ${tense.id}`).toHaveLength(6)
    }
  })

  it('verbe régulier', () => {
    const t = first('hablar')
    expect(t.tenses['ind.presente']).toEqual(['hablo', 'hablas', 'habla', 'hablamos', 'habláis', 'hablan'])
    expect(t.tenses['ind.futuro'][0]).toBe('hablaré')
    expect(t.participle).toBe('hablado')
    expect(t.gerund).toBe('hablando')
  })

  it('irréguliers', () => {
    expect(first('ir').tenses['ind.indefinido']).toEqual(['fui', 'fuiste', 'fue', 'fuimos', 'fuisteis', 'fueron'])
    expect(first('tener').tenses['ind.futuro'][0]).toBe('tendré')
    expect(first('pedir').tenses['ind.presente'][0]).toBe('pido')
    expect(first('volver').participle).toBe('vuelto')
    expect(first('dormir').tenses['sub.imperfectoRa'][2]).toBe('durmiera')
  })

  it('temps composés', () => {
    expect(first('ir').tenses['ind.perfecto'][0]).toBe('he ido')
    expect(first('ir').tenses['ind.pluscuamperfecto'][3]).toBe('habíamos ido')
  })

  it('impératif : yo absent, usted/ustedes ajoutés depuis la région formal', () => {
    const imp = first('hablar').tenses['imp.afirmativo']
    expect(imp).toEqual([null, 'habla', 'hable', 'hablemos', 'hablad', 'hablen'])
    expect(first('hablar').tenses['imp.negativo']).toEqual([
      null, 'no hables', 'no hable', 'no hablemos', 'no habléis', 'no hablen',
    ])
    expect(first('acercarse').tenses['imp.afirmativo'][2]).toBe('acérquese')
    expect(first('hablar').tenses['imp.negativo'][1]).toBe('no hables')
  })

  it('verbe inconnu → liste vide', () => {
    expect(es.conjugate('xyzzy')).toEqual([])
    expect(es.hasVerb('xyzzy')).toBe(false)
    expect(es.hasVerb('hablar')).toBe(true)
  })
})

describe('recherche', () => {
  it('insensible aux accents et à la casse, préfixe d’abord', () => {
    expect(es.search('ESTAR')).toContain('estar')
    expect(es.search('anadir')).toContain('añadir')
    expect(es.search('añadir')).toContain('añadir')
    expect(es.search('cantar')[0]).toBe('cantar')
    expect(es.search('')).toEqual([])
  })
  it('fold garde le ñ', () => {
    expect(fold('Añadir')).toBe('añadir')
    expect(fold('está')).toBe('esta')
  })
  it('compte les verbes', () => {
    expect(es.verbCount()).toBeGreaterThan(14000)
  })
})
