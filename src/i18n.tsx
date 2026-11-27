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

  'install.title': 'Installer l’application',
  'install.intro': 'Ajoute Cuadernito à l’écran d’accueil de ton téléphone : elle s’ouvre en plein écran, comme une vraie application, et fonctionne sans connexion.',
  'install.button': 'Installer maintenant',
  'install.installed': 'Cuadernito est déjà installée sur cet appareil.',
  'install.dismiss': 'Masquer',
  'install.desktop': 'Sur ordinateur (Chrome ou Edge) : clique sur l’icône d’installation dans la barre d’adresse. Sur téléphone :',
  'install.ios.title': 'iPhone / iPad (Safari)',
  'install.ios.1': 'Ouvre cette page dans Safari.',
  'install.ios.2': 'Touche le bouton Partager, en bas de l’écran (ou en haut sur iPad) ',
  'install.ios.3': 'Fais défiler et touche « Sur l’écran d’accueil ».',
  'install.ios.4': 'Touche « Ajouter » : l’icône apparaît sur ton écran d’accueil.',
  'install.android.title': 'Android (Chrome)',
  'install.android.1': 'Ouvre cette page dans Chrome.',
  'install.android.2': 'Touche le menu ⋮ en haut à droite.',
  'install.android.3': 'Touche « Installer l’application » (ou « Ajouter à l’écran d’accueil »), puis confirme.',

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
  'conj.practice': 'S’entraîner',

  'quiz.title': 'Entraînement',
  'quiz.backToGrid': 'Grille',
  'quiz.mode': 'Type d’exercice',
  'quiz.mode.form': 'Une forme (verbe, temps, personne)',
  'quiz.mode.tense': 'Un temps complet (toutes les personnes)',
  'quiz.pool': 'Verbes',
  'quiz.pool.common': 'Verbes courants ({n})',
  'quiz.pool.mine': 'Mes verbes ({n})',
  'quiz.pool.both': 'Les deux ({n})',
  'quiz.noMine': 'Aucun verbe à l’infinitif dans ton vocabulaire pour l’instant.',
  'quiz.count': 'Nombre de questions',
  'quiz.tenses': 'Temps',
  'quiz.noTenses': 'Choisis au moins un temps.',
  'quiz.noQuestions': 'Aucune question possible avec cette sélection.',
  'quiz.start': 'Commencer',
  'quiz.prompt.form': 'Écris la forme conjuguée',
  'quiz.prompt.tense': 'Écris toutes les formes',
  'quiz.accent': 'Juste, mais attention aux accents.',
  'quiz.incorrect': 'Pas tout à fait. Compare avec les bonnes réponses.',
  'quiz.done': 'Terminé : {correct} / {total} questions justes.',
  'quiz.replay': 'Rejouer',
  'quiz.edit': 'Modifier les réglages',

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

  'install.title': 'Install the app',
  'install.intro': 'Add Cuadernito to your phone’s home screen: it opens full screen like a real app and works without a connection.',
  'install.button': 'Install now',
  'install.installed': 'Cuadernito is already installed on this device.',
  'install.dismiss': 'Hide',
  'install.desktop': 'On a computer (Chrome or Edge): click the install icon in the address bar. On a phone:',
  'install.ios.title': 'iPhone / iPad (Safari)',
  'install.ios.1': 'Open this page in Safari.',
  'install.ios.2': 'Tap the Share button, at the bottom of the screen (top on iPad) ',
  'install.ios.3': 'Scroll down and tap “Add to Home Screen”.',
  'install.ios.4': 'Tap “Add”: the icon appears on your home screen.',
  'install.android.title': 'Android (Chrome)',
  'install.android.1': 'Open this page in Chrome.',
  'install.android.2': 'Tap the ⋮ menu at the top right.',
  'install.android.3': 'Tap “Install app” (or “Add to Home screen”), then confirm.',

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
  'conj.practice': 'Practice',

  'quiz.title': 'Practice',
  'quiz.backToGrid': 'Tables',
  'quiz.mode': 'Exercise type',
  'quiz.mode.form': 'One form (verb, tense, person)',
  'quiz.mode.tense': 'A full tense (all persons)',
  'quiz.pool': 'Verbs',
  'quiz.pool.common': 'Common verbs ({n})',
  'quiz.pool.mine': 'My verbs ({n})',
  'quiz.pool.both': 'Both ({n})',
  'quiz.noMine': 'No infinitive verbs in your vocabulary yet.',
  'quiz.count': 'Number of questions',
  'quiz.tenses': 'Tenses',
  'quiz.noTenses': 'Pick at least one tense.',
  'quiz.noQuestions': 'No question possible with this selection.',
  'quiz.start': 'Start',
  'quiz.prompt.form': 'Write the conjugated form',
  'quiz.prompt.tense': 'Write all the forms',
  'quiz.accent': 'Correct, but mind the accents.',
  'quiz.incorrect': 'Not quite. Compare with the right answers.',
  'quiz.done': 'Done: {correct} / {total} questions correct.',
  'quiz.replay': 'Play again',
  'quiz.edit': 'Change settings',

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
