import { useState } from 'react'
import { useSync } from '../sync'
import { Card, Chip, Field, TextInput } from './ui'

export function SyncCard() {
  const sync = useSync()
  const [email, setEmail] = useState('')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  if (!sync.enabled) {
    return <Card title="Sync across devices"><p className="small muted">Not configured in this build. Set the Supabase URL and publishable key in src/config.ts.</p></Card>
  }
  const send = async () => {
    if (!email.trim()) return
    setBusy(true)
    const err = await sync.signIn(email.trim())
    setBusy(false)
    setMsg(err ? `Could not send the link: ${err}` : `Sign-in link sent to ${email.trim()}. Open it on this device to finish signing in.`)
  }
  const tone = sync.status === 'synced' ? 'good' : sync.status === 'error' ? 'bad' : sync.status === 'syncing' ? 'warn' : ''
  const label = { off: 'Off', 'signed-out': 'Signed out', syncing: 'Syncing', synced: 'Synced', error: 'Error' }[sync.status]

  return (
    <Card title="Sync across devices" why="Sign in with your email on each laptop, phone or browser and the same ideas appear everywhere. Edits merge by idea; the most recent edit wins." right={<Chip tone={tone} dot>{label}</Chip>}>
      {sync.session ? (
        <div className="stack tight">
          <div className="small">Signed in as <b>{sync.session.user.email}</b></div>
          <div className="small muted">{sync.lastSyncedAt ? `Last synced ${new Date(sync.lastSyncedAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}` : 'Not synced yet'}{sync.error && ` · ${sync.error}`}</div>
          <div className="row mt8">
            <button type="button" className="btn sm" onClick={() => void sync.syncNow()}>Sync now</button>
            <button type="button" className="btn sm ghost" onClick={() => void sync.signOut()}>Sign out</button>
          </div>
          <p className="tiny muted mt8">Signing out keeps a copy on this device. Sign in again to resume syncing.</p>
        </div>
      ) : (
        <form className="stack tight" onSubmit={e => { e.preventDefault(); void send() }}>
          <Field label="Email" help="you will get a one-click sign-in link, no password"><TextInput value={email} onChange={setEmail} placeholder="you@example.com" /></Field>
          <div className="row"><button type="submit" className="btn primary sm" disabled={busy || !email.trim()}>{busy ? 'Sending…' : 'Send sign-in link'}</button></div>
          {msg && <p className="small ink2">{msg}</p>}
          <p className="tiny muted">Anything already on this device is kept and merged in when you sign in.</p>
        </form>
      )}
    </Card>
  )
}

export function SyncBadge() {
  const sync = useSync()
  if (!sync.enabled) return null
  if (!sync.session) return <a href="#/settings" className="tiny muted" style={{ padding: '4px 8px' }}>Not syncing · sign in</a>
  const color = sync.status === 'synced' ? 'var(--good)' : sync.status === 'error' ? 'var(--critical)' : 'var(--warning)'
  const text = sync.status === 'syncing' ? 'Syncing…' : sync.status === 'error' ? 'Sync error' : sync.lastSyncedAt ? `Synced ${new Date(sync.lastSyncedAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}` : 'Signed in'
  return <a href="#/settings" className="tiny muted row" style={{ padding: '4px 8px', gap: 6 }} title={sync.session.user.email}><span style={{ width: 7, height: 7, borderRadius: '50%', background: color, flex: 'none' }} />{text}</a>
}
