import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { useI18n } from '../i18n'

export default function Vocab() {
  const { t } = useI18n()
  const count = useLiveQuery(() => db.words.count(), [])
  return (
    <>
      <h1>{t('vocab.title')}</h1>
      {count === 0 && <p className="muted">{t('vocab.empty')}</p>}
    </>
  )
}
