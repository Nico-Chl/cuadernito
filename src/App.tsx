import { HashRouter, NavLink, Route, Routes } from 'react-router-dom'
import { I18nProvider, useI18n, type MessageKey } from './i18n'
import Home from './pages/Home'
import Vocab from './pages/Vocab'
import Conjugation from './pages/Conjugation'
import Settings from './pages/Settings'

const TABS: { to: string; key: MessageKey; icon: string }[] = [
  { to: '/', key: 'nav.home', icon: '⌂' },
  { to: '/vocab', key: 'nav.vocab', icon: '✎' },
  { to: '/conjugation', key: 'nav.conj', icon: '≡' },
  { to: '/settings', key: 'nav.settings', icon: '⚙' },
]

function Shell() {
  const { t } = useI18n()
  return (
    <div className="app">
      <main className="content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/vocab" element={<Vocab />} />
          <Route path="/conjugation" element={<Conjugation />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
      <nav className="tabbar" aria-label="Navigation">
        {TABS.map((tab) => (
          <NavLink key={tab.to} to={tab.to} end={tab.to === '/'} className="tab">
            <span className="tab-icon" aria-hidden="true">
              {tab.icon}
            </span>
            <span>{t(tab.key)}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

export default function App() {
  return (
    <I18nProvider>
      <HashRouter>
        <Shell />
      </HashRouter>
    </I18nProvider>
  )
}
