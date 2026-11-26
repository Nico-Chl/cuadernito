import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { getSetting, setSetting } from './db'

/** Langues d'interface disponibles. Ajouter une langue = ajouter un dictionnaire. */
export const UI_LANGS = { fr: 'Français', en: 'English' } as const
export type UiLang = keyof typeof UI_LANGS

const fr = {
  'nav.home': 'Accueil',
  'nav.vocab': 'Vocabulaire',
  'nav.conj': 'Conjugaison',
  'nav.settings': 'Réglages',

  'home.title': 'Cuadernito',
  'home.subtitle': 'Vocabulaire et conjugaison, même hors ligne.',
  'home.vocab': 'Vocabulaire',
  'home.vocab.desc': 'Ajoute des mots et révise-les au bon moment.',
  'home.conj': 'Conjugaison',
  'home.conj.desc': 'Grilles de conjugaison et exercices.',
  'home.soon': 'Bientôt',

  'vocab.title': 'Vocabulaire',
  'vocab.empty': 'Aucun mot pour l’instant.',
  'conj.title': 'Conjugaison',
  'conj.empty': 'La conjugaison arrive bientôt.',

  'settings.title': 'Réglages',
  'settings.language': 'Langue de l’interface',
  'settings.backup': 'Sauvegarde',
  'settings.backup.desc':
    'Tes données restent sur cet appareil. Exporte un fichier pour les sauvegarder ou les transférer.',
  'settings.export': 'Exporter',
  'settings.import': 'Importer',
  'settings.import.confirm': 'Importer remplacera toutes tes données actuelles. Continuer ?',
  'settings.import.ok': 'Import réussi : {words} mots, {cards} cartes.',
  'settings.import.invalid': 'Fichier invalide.',
  'settings.import.tooNew': 'Ce fichier vient d’une version plus récente de l’app.',
  'settings.offline': 'Prêt pour une utilisation hors ligne.',
}

const en: typeof fr = {
  'nav.home': 'Home',
  'nav.vocab': 'Vocabulary',
  'nav.conj': 'Conjugation',
  'nav.settings': 'Settings',

  'home.title': 'Cuadernito',
  'home.subtitle': 'Vocabulary and conjugation, even offline.',
  'home.vocab': 'Vocabulary',
  'home.vocab.desc': 'Add words and review them at the right time.',
  'home.conj': 'Conjugation',
  'home.conj.desc': 'Conjugation tables and drills.',
  'home.soon': 'Soon',

  'vocab.title': 'Vocabulary',
  'vocab.empty': 'No words yet.',
  'conj.title': 'Conjugation',
  'conj.empty': 'Conjugation is coming soon.',

  'settings.title': 'Settings',
  'settings.language': 'Interface language',
  'settings.backup': 'Backup',
  'settings.backup.desc':
    'Your data stays on this device. Export a file to back it up or move it.',
  'settings.export': 'Export',
  'settings.import': 'Import',
  'settings.import.confirm': 'Importing will replace all your current data. Continue?',
  'settings.import.ok': 'Import successful: {words} words, {cards} cards.',
  'settings.import.invalid': 'Invalid file.',
  'settings.import.tooNew': 'This file comes from a newer version of the app.',
  'settings.offline': 'Ready for offline use.',
}

export type MessageKey = keyof typeof fr
const dictionaries: Record<UiLang, typeof fr> = { fr, en }

type Vars = Record<string, string | number>

interface I18n {
  lang: UiLang
  setLang: (l: UiLang) => void
  t: (key: MessageKey, vars?: Vars) => string
}

const Ctx = createContext<I18n | null>(null)

function detectLang(): UiLang {
  const nav = navigator.language.slice(0, 2)
  return nav in UI_LANGS ? (nav as UiLang) : 'fr'
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<UiLang>(detectLang)

  useEffect(() => {
    getSetting<UiLang | null>('uiLang', null).then((saved) => {
      if (saved && saved in UI_LANGS) setLangState(saved)
    })
  }, [])

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  const value: I18n = {
    lang,
    setLang: (l) => {
      setLangState(l)
      void setSetting('uiLang', l)
    },
    t: (key, vars) => {
      let s = dictionaries[lang][key]
      if (vars) for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, String(v))
      return s
    },
  }

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useI18n(): I18n {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useI18n outside I18nProvider')
  return ctx
}
