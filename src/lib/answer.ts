export type Verdict = 'correct' | 'accent' | 'wrong'

const TILDE_PLACEHOLDER = '\u0001'

function clean(s: string): string {
  return s
    .normalize('NFC')
    .toLowerCase()
    .replace(/[¿¡?!.]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Retire les accents mais garde le ñ (año ≠ ano). */
function stripAccents(s: string): string {
  return s
    .normalize('NFD')
    .replace(/ñ/g, TILDE_PLACEHOLDER)
    .replace(/\p{M}/gu, '')
    .replaceAll(TILDE_PLACEHOLDER, 'ñ')
}

/** Une réponse attendue peut contenir plusieurs variantes : « maison / foyer ». */
export function variants(expected: string): string[] {
  return expected
    .split(/[/;,]/)
    .map(clean)
    .filter(Boolean)
}

export function checkAnswer(input: string, expected: string): Verdict {
  const given = clean(input)
  if (!given) return 'wrong'
  const options = variants(expected)
  if (options.includes(given)) return 'correct'
  const givenBase = stripAccents(given)
  if (options.some((o) => stripAccents(o) === givenBase)) return 'accent'
  return 'wrong'
}
