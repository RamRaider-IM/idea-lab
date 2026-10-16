import { useStore, useIdeaUpdater } from '../store'
import { Card, Field, TextInput, TextArea, NumberInput, Chip, Segmented, Stat, PillSelect } from '../components/ui'
import { demandSummary, demandScore, fmtPct, pct } from '../scoring'
import { newTest, TEST_TYPE_LABEL, TEST_TYPE_HINT, type Idea, type DemandTest, type TestType, type ResearchData } from '../types'

const TYPES = Object.keys(TEST_TYPE_LABEL) as TestType[]

export default function ResearchTab({ idea }: { idea: Idea }) {
  const { state } = useStore()
  const g = state.settings.gates
  const update = useIdeaUpdater(idea.id)
  const r = idea.research
  const set = (patch: Partial<ResearchData>) => update(i => ({ research: { ...i.research, ...patch } }))
  const setTest = (id: string, patch: Partial<DemandTest>) => update(i => ({ research: { ...i.research, tests: i.research.tests.map(t => (t.id === id ? { ...t, ...patch } : t)) } }))
  const addTest = (type: TestType) => set({ tests: [newTest(type), ...r.tests] })
  const s = demandSummary(r)
  const ds = demandScore(r, g)
  const coreFour: { key: TestType; label: string }[] = [{ key: 'warm', label: 'Warm outreach' }, { key: 'cold', label: 'Cold outreach' }, { key: 'content', label: 'Content' }, { key: 'ads', label: 'Paid ads' }]
  const used = new Set(r.tests.map(t => t.type))

  return (
    <div className="stack">
      <div className="grid4">
        <Card className="flat"><Stat label="Names on the list" value={s.waitlist} sub={`gate: ${g.waitlistMin}`} /></Card>
        <Card className="flat"><Stat label="Pre-sales" value={s.presales} sub={`gate: ${g.presaleMin}`} /></Card>
        <Card className="flat"><Stat label="Landing conversion" value={fmtPct(s.landingConv)} sub={`gate: ${g.landingConvMin}%`} /></Card>
        <Card className="flat"><Stat label="Demand score" value={ds === null ? '–' : ds.toFixed(1)} sub={`${s.validated} validated · ${s.invalidated} invalidated · ${s.running} running`} /></Card>
      </div>

      <Card title="Set up a demand test" why="Priestley: don’t ask if they like it, ask them to put their name down or their money down. Hormozi: reach a hundred people before judging anything. Ries: every test exists to prove an assumption wrong.">
        <div className="pill-select">
          {TYPES.map(t => <button key={t} type="button" onClick={() => addTest(t)}>+ {TEST_TYPE_LABEL[t]}</button>)}
        </div>
        <div className="row wrap mt12 small">
          <span className="muted">Core four channels tried:</span>
          {coreFour.map(c => <Chip key={c.key} tone={used.has(c.key) ? 'good' : 'outline'}>{c.label}</Chip>)}
        </div>
      </Card>

      {r.tests.length === 0 ? <Card><p className="small muted">No tests yet. The cheapest first test is usually a waiting list: a one-line pitch and a form, posted where the avatar already is.</p></Card> : (
        <div className="stack">
          {r.tests.map(t => {
            const conv = pct(t.result, t.reached)
            const hit = t.target > 0 ? t.result >= t.target : false
            return (
              <Card key={t.id} className="flat" title={
                <div className="row wrap">
                  <input type="text" value={t.name} onChange={e => setTest(t.id, { name: e.target.value })} style={{ width: 240, fontWeight: 600 }} />
                  <Chip tone="outline">{TEST_TYPE_LABEL[t.type]}</Chip>
                  {t.status === 'done' && t.verdict && <Chip tone={t.verdict === 'validated' ? 'good' : t.verdict === 'invalidated' ? 'bad' : 'warn'} dot>{t.verdict}</Chip>}
                  {t.status !== 'done' && t.target > 0 && <Chip tone={hit ? 'good' : ''}>{t.result} / {t.target} {t.metric.toLowerCase()}</Chip>}
                </div>
              } right={
                <div className="row">
                  <Segmented options={[{ value: 'planned', label: 'Planned' }, { value: 'running', label: 'Running' }, { value: 'done', label: 'Done' }]} value={t.status} onChange={v => setTest(t.id, { status: v, ...(v === 'running' && !t.startedAt ? { startedAt: new Date().toISOString().slice(0, 10) } : {}), ...(v === 'done' && !t.endedAt ? { endedAt: new Date().toISOString().slice(0, 10) } : {}) })} />
                  <button type="button" className="btn ghost sm danger" onClick={() => { if (window.confirm('Delete this test?')) set({ tests: r.tests.filter(x => x.id !== t.id) }) }}>×</button>
                </div>
              }>
                {TEST_TYPE_HINT[t.type].hint && <p className="tiny muted mb12" style={{ marginTop: -6 }}>{TEST_TYPE_HINT[t.type].hint}</p>}
                <div className="grid2">
                  <Field label="Hypothesis" help="a number and a deadline"><TextArea rows={2} value={t.hypothesis} onChange={v => setTest(t.id, { hypothesis: v })} placeholder="A post in three communities gets 100 names in two weeks" /></Field>
                  <Field label="Tests which assumption?">
                    <select value={t.assumptionId} onChange={e => setTest(t.id, { assumptionId: e.target.value })}>
                      <option value="">(none linked)</option>
                      {idea.plan.assumptions.map(a => <option key={a.id} value={a.id}>{a.text || '(untitled assumption)'}</option>)}
                    </select>
                  </Field>
                </div>
                <div className="grid4 mt12">
                  <Field label="Metric"><TextInput value={t.metric} onChange={v => setTest(t.id, { metric: v })} /></Field>
                  <Field label="Target"><NumberInput value={t.target} onChange={v => setTest(t.id, { target: v })} /></Field>
                  <Field label="Reached" help="people exposed"><NumberInput value={t.reached} onChange={v => setTest(t.id, { reached: v })} /></Field>
                  <Field label="Result" help={conv !== null ? `${conv.toFixed(1)}% of reached` : undefined}><NumberInput value={t.result} onChange={v => setTest(t.id, { result: v })} /></Field>
                </div>
                <div className="grid4 mt12">
                  <Field label="Started"><TextInput type="date" value={t.startedAt} onChange={v => setTest(t.id, { startedAt: v })} /></Field>
                  <Field label="Ended"><TextInput type="date" value={t.endedAt} onChange={v => setTest(t.id, { endedAt: v })} /></Field>
                  <div className="field" style={{ gridColumn: 'span 2' }}>
                    <span className="lbl"><span>Verdict</span></span>
                    <PillSelect options={[{ value: '', label: 'Open' }, { value: 'validated', label: 'Validated' }, { value: 'invalidated', label: 'Invalidated' }, { value: 'inconclusive', label: 'Inconclusive' }]} value={t.verdict} onChange={v => {
                      const patch: Partial<DemandTest> = { verdict: v }
                      if (v && t.status !== 'done') { patch.status = 'done'; if (!t.endedAt) patch.endedAt = new Date().toISOString().slice(0, 10) }
                      setTest(t.id, patch)
                      if (t.assumptionId && (v === 'validated' || v === 'invalidated')) update(i => ({ plan: { ...i.plan, assumptions: i.plan.assumptions.map(a => (a.id === t.assumptionId ? { ...a, status: v } : a)) } }))
                    }} />
                  </div>
                </div>
                <div className="mt12"><Field label="What we learned" help="the sentence you would tell a friend"><TextArea rows={2} value={t.learning} onChange={v => setTest(t.id, { learning: v })} placeholder="164 names. The line that landed was “never write a chaser email again”." /></Field></div>
              </Card>
            )
          })}
        </div>
      )}

      <div className="grid2">
        <Card title="Interview notes" why="Ask about the last time it happened. What did they do? What did it cost? What have they tried?">
          <TextArea rows={6} value={r.interviewNotes} onChange={v => set({ interviewNotes: v })} placeholder="12 interviews. Pattern: the pain peaks at day 7 overdue…" />
        </Card>
        <Card title="Insights" why="What changed in the offer, the avatar or the message because of this phase?">
          <TextArea rows={6} value={r.insights} onChange={v => set({ insights: v })} placeholder="Lead with the emotional cost of chasing, not the cash-flow maths." />
        </Card>
      </div>
    </div>
  )
}
