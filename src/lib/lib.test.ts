import { describe, expect, it } from 'vitest'
import { checkAnswer } from './answer'
import { parseCsv, rowsToWords } from './csv'
import { addDays, nextState, startOfDay } from './srs'

describe('nextState', () => {
  const now = new Date(2026, 0, 10, 15, 30).getTime()
  const day = (n: number) => addDays(startOfDay(now), n)

  it('nouvelle carte juste → 1 semaine', () => {
    const s = nextState(0, true, now)
    expect(s.box).toBe(1)
    expect(s.due).toBe(day(7))
  })
  it('juste après 1 semaine → 1 mois', () => {
    expect(nextState(1, true, now)).toMatchObject({ box: 2, due: day(30) })
  })
  it('faux à tout niveau → lendemain, boîte 0', () => {
    for (const box of [0, 1, 2, 4]) {
      expect(nextState(box, false, now)).toMatchObject({ box: 0, due: day(1) })
    }
  })
  it('plafonne à la dernière boîte', () => {
    expect(nextState(4, true, now).box).toBe(4)
  })
})

describe('checkAnswer', () => {
  it('exact, insensible à la casse et aux espaces', () => {
    expect(checkAnswer('  Casa ', 'casa')).toBe('correct')
  })
  it('accent manquant → accent', () => {
    expect(checkAnswer('esta', 'está')).toBe('accent')
  })
  it('ñ n’est pas un accent', () => {
    expect(checkAnswer('ano', 'año')).toBe('wrong')
    expect(checkAnswer('año', 'año')).toBe('correct')
  })
  it('accepte une des variantes', () => {
    expect(checkAnswer('foyer', 'maison / foyer')).toBe('correct')
    expect(checkAnswer('maison', 'maison, foyer')).toBe('correct')
  })
  it('vide ou faux → wrong', () => {
    expect(checkAnswer('', 'casa')).toBe('wrong')
    expect(checkAnswer('perro', 'casa')).toBe('wrong')
  })
})

describe('csv', () => {
  it('détecte ; et ignore l’en-tête', () => {
    const rows = parseCsv('mot;traduction;note\ncasa;maison;f.\nperro;chien')
    expect(rowsToWords(rows)).toEqual([
      { term: 'casa', translation: 'maison', note: 'f.' },
      { term: 'perro', translation: 'chien' },
    ])
  })
  it('gère les guillemets et les virgules', () => {
    const rows = parseCsv('"hola, amigo","salut, l’ami"\r\nadiós,au revoir')
    expect(rows).toEqual([
      ['hola, amigo', 'salut, l’ami'],
      ['adiós', 'au revoir'],
    ])
  })
  it('ignore les lignes incomplètes et vides', () => {
    expect(rowsToWords(parseCsv('casa;maison\n\nseul;\n'))).toEqual([
      { term: 'casa', translation: 'maison' },
    ])
  })
})
