import { Link } from 'react-router-dom'
import { useI18n } from '../i18n'

export default function Home() {
  const { t } = useI18n()
  return (
    <>
      <h1>{t('home.title')}</h1>
      <p className="muted">{t('home.subtitle')}</p>
      <div className="cards">
        <Link to="/vocab" className="card">
          <h2>{t('home.vocab')}</h2>
          <p>{t('home.vocab.desc')}</p>
        </Link>
        <Link to="/conjugation" className="card">
          <h2>{t('home.conj')}</h2>
          <p>{t('home.conj.desc')}</p>
        </Link>
      </div>
    </>
  )
}
