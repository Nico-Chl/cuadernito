import { useSyncExternalStore } from 'react'

export type Platform = 'ios' | 'android' | 'other'

/** Détecte le système à partir du user-agent (iPadOS récent se présente comme un Mac tactile). */
export function detectPlatform(ua: string, maxTouchPoints = 0): Platform {
  if (/iPhone|iPad|iPod/.test(ua)) return 'ios'
  if (/Macintosh/.test(ua) && maxTouchPoints > 1) return 'ios'
  if (/Android/.test(ua)) return 'android'
  return 'other'
}

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

interface InstallState {
  /** L'app tourne déjà en mode « application » (installée). */
  installed: boolean
  /** Le navigateur propose une installation en un clic (Chrome / Edge / Android). */
  canPrompt: boolean
}

function detectInstalled(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

let deferred: BeforeInstallPromptEvent | null = null
let state: InstallState = { installed: detectInstalled(), canPrompt: false }
const listeners = new Set<() => void>()

function update(patch: Partial<InstallState>) {
  state = { ...state, ...patch }
  listeners.forEach((l) => l())
}

// L'événement ne part qu'une fois, parfois avant le rendu de React : on l'écoute dès l'import.
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferred = e as BeforeInstallPromptEvent
    update({ canPrompt: true })
  })
  window.addEventListener('appinstalled', () => {
    deferred = null
    update({ installed: true, canPrompt: false })
  })
}

export async function promptInstall(): Promise<void> {
  if (!deferred) return
  const ev = deferred
  deferred = null
  update({ canPrompt: false })
  await ev.prompt()
  await ev.userChoice
}

const subscribe = (cb: () => void) => {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

export function useInstall(): InstallState & { platform: Platform } {
  const s = useSyncExternalStore(subscribe, () => state)
  return { ...s, platform: detectPlatform(navigator.userAgent, navigator.maxTouchPoints) }
}
