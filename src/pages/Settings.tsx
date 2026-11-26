import { useRef, useState } from 'react'
import { exportBackupToFile, importBackup } from '../backup'
import { UI_LANGS, useI18n, type UiLang } from '../i18n'

export default function Settings() {
  const { t, lang, setLang } = useI18n()
  const fileRef = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState<string | null>(null)

  async function onImport(file: File | undefined) {
    if (!file) return
    if (!window.confirm(t('settings.import.confirm'))) return
    try {
      const r = await importBackup(file)
      setMessage(t('settings.import.ok', r))
    } catch (e) {
      setMessage(
        e instanceof Error && e.message === 'too-new'
          ? t('settings.import.tooNew')
          : t('settings.import.invalid'),
      )
    } finally {
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <>
      <h1>{t('settings.title')}</h1>

      <section className="section">
        <label htmlFor="ui-lang">{t('settings.language')}</label>
        <select id="ui-lang" value={lang} onChange={(e) => setLang(e.target.value as UiLang)}>
          {Object.entries(UI_LANGS).map(([code, name]) => (
            <option key={code} value={code}>
              {name}
            </option>
          ))}
        </select>
      </section>

      <section className="section">
        <h2>{t('settings.backup')}</h2>
        <p className="muted">{t('settings.backup.desc')}</p>
        <div className="row">
          <button type="button" onClick={() => void exportBackupToFile()}>
            {t('settings.export')}
          </button>
          <button type="button" className="secondary" onClick={() => fileRef.current?.click()}>
            {t('settings.import')}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => void onImport(e.target.files?.[0])}
          />
        </div>
        {message && (
          <p role="status" className="status">
            {message}
          </p>
        )}
      </section>
    </>
  )
}
