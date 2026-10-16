import { useStore, useIdeaUpdater } from '../store'
import { Card, Field, TextInput, TextArea, NumberInput, PillSelect } from '../components/ui'
import { uid, METRIC_LABEL, type Idea, type LaunchData, type MetricKey, type Engine } from '../types'

export default function LaunchTab({ idea }: { idea: Idea }) {
  const { state } = useStore()
  const cur = state.settings.currency
  const update = useIdeaUpdater(idea.id)
  const l = idea.launch
  const set = (patch: Partial<LaunchData>) => update(i => ({ launch: { ...i.launch, ...patch } }))
  const setChan = (k: keyof LaunchData['channels'], v: boolean) => update(i => ({ launch: { ...i.launch, channels: { ...i.launch.channels, [k]: v } } }))
  const setTarget = (k: keyof LaunchData['weeklyTargets'], v: number) => update(i => ({ launch: { ...i.launch, weeklyTargets: { ...i.launch.weeklyTargets, [k]: v } } }))
  const setItem = (id: string, patch: { text?: string; done?: boolean }) => update(i => ({ launch: { ...i.launch, checklist: i.launch.checklist.map(c => (c.id === id ? { ...c, ...patch } : c)) } }))
  const done = l.checklist.filter(c => c.done).length

  return (
    <div className="stack">
      <Card title="Minimum viable product" why="Ries: the smallest thing that tests the value hypothesis with real customers. Everything else waits for evidence.">
        <div className="grid2">
          <Field label="In scope" help="does the one thing the offer promises"><TextArea rows={4} value={l.mvpScope} onChange={v => set({ mvpScope: v })} placeholder="Stripe sync, three-step chaser sequence, one dashboard of overdue invoices" /></Field>
          <Field label="Explicitly not in scope" help="write it down so you stop adding it"><TextArea rows={4} value={l.notInScope} onChange={v => set({ notInScope: v })} placeholder="Xero sync, custom sequences, team accounts" /></Field>
        </div>
        <div className="grid2 mt12">
          <Field label="Launch date"><TextInput type="date" value={l.launchDate} onChange={v => set({ launchDate: v })} /></Field>
          <Field label="URL"><TextInput type="url" value={l.url} onChange={v => set({ url: v })} placeholder="https://" /></Field>
        </div>
      </Card>

      <div className="grid2">
        <Card title="Launch channels" why="Hormozi’s core four. Pick the one or two you can do with volume; the research phase already told you which worked.">
          <div className="stack tight">
            {([['warm', 'Warm outreach', 'Your list, your network, your waiting list'], ['cold', 'Cold outreach', 'Strangers who match the avatar, at volume'], ['content', 'Content', 'Posts where the avatar already gathers'], ['ads', 'Paid ads', 'Once a message converts organically']] as const).map(([k, label, d]) => (
              <label key={k} className="check"><input type="checkbox" checked={l.channels[k]} onChange={e => setChan(k, e.target.checked)} /><span><b>{label}</b> <span className="muted small">· {d}</span></span></label>
            ))}
          </div>
          <div className="mt12"><Field label="Launch plan" help="what goes out, where, when"><TextArea rows={3} value={l.channelNotes} onChange={v => set({ channelNotes: v })} placeholder="Launch post in three communities on Monday; email the 164 names Tuesday; follow-up Thursday" /></Field></div>
        </Card>
        <Card title="Engine of growth" why="Ries: pick one engine and tune it. Each has its own metric that matters.">
          <PillSelect<Engine> options={[{ value: 'sticky', label: 'Sticky' }, { value: 'viral', label: 'Viral' }, { value: 'paid', label: 'Paid' }]} value={l.engine} onChange={v => set({ engine: v })} />
          <div className="small ink2 mt12 stack tight">
            <div><b>Sticky</b>: retention. Win when new customers outpace churn. Watch churn and activation.</div>
            <div><b>Viral</b>: every customer brings the next. Win when the viral coefficient passes 1. Watch referrals per customer.</div>
            <div><b>Paid</b>: buy customers for less than they are worth. Win when LTV exceeds CAC by 3×. Watch CAC and payback.</div>
          </div>
        </Card>
      </div>

      <Card title="North star and weekly targets" why="One metric decides the weekly call. Set the target you would need to hit by week four to feel this is working.">
        <div className="grid2">
          <Field label="North-star metric">
            <select value={l.northStar} onChange={e => set({ northStar: e.target.value as MetricKey })}>
              {(Object.keys(METRIC_LABEL) as MetricKey[]).map(k => <option key={k} value={k}>{METRIC_LABEL[k]}</option>)}
            </select>
          </Field>
        </div>
        <div className="grid4 mt12">
          <Field label="Visitors / week"><NumberInput value={l.weeklyTargets.visitors} onChange={v => setTarget('visitors', v)} /></Field>
          <Field label="Sign-ups / week"><NumberInput value={l.weeklyTargets.signups} onChange={v => setTarget('signups', v)} /></Field>
          <Field label="Paying / week" help="new customers"><NumberInput value={l.weeklyTargets.paying} onChange={v => setTarget('paying', v)} /></Field>
          <Field label={`Revenue / week (${cur})`}><NumberInput value={l.weeklyTargets.revenue} onChange={v => setTarget('revenue', v)} /></Field>
        </div>
      </Card>

      <Card title="Launch checklist" hint={`${done} / ${l.checklist.length}`} right={<button type="button" className="btn sm" onClick={() => set({ checklist: [...l.checklist, { id: uid(), text: '', done: false }] })}>+ Item</button>}>
        <div className="stack" style={{ gap: 0 }}>
          {l.checklist.map(c => (
            <div key={c.id} className="check">
              <input type="checkbox" checked={c.done} onChange={e => setItem(c.id, { done: e.target.checked })} />
              <input type="text" className={`flex1 ${c.done ? 'done' : ''}`} value={c.text} placeholder="New checklist item" onChange={e => setItem(c.id, { text: e.target.value })} />
              <button type="button" className="btn ghost sm danger" onClick={() => set({ checklist: l.checklist.filter(x => x.id !== c.id) })}>×</button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
