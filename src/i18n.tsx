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
  'vocab.add': 'Ajouter',
  'vocab.save': 'Enregistrer',
  'vocab.cancel': 'Annuler',
  'vocab.edit': 'Modifier',
  'vocab.delete': 'Supprimer',
  'vocab.delete.confirm': 'Supprimer « {term} » ?',
  'vocab.term': 'Mot en espagnol',
  'vocab.translation': 'Traduction (plusieurs possibles, séparées par « / »)',
  'vocab.note': 'Note (facultatif)',
  'vocab.duplicate': 'Ce mot existe déjà.',
  'vocab.count': '{n} mots',
  'vocab.importCsv': 'Importer un CSV',
  'vocab.import.help': 'Colonnes : mot ; traduction ; note (facultative). Une ligne par mot.',
  'vocab.import.result': '{added} mots ajoutés, {skipped} ignorés (doublons).',
  'vocab.review': 'Réviser',
  'vocab.nothingDue': 'Rien à réviser pour l’instant.',

  'review.title': 'Révision',
  'review.prompt.fwd': 'Traduis en français',
  'review.prompt.rev': 'Traduis en espagnol',
  'review.answer': 'Ta réponse',
  'review.check': 'Vérifier',
  'review.next': 'Suivant',
  'review.correct': 'Correct !',
  'review.accent': 'Presque juste : attention aux accents. Réponse : {answer}',
  'review.wrong': 'Faux. Réponse : {answer}',
  'review.done': 'Terminé : {correct} / {total}',
  'review.empty': 'Aucune carte à réviser.',
  'review.back': 'Retour au vocabulaire',
  'review.progress': '{i} / {n}',
  'conj.title': 'Conjugaison',
  'conj.search': 'Chercher un verbe (ex. hablar)',
  'conj.loading': 'Chargement des verbes…',
  'conj.loadError': 'Impossible de charger les verbes.',
  'conj.suggestions': 'Suggestions de verbes',
  'conj.noResult': 'Aucun verbe trouvé.',
  'conj.hint': 'Tape un verbe à l’infinitif. {n} verbes disponibles.',
  'conj.unknown': '« {verb} » n’est pas un verbe connu.',
  'conj.back': 'Nouvelle recherche',
  'conj.models': 'Modèles de conjugaison',
  'conj.model': 'Modèle {i}/{n}',
  'conj.infinitive': 'Infinitif',
  'conj.gerund': 'Gérondif',
  'conj.participle': 'Participe passé',
  'conj.more': 'Autres temps',

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
  'vocab.add': 'Add',
  'vocab.save': 'Save',
  'vocab.cancel': 'Cancel',
  'vocab.edit': 'Edit',
  'vocab.delete': 'Delete',
  'vocab.delete.confirm': 'Delete “{term}”?',
  'vocab.term': 'Spanish word',
  'vocab.translation': 'Translation (several allowed, separated by “/”)',
  'vocab.note': 'Note (optional)',
  'vocab.duplicate': 'This word already exists.',
  'vocab.count': '{n} words',
  'vocab.importCsv': 'Import CSV',
  'vocab.import.help': 'Columns: word ; translation ; note (optional). One word per line.',
  'vocab.import.result': '{added} words added, {skipped} skipped (duplicates).',
  'vocab.review': 'Review',
  'vocab.nothingDue': 'Nothing to review right now.',

  'review.title': 'Review',
  'review.prompt.fwd': 'Translate into your language',
  'review.prompt.rev': 'Translate into Spanish',
  'review.answer': 'Your answer',
  'review.check': 'Check',
  'review.next': 'Next',
  'review.correct': 'Correct!',
  'review.accent': 'Almost: mind the accents. Answer: {answer}',
  'review.wrong': 'Wrong. Answer: {answer}',
  'review.done': 'Done: {correct} / {total}',
  'review.empty': 'No cards to review.',
  'review.back': 'Back to vocabulary',
  'review.progress': '{i} / {n}',
  'conj.title': 'Conjugation',
  'conj.search': 'Search a verb (e.g. hablar)',
  'conj.loading': 'Loading verbs…',
  'conj.loadError': 'Could not load the verbs.',
  'conj.suggestions': 'Verb suggestions',
  'conj.noResult': 'No verb found.',
  'conj.hint': 'Type a verb in the infinitive. {n} verbs available.',
  'conj.unknown': '“{verb}” is not a known verb.',
  'conj.back': 'New search',
  'conj.models': 'Conjugation models',
  'conj.model': 'Model {i}/{n}',
  'conj.infinitive': 'Infinitive',
  'conj.gerund': 'Gerund',
  'conj.participle': 'Past participle',
  'conj.more': 'More tenses',

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
