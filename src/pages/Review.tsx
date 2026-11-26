import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useI18n } from '../i18n'
import { checkAnswer, type Verdict } from '../lib/answer'
import { loadDueItems, recordAnswer, type DueItem } from '../lib/words'

export default function Review() {
  const { t } = useI18n()
  const [queue, setQueue] = useState<DueItem[] | null>(null)
  const [index, setIndex] = useState(0)
  const [answer, setAnswer] = useState('')
  const [verdict, setVerdict] = useState<Verdict | null>(null)
  const [score, setScore] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    void loadDueItems().then(setQueue)
  }, [])

  useEffect(() => {
    if (verdict === null) inputRef.current?.focus()
  }, [index, verdict, queue])

  if (queue === null) return null

  if (queue.length === 0) {
    return (
      <>
        <h1>{t('review.title')}</h1>
        <p className="muted">{t('review.empty')}</p>
        <Link to="/vocab" className="button secondary-button">
          {t('review.back')}
        </Link>
      </>
    )
  }

  if (index >= queue.length) {
    return (
      <>
        <h1>{t('review.title')}</h1>
        <p className="result">{t('review.done', { correct: score, total: queue.length })}</p>
        <Link to="/vocab" className="button">
          {t('review.back')}
        </Link>
      </>
    )
  }

  const item = queue[index]
  const isFwd = item.card.direction === 'fwd'

  async function onCheck(e: FormEvent) {
    e.preventDefault()
    if (verdict !== null) {
      setIndex((i) => i + 1)
      setAnswer('')
      setVerdict(null)
      return
    }
    const v = checkAnswer(answer, item.expected)
    const ok = v !== 'wrong'
    setVerdict(v)
    if (ok) setScore((s) => s + 1)
    await recordAnswer(item.card, ok)
  }

  return (
    <>
      <div className="row spread">
        <h1>{t('review.title')}</h1>
        <span className="muted">{t('review.progress', { i: index + 1, n: queue.length })}</span>
      </div>

      <p className="muted">{t(isFwd ? 'review.prompt.fwd' : 'review.prompt.rev')}</p>
      <p className="question">{item.prompt}</p>
      {item.note && <p className="muted">{item.note}</p>}

      <form onSubmit={(e) => void onCheck(e)}>
        <label htmlFor="answer" className="sr-only">
          {t('review.answer')}
        </label>
        <input
          id="answer"
          ref={inputRef}
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder={t('review.answer')}
          autoCapitalize="none"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          readOnly={verdict !== null}
        />

        {verdict && (
          <p role="status" className={`status verdict-${verdict}`}>
            {verdict === 'correct' && t('review.correct')}
            {verdict === 'accent' && t('review.accent', { answer: item.expected })}
            {verdict === 'wrong' && t('review.wrong', { answer: item.expected })}
          </p>
        )}

        <div className="row">
          <button type="submit">{verdict === null ? t('review.check') : t('review.next')}</button>
        </div>
      </form>
    </>
  )
}
