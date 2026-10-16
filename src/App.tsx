import { useEffect, useState } from 'react'
import { StoreProvider, useStore } from './store'
import { useHash, Link, go, Modal, Field, TextInput } from './components/ui'
import { STAGE_LABEL } from './types'
import Portfolio from './pages/Portfolio'
import IdeaPage from './pages/IdeaPage'
import Guide from './pages/Guide'
import SettingsPage from './pages/SettingsPage'
import { SyncProvider } from './sync'
import { SyncBadge } from './components/SyncCard'

const STAGE_COLOR: Record<string, string> = { plan: 'var(--ord-1)', research: 'var(--ord-2)', build: 'var(--ord-3)', monitor: 'var(--ord-4)', decided: 'var(--muted)' }

function Shell() {
  const hash = useHash()
  const { state, addIdea, theme, setTheme } = useStore()
  const parts = hash.replace(/^#\/?/, '').split('/')
  useEffect(() => { window.scrollTo(0, 0) }, [hash])
  const [newOpen, setNewOpen] = useState(false)
  const [name, setName] = useState('')
  const [line, setLine] = useState('')

  const create = () => {
    if (!name.trim()) return
    const idea = addIdea(name.trim(), line.trim())
    setName(''); setLine(''); setNewOpen(false)
    go(`#/idea/${idea.id}/plan`)
  }

  let page
  if (parts[0] === 'idea' && parts[1]) page = <IdeaPage id={parts[1]} tab={parts[2] || 'overview'} />
  else if (parts[0] === 'guide') page = <Guide />
  else if (parts[0] === 'settings') page = <SettingsPage />
  else page = <Portfolio onNew={() => setNewOpen(true)} />

  const active = state.ideas.filter(i => i.stage !== 'decided')
  const nextTheme = theme === 'system' ? 'light' : theme === 'light' ? 'dark' : 'system'

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="logo"><svg width="16" height="16" viewBox="0 0 32 32"><path d="M8 22 L13 15 L18 18 L24 9" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /><circle cx="24" cy="9" r="3" fill="#fff" /></svg></div>
          <div><div className="name">Idea Lab</div><div className="sub">Plan · Research · Launch · Monitor</div></div>
        </div>
        <nav className="nav stack tight">
          <Link to="#/" active={parts[0] === ''}>Portfolio</Link>
          <Link to="#/guide" active={parts[0] === 'guide'}>Method guide</Link>
          <Link to="#/settings" active={parts[0] === 'settings'}>Settings & data</Link>
          {active.length > 0 && <div className="section">In play</div>}
          {active.map(i => (
            <Link key={i.id} to={`#/idea/${i.id}`} className="idea-link" active={parts[0] === 'idea' && parts[1] === i.id}>
              <span className="dot" style={{ background: STAGE_COLOR[i.stage] }} title={STAGE_LABEL[i.stage]} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{i.name}</span>
            </Link>
          ))}
        </nav>
        <div style={{ marginTop: 'auto' }}><SyncBadge /></div>
        <div className="foot" style={{ marginTop: 6 }}>
          <button type="button" className="btn primary flex1" onClick={() => setNewOpen(true)}>+ New idea</button>
          <button type="button" className="btn icon" title={`Theme: ${theme}. Click for ${nextTheme}.`} onClick={() => setTheme(nextTheme)}>{theme === 'dark' ? '🌙' : theme === 'light' ? '☀️' : '◐'}</button>
        </div>
      </aside>
      <main className="main">{page}</main>
      <Modal open={newOpen} onClose={() => setNewOpen(false)} title="New idea">
        <form className="stack" onSubmit={e => { e.preventDefault(); create() }}>
          <Field label="Working name"><TextInput value={name} onChange={setName} placeholder="e.g. Invoice Nudge" autoFocus /></Field>
          <Field label="One line" help="who it is for and what it does"><TextInput value={line} onChange={setLine} placeholder="Automatic payment chasers for freelancers who hate asking for money" /></Field>
          <div className="row" style={{ justifyContent: 'flex-end' }}>
            <button type="button" className="btn" onClick={() => setNewOpen(false)}>Cancel</button>
            <button type="submit" className="btn primary" disabled={!name.trim()}>Create and start planning</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default function App() {
  return <StoreProvider><SyncProvider><Shell /></SyncProvider></StoreProvider>
}
