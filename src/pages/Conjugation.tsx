import { useI18n } from '../i18n'

export default function Conjugation() {
  const { t } = useI18n()
  return (
    <>
      <h1>{t('conj.title')}</h1>
      <p className="muted">{t('conj.empty')}</p>
    </>
  )
}
