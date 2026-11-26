import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { loadEngine, type ConjugationTable, type LanguageEngine } from '../conj'
import { useI18n } from '../i18n'
import { STUDY_LANG } from '../lib/words'

export default function Conjugation() {
  const { t } = useI18n()
  const { verb } = useParams()
  const navigate = useNavigate()
  const [engine, setEngine] = useState<LanguageEngine | null>(null)
  const [failed, setFailed] = useState(false)
  const [query, setQuery] = useState('')

  useEffect(() => {
    loadEngine(STUDY_LANG).then(setEngine, () => setFailed(true))
  }, [])

  const suggestions = useMemo(() => (engine && query ? engine.search(query, 8) : []), [engine, query])

  function open(v: string) {
    setQuery('')
    void navigate(`/conjugation/${encodeURIComponent(v)}`)
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    const q = query.trim().toLowerCase()
    if (!engine || !q) return
    if (engine.hasVerb(q)) open(q)
    else if (suggestions[0]) open(suggestions[0])
  }

  if (failed) {
    return (
      <>
        <h1>{t('conj.title')}</h1>
        <p role="alert" className="status verdict-wrong">
          {t('conj.loadError')}
        </p>
      </>
    )
  }

  return (
    <>
      <h1>{t('conj.title')}</h1>

      <form onSubmit={onSubmit} role="search">
        <label htmlFor="verb-search" className="sr-only">
          {t('conj.search')}
        </label>
        <input
          id="verb-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={engine ? t('conj.search') : t('conj.loading')}
          disabled={!engine}
          autoCapitalize="none"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
        />
      </form>

      {suggestions.length > 0 && (
        <ul className="suggestions" aria-label={t('conj.suggestions')}>
          {suggestions.map((s) => (
            <li key={s}>
              <button type="button" className="suggestion" onClick={() => open(s)}>
                {s}
              </button>
            </li>
          ))}
        </ul>
      )}
      {engine && query && suggestions.length === 0 && <p className="muted">{t('conj.noResult')}</p>}

      {engine && !verb && !query && (
        <p className="muted">{t('conj.hint', { n: engine.verbCount().toLocaleString() })}</p>
      )}

      {engine && verb && !query && <VerbView key={verb} engine={engine} verb={verb} />}
    </>
  )
}

function VerbView({ engine, verb }: { engine: LanguageEngine; verb: string }) {
  const { t, lang } = useI18n()
  const tables = useMemo(() => engine.conjugate(verb), [engine, verb])
  const [model, setModel] = useState(0)

  if (tables.length === 0) {
    return (
      <p role="status" className="status">
        {t('conj.unknown', { verb })}{' '}
        <Link to="/conjugation">{t('conj.back')}</Link>
      </p>
    )
  }

  const table = tables[Math.min(model, tables.length - 1)]

  return (
    <section className="verb-view">
      <h2 className="verb-title">{table.infinitive}</h2>

      {tables.length > 1 && (
        <div className="row models" role="group" aria-label={t('conj.models')}>
          {tables.map((_, i) => (
            <button
              key={i}
              type="button"
              className={i === model ? 'small' : 'small secondary'}
              aria-pressed={i === model}
              onClick={() => setModel(i)}
            >
              {t('conj.model', { i: i + 1, n: tables.length })}
            </button>
          ))}
        </div>
      )}

      <dl className="impersonal">
        <div>
          <dt>{t('conj.infinitive')}</dt>
          <dd>{table.infinitive}</dd>
        </div>
        <div>
          <dt>{t('conj.gerund')}</dt>
          <dd>{table.gerund || '—'}</dd>
        </div>
        <div>
          <dt>{t('conj.participle')}</dt>
          <dd>{table.participle && table.participle !== '-' ? table.participle : '—'}</dd>
        </div>
      </dl>

      {engine.moods.map((mood) => {
        const tenses = engine.tenses.filter((x) => x.mood === mood.id)
        const common = tenses.filter((x) => x.common)
        const rare = tenses.filter((x) => !x.common)
        return (
          <section key={mood.id} className="mood">
            <h3>{mood.labels[lang]}</h3>
            <div className="tense-grid">
              {common.map((x) => (
                <TenseCard key={x.id} engine={engine} table={table} id={x.id} label={x.labels[lang]} />
              ))}
            </div>
            {rare.length > 0 && (
              <details className="more">
                <summary>{t('conj.more')}</summary>
                <div className="tense-grid">
                  {rare.map((x) => (
                    <TenseCard key={x.id} engine={engine} table={table} id={x.id} label={x.labels[lang]} />
                  ))}
                </div>
              </details>
            )}
          </section>
        )
      })}
    </section>
  )
}

function TenseCard({
  engine,
  table,
  id,
  label,
}: {
  engine: LanguageEngine
  table: ConjugationTable
  id: string
  label: string
}) {
  const forms = table.tenses[id] ?? []
  return (
    <div className="tense">
      <h4>{label}</h4>
      <table>
        <tbody>
          {engine.persons.map((person, i) => (
            <tr key={person}>
              <th scope="row">{person}</th>
              <td className={forms[i] ? undefined : 'absent'}>{forms[i] ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
