import { useEffect, useState } from 'react'
import { getSetting, setSetting } from '../db'
import { useI18n, type MessageKey } from '../i18n'
import { promptInstall, useInstall, type Platform } from '../lib/install'

const DISMISS_KEY = 'installHintDismissed'

/** Icône « Partager » d'iOS (carré avec une flèche vers le haut). */
function ShareIcon() {
  return (
    <svg className="inline-icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        d="M12 3v12M8 7l4-4 4 4M6 11H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-1"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function Steps({ platform }: { platform: Exclude<Platform, 'other'> }) {
  const { t } = useI18n()
  const keys: MessageKey[] =
    platform === 'ios'
      ? ['install.ios.1', 'install.ios.2', 'install.ios.3', 'install.ios.4']
      : ['install.android.1', 'install.android.2', 'install.android.3']
  return (
    <ol className="install-steps">
      {keys.map((k) => (
        <li key={k}>
          {t(k)}
          {k === 'install.ios.2' && <ShareIcon />}
        </li>
      ))}
    </ol>
  )
}

/**
 * Explique comment installer l'app sur l'écran d'accueil.
 * `dismissible` : variante de l'accueil, qu'on peut masquer ; elle disparaît aussi une fois l'app installée.
 */
export default function InstallCard({ dismissible = false }: { dismissible?: boolean }) {
  const { t } = useI18n()
  const { installed, canPrompt, platform } = useInstall()
  const [dismissed, setDismissed] = useState<boolean | null>(dismissible ? null : false)

  useEffect(() => {
    if (!dismissible) return
    void getSetting(DISMISS_KEY, false).then(setDismissed)
  }, [dismissible])

  if (dismissed === null) return null
  if (dismissible && (dismissed || installed)) return null

  function dismiss() {
    setDismissed(true)
    void setSetting(DISMISS_KEY, true)
  }

  return (
    <section className="install-card" aria-labelledby="install-title">
      <h2 id="install-title">{t('install.title')}</h2>

      {installed ? (
        <p className="muted">{t('install.installed')}</p>
      ) : (
        <>
          <p className="muted">{t('install.intro')}</p>

          {canPrompt && (
            <button type="button" onClick={() => void promptInstall()}>
              {t('install.button')}
            </button>
          )}

          {platform === 'ios' && (
            <>
              <h3>{t('install.ios.title')}</h3>
              <Steps platform="ios" />
            </>
          )}

          {platform === 'android' && (
            <>
              <h3>{t('install.android.title')}</h3>
              <Steps platform="android" />
            </>
          )}

          {platform === 'other' && (
            <>
              <p className="muted">{t('install.desktop')}</p>
              <details className="more">
                <summary>{t('install.ios.title')}</summary>
                <Steps platform="ios" />
              </details>
              <details className="more">
                <summary>{t('install.android.title')}</summary>
                <Steps platform="android" />
              </details>
            </>
          )}
        </>
      )}

      {dismissible && (
        <button type="button" className="secondary small" onClick={dismiss}>
          {t('install.dismiss')}
        </button>
      )}
    </section>
  )
}
