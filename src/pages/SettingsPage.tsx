import { useRef, useState } from 'react'
import { useStore, isAppState, normalise } from '../store'
import { Card, Field, NumberInput, TextInput, Segmented } from '../components/ui'
import { exampleState } from '../seed'
import { SyncCard } from '../components/SyncCard'
import { DEFAULT_SETTINGS, type Settings } from '../types'

export default function SettingsPage() {
  const { state, updateSettings, replaceState, theme, setTheme } = useStore()
  const g = state.settings.gates
  const setGate = (k: keyof Settings['gates'], v: number) => updateSettings({ gates: { ...g, [k]: v } })
  const fileRef = useRef<HTMLInputElement>(null)
  const [msg, setMsg] = useState('')

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `idea-lab-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }
  const importJson = async (f: File) => {
    try {
      const parsed: unknown = JSON.parse(await f.text())
      if (!isAppState(parsed)) throw new Error('Not an Idea Lab export')
      if (state.ideas.length > 0 && !window.confirm(`Replace the ${state.ideas.length} idea(s) currently stored with the ${parsed.ideas.length} in this file?`)) return
      replaceState({ ...normalise(parsed), updatedAt: new Date().toISOString() })
      setMsg(`Imported ${parsed.ideas.length} idea(s).`)
    } catch (e) {
      setMsg(`Import failed: ${(e as Error).message}`)
    }
  }
  const loadExample = () => {
    if (state.ideas.length > 0 && !window.confirm('Replace everything stored with the three example ideas?')) return
    replaceState(exampleState()); setMsg('Loaded three example ideas.')
  }
  const clearAll = () => {
    if (!window.confirm('Delete every idea? Export first if you might want them back.')) return
    const now = new Date().toISOString()
    const tombstones = { ...state.tombstones, ...Object.fromEntries(state.ideas.map(i => [i.id, now])) }
    replaceState({ version: 1, ideas: [], settings: state.settings, tombstones, updatedAt: now }); setMsg('Cleared.')
  }

  return (
    <>
      <div className="page-head"><div><h1>Settings & data</h1><p className="lede">The bars every idea is judged against, and where the data lives.</p></div></div>
      <div className="stack">
        <SyncCard />
        <Card title="Gates" why="Defaults follow the books. Raise or lower them as your own markets teach you what a real signal looks like." right={<button type="button" className="btn sm" onClick={() => updateSettings({ gates: DEFAULT_SETTINGS.gates })}>Reset to defaults</button>}>
          <div className="grid3">
            <Field label="Market score minimum" help="/ 5"><NumberInput step={0.5} value={g.marketMin} onChange={v => setGate('marketMin', v)} /></Field>
            <Field label="Value score minimum" help="/ 10"><NumberInput step={0.5} value={g.valueMin} onChange={v => setGate('valueMin', v)} /></Field>
            <Field label="Weeks of data before a verdict"><NumberInput value={g.monitorWeeks} onChange={v => setGate('monitorWeeks', v)} /></Field>
            <Field label="Waiting-list names" help="Priestley"><NumberInput value={g.waitlistMin} onChange={v => setGate('waitlistMin', v)} /></Field>
            <Field label="Pre-sales"><NumberInput value={g.presaleMin} onChange={v => setGate('presaleMin', v)} /></Field>
            <Field label="Landing conversion %"><NumberInput step={0.5} value={g.landingConvMin} onChange={v => setGate('landingConvMin', v)} /></Field>
            <Field label="Weekly growth %" help="north star"><NumberInput step={0.5} value={g.growthMin} onChange={v => setGate('growthMin', v)} /></Field>
            <Field label="Sign-up → paying %"><NumberInput step={0.5} value={g.payingConvMin} onChange={v => setGate('payingConvMin', v)} /></Field>
            <Field label="LTV : CAC minimum" help="Hormozi"><NumberInput step={0.5} value={g.ltvCacMin} onChange={v => setGate('ltvCacMin', v)} /></Field>
          </div>
        </Card>
        <div className="grid2">
          <Card title="Display">
            <div className="grid2">
              <Field label="Currency symbol"><TextInput value={state.settings.currency} onChange={v => updateSettings({ currency: v })} /></Field>
              <Field label="Theme"><div><Segmented options={[{ value: 'system', label: 'System' }, { value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }]} value={theme} onChange={setTheme} /></div></Field>
            </div>
          </Card>
          <Card title="Data" why="Stored in this browser, and in your sync account when signed in. Export a JSON backup now and then.">
            <div className="row wrap">
              <button type="button" className="btn" onClick={exportJson}>Export JSON</button>
              <button type="button" className="btn" onClick={() => fileRef.current?.click()}>Import JSON</button>
              <input ref={fileRef} type="file" accept="application/json" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) importJson(f); e.target.value = '' }} />
              <button type="button" className="btn" onClick={loadExample}>Load examples</button>
              <button type="button" className="btn danger" onClick={clearAll}>Clear all</button>
            </div>
            {msg && <p className="small ink2 mt12">{msg}</p>}
            <p className="tiny muted mt12">{state.ideas.length} idea(s) stored · {state.ideas.reduce((a, i) => a + i.metrics.length, 0)} weekly rows · {state.ideas.reduce((a, i) => a + i.research.tests.length, 0)} tests</p>
          </Card>
        </div>
      </div>
    </>
  )
}
