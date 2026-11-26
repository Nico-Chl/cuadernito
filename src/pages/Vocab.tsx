import { useLiveQuery } from 'dexie-react-hooks'
import { useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { db, type Word } from '../db'
import { useI18n } from '../i18n'
import { parseCsv, rowsToWords } from '../lib/csv'
import { addWord, deleteWord, importWords, STUDY_LANG, updateWord } from '../lib/words'

export default function Vocab() {
  const { t } = useI18n()
  const words = useLiveQuery(
    () => db.words.where('lang').equals(STUDY_LANG).reverse().sortBy('createdAt'),
    [],
  )
  // filter() plutôt que where().belowOrEqual(now): la plage observée par la requête live
  // serait figée à l'heure de la requête et ignorerait les cartes ajoutées ensuite.
  const dueCount = useLiveQuery(() => db.cards.filter((c) => c.due <= Date.now()).count(), [])

  const [editing, setEditing] = useState<Word | null>(null)
  const [term, setTerm] = useState('')
  const [translation, setTranslation] = useState('')
  const [note, setNote] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const termRef = useRef<HTMLInputElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function reset() {
    setEditing(null)
    setTerm('')
    setTranslation('')
    setNote('')
  }

  function startEdit(w: Word) {
    setEditing(w)
    setTerm(w.term)
    setTranslation(w.translation)
    setNote(w.note ?? '')
    setMessage(null)
    termRef.current?.focus()
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!term.trim() || !translation.trim()) return
    if (editing) {
      await updateWord(editing.id, { term, translation, note })
      setMessage(null)
      reset()
      return
    }
    const added = await addWord({ term, translation, note })
    setMessage(added ? null : t('vocab.duplicate'))
    if (added) {
      reset()
      termRef.current?.focus()
    }
  }

  async function onDelete(w: Word) {
    if (!window.confirm(t('vocab.delete.confirm', { term: w.term }))) return
    await deleteWord(w.id)
    if (editing?.id === w.id) reset()
  }

  async function onImport(file: File | undefined) {
    if (!file) return
    const rows = rowsToWords(parseCsv(await file.text()))
    const r = await importWords(rows)
    setMessage(t('vocab.import.result', r))
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <>
      <h1>{t('vocab.title')}</h1>

      <div className="review-cta">
        {dueCount ? (
          <Link to="/review" className="button">
            {t('vocab.review')} ({dueCount})
          </Link>
        ) : (
          <p className="muted">{t('vocab.nothingDue')}</p>
        )}
      </div>

      <form className="section word-form" onSubmit={(e) => void onSubmit(e)}>
        <label htmlFor="term">{t('vocab.term')}</label>
        <input
          id="term"
          ref={termRef}
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          autoCapitalize="none"
          autoComplete="off"
          required
        />
        <label htmlFor="translation">{t('vocab.translation')}</label>
        <input
          id="translation"
          value={translation}
          onChange={(e) => setTranslation(e.target.value)}
          autoComplete="off"
          required
        />
        <label htmlFor="note">{t('vocab.note')}</label>
        <input id="note" value={note} onChange={(e) => setNote(e.target.value)} autoComplete="off" />
        <div className="row">
          <button type="submit">{editing ? t('vocab.save') : t('vocab.add')}</button>
          {editing && (
            <button type="button" className="secondary" onClick={reset}>
              {t('vocab.cancel')}
            </button>
          )}
        </div>
      </form>

      {message && (
        <p role="status" className="status">
          {message}
        </p>
      )}

      <section className="section">
        <div className="row spread">
          <h2>{t('vocab.count', { n: words?.length ?? 0 })}</h2>
          <button type="button" className="secondary small" onClick={() => fileRef.current?.click()}>
            {t('vocab.importCsv')}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.tsv,.txt,text/csv,text/plain"
            hidden
            onChange={(e) => void onImport(e.target.files?.[0])}
          />
        </div>
        <p className="muted small-text">{t('vocab.import.help')}</p>

        {words?.length === 0 && <p className="muted">{t('vocab.empty')}</p>}
        <ul className="word-list">
          {words?.map((w) => (
            <li key={w.id}>
              <div className="word-main">
                <strong>{w.term}</strong>
                <span>{w.translation}</span>
                {w.note && <em className="muted">{w.note}</em>}
              </div>
              <div className="word-actions">
                <button type="button" className="secondary small" onClick={() => startEdit(w)}>
                  {t('vocab.edit')}
                </button>
                <button type="button" className="secondary small danger" onClick={() => void onDelete(w)}>
                  {t('vocab.delete')}
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </>
  )
}
