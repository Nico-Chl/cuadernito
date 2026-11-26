import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { Link } from 'react-router-dom'
import { loadEngine, type LanguageEngine } from '../conj'
import { getSetting, setSetting } from '../db'
import { useI18n } from '../i18n'
import { checkAnswer, type Verdict } from '../lib/answer'
import { COMMON_VERBS } from '../lib/commonVerbs'
import {
  buildQuestions,
  COUNTS,
  normalizeConfig,
  pickVerbs,
  type Question,
  type QuizConfig,
  type QuizMode,
  type QuizPool,
} from '../lib/conjQuiz'
import { loadMyVerbs, STUDY_LANG } from '../lib/words'

const SETTING_KEY = 'conjQuizConfig'

export default function ConjQuiz() {
  const { t } = useI18n()
  const [engine, setEngine] = useState<LanguageEngine | null>(null)
  const [failed, setFailed] = useState(false)
  const [myVerbs, setMyVerbs] = useState<string[]>([])
  const [config, setConfig] = useState<QuizConfig | null>(null)
  const [questions, setQuestions] = useState<Question[] | null>(null)
  const [empty, setEmpty] = useState(false)
  // Change à chaque partie : remet à zéro l'état de <Run> (index, score, champs) quand on rejoue.
  const [session, setSession] = useState(0)

  useEffect(() => {
    void (async () => {
      const e = await loadEngine(STUDY_LANG)
      const saved = await getSetting<Partial<QuizConfig> | null>(SETTING_KEY, null)
      setMyVerbs(await loadMyVerbs(e))
      setConfig(normalizeConfig(saved, e))
      setEngine(e)
    })().catch(() => setFailed(true))
  }, [])

  if (failed) {
    return (
      <>
        <h1>{t('quiz.title')}</h1>
        <p role="alert" className="status verdict-wrong">
          {t('conj.loadError')}
        </p>
      </>
    )
  }
  if (!engine || !config) return <h1>{t('quiz.title')}</h1>

  const common = COMMON_VERBS[STUDY_LANG] ?? []

  function start(cfg: QuizConfig) {
    if (!engine) return
    const verbs = pickVerbs(common, myVerbs, cfg.pool)
    const qs = buildQuestions(engine, cfg, verbs)
    setEmpty(qs.length === 0)
    if (qs.length === 0) return
    void setSetting(SETTING_KEY, cfg)
    setSession((s) => s + 1)
    setQuestions(qs)
  }

  if (questions) {
    return (
      <Run
        key={session}
        engine={engine}
        questions={questions}
        onReplay={() => start(config)}
        onSetup={() => setQuestions(null)}
      />
    )
  }

  return (
    <Setup
      engine={engine}
      config={config}
      setConfig={setConfig}
      commonCount={common.length}
      myCount={myVerbs.length}
      empty={empty}
      onStart={() => start(config)}
    />
  )
}

function Setup({
  engine,
  config,
  setConfig,
  commonCount,
  myCount,
  empty,
  onStart,
}: {
  engine: LanguageEngine
  config: QuizConfig
  setConfig: (c: QuizConfig) => void
  commonCount: number
  myCount: number
  empty: boolean
  onStart: () => void
}) {
  const { t, lang } = useI18n()
  const patch = (p: Partial<QuizConfig>) => setConfig({ ...config, ...p })

  const toggleTense = (id: string) =>
    patch({
      tenseIds: config.tenseIds.includes(id)
        ? config.tenseIds.filter((x) => x !== id)
        : [...config.tenseIds, id],
    })

  const modes: [QuizMode, string][] = [
    ['form', t('quiz.mode.form')],
    ['tense', t('quiz.mode.tense')],
  ]
  const pools: [QuizPool, string][] = [
    ['common', t('quiz.pool.common', { n: commonCount })],
    ['mine', t('quiz.pool.mine', { n: myCount })],
    ['both', t('quiz.pool.both', { n: commonCount + myCount })],
  ]

  const noTenses = config.tenseIds.length === 0
  const noMine = config.pool === 'mine' && myCount === 0

  return (
    <>
      <div className="row spread">
        <h1>{t('quiz.title')}</h1>
        <Link to="/conjugation" className="back-link">
          {t('quiz.backToGrid')}
        </Link>
      </div>

      <fieldset className="section">
        <legend>{t('quiz.mode')}</legend>
        {modes.map(([value, label]) => (
          <label key={value} className="choice">
            <input type="radio" name="mode" checked={config.mode === value} onChange={() => patch({ mode: value })} />
            {label}
          </label>
        ))}
      </fieldset>

      <fieldset className="section">
        <legend>{t('quiz.pool')}</legend>
        {pools.map(([value, label]) => (
          <label key={value} className="choice">
            <input type="radio" name="pool" checked={config.pool === value} onChange={() => patch({ pool: value })} />
            {label}
          </label>
        ))}
        {noMine && <p className="muted small-text">{t('quiz.noMine')}</p>}
      </fieldset>

      <div className="section">
        <label htmlFor="count">{t('quiz.count')}</label>
        <select id="count" value={config.count} onChange={(e) => patch({ count: Number(e.target.value) })}>
          {COUNTS.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>

      <div className="section">
        <h2>{t('quiz.tenses')}</h2>
        {engine.moods.map((mood) => (
          <fieldset key={mood.id} className="tense-choices">
            <legend>{mood.labels[lang]}</legend>
            {engine.tenses
              .filter((x) => x.mood === mood.id)
              .map((x) => (
                <label key={x.id} className="choice">
                  <input
                    type="checkbox"
                    checked={config.tenseIds.includes(x.id)}
                    onChange={() => toggleTense(x.id)}
                  />
                  {x.labels[lang]}
                </label>
              ))}
          </fieldset>
        ))}
      </div>

      {noTenses && <p className="muted">{t('quiz.noTenses')}</p>}
      {empty && !noTenses && !noMine && <p className="muted">{t('quiz.noQuestions')}</p>}
      <div className="row">
        <button type="button" onClick={onStart} disabled={noTenses || noMine}>
          {t('quiz.start')}
        </button>
      </div>
    </>
  )
}

function Run({
  engine,
  questions,
  onReplay,
  onSetup,
}: {
  engine: LanguageEngine
  questions: Question[]
  onReplay: () => void
  onSetup: () => void
}) {
  const { t, lang } = useI18n()
  const [index, setIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [inputs, setInputs] = useState<string[]>([])
  const [verdicts, setVerdicts] = useState<Verdict[] | null>(null)
  const refs = useRef<(HTMLInputElement | null)[]>([])

  if (index >= questions.length) {
    return (
      <>
        <h1>{t('quiz.title')}</h1>
        <p className="result">{t('quiz.done', { correct: score, total: questions.length })}</p>
        <div className="row">
          <button type="button" onClick={onReplay}>
            {t('quiz.replay')}
          </button>
          <button type="button" className="secondary" onClick={onSetup}>
            {t('quiz.edit')}
          </button>
        </div>
      </>
    )
  }

  const q = questions[index]
  const rows = q.kind === 'form' ? [{ person: q.person, expected: q.expected }] : q.answers
  const tense = engine.tenses.find((x) => x.id === q.tenseId)
  const allOk = verdicts?.every((v) => v !== 'wrong') ?? false

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (verdicts) {
      setIndex((i) => i + 1)
      setInputs([])
      setVerdicts(null)
      return
    }
    const vs = rows.map((r, k) => checkAnswer(inputs[k] ?? '', r.expected))
    setVerdicts(vs)
    if (vs.every((v) => v !== 'wrong')) setScore((s) => s + 1)
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>, k: number) {
    if (e.key === 'Enter' && !verdicts && k < rows.length - 1) {
      e.preventDefault()
      refs.current[k + 1]?.focus()
    }
  }

  return (
    <>
      <div className="row spread">
        <h1>{t('quiz.title')}</h1>
        <span className="muted">{t('review.progress', { i: index + 1, n: questions.length })}</span>
      </div>

      <p className="muted">{t(q.kind === 'form' ? 'quiz.prompt.form' : 'quiz.prompt.tense')}</p>
      <p className="question">{q.verb}</p>
      <p className="tense-name">{tense?.labels[lang]}</p>

      <form onSubmit={onSubmit}>
        {rows.map((r, k) => {
          const v = verdicts?.[k]
          return (
            <div key={`${index}-${r.person}`} className="quiz-row">
              <label htmlFor={`f${k}`}>{engine.persons[r.person]}</label>
              <input
                id={`f${k}`}
                ref={(el) => {
                  refs.current[k] = el
                }}
                value={inputs[k] ?? ''}
                onChange={(e) => {
                  const next = [...inputs]
                  next[k] = e.target.value
                  setInputs(next)
                }}
                onKeyDown={(e) => onKeyDown(e, k)}
                className={v ? `verdict-input verdict-${v}` : undefined}
                autoFocus={k === 0}
                autoCapitalize="none"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                readOnly={verdicts !== null}
              />
              {v && v !== 'correct' && <span className={`expected verdict-${v}`}>{r.expected}</span>}
            </div>
          )
        })}

        {verdicts && (
          <p role="status" className={`status ${allOk ? 'verdict-correct' : 'verdict-wrong'}`}>
            {allOk
              ? verdicts.includes('accent')
                ? t('quiz.accent')
                : t('review.correct')
              : t('quiz.incorrect')}
          </p>
        )}

        <div className="row">
          <button type="submit">{verdicts === null ? t('review.check') : t('review.next')}</button>
        </div>
      </form>
    </>
  )
}
