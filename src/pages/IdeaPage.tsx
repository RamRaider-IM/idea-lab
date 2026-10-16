import { useState } from 'react'
import { useStore } from '../store'
import { Card, Chip, Link, Meter, GateList, Modal, Field, TextArea, TextInput, go, fmtDate } from '../components/ui'
import { scores, recommend, gateFor, VERDICT_LABEL, VERDICT_TONE } from '../scoring'
import { STAGES, STAGE_LABEL, uid, today, type Idea, type Stage } from '../types'
import PlanTab from './PlanTab'
import ResearchTab from './ResearchTab'
import LaunchTab from './LaunchTab'
import MonitorTab from './MonitorTab'
import DecideTab from './DecideTab'

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'plan', label: 'Plan' },
  { id: 'research', label: 'Research' },
  { id: 'launch', label: 'Launch' },
  { id: 'monitor', label: 'Monitor' },
  { id: 'decide', label: 'Decide' },
]

export default function IdeaPage({ id, tab }: { id: string; tab: string }) {
  const { state, deleteIdea } = useStore()
  const idea = state.ideas.find(i => i.id === id)
  if (!idea) return <div className="empty"><h3>Idea not found</h3><a href="#/">Back to portfolio</a></div>
  const stageIdx = STAGES.indexOf(idea.stage)

  const remove = () => {
    if (!window.confirm(`Delete “${idea.name}” and everything logged against it? This cannot be undone.`)) return
    deleteIdea(idea.id)
    go('#/')
  }

  return (
    <>
      <div className="page-head">
        <div>
          <div className="row wrap">
            <h1>{idea.name}</h1>
            <Chip tone="accent">{STAGE_LABEL[idea.stage]}</Chip>
            {idea.outcome && <Chip tone={idea.outcome === 'scale' ? 'good' : idea.outcome === 'kill' ? 'bad' : 'warn'}>{idea.outcome}</Chip>}
          </div>
          <p className="lede">{idea.oneLiner || <span className="muted">No one-liner yet.</span>}</p>
        </div>
        <div className="row">
          <Link to="#/" className="btn ghost sm">← Portfolio</Link>
          <button type="button" className="btn ghost sm danger" onClick={remove}>Delete</button>
        </div>
      </div>
      <nav className="tabs">
        {TABS.map((t, i) => {
          const phaseIdx = i - 1
          const reached = phaseIdx < 0 || i === 5 || phaseIdx <= stageIdx
          return <Link key={t.id} to={`#/idea/${idea.id}/${t.id === 'overview' ? '' : t.id}`} active={tab === t.id} className={reached ? '' : 'muted'}>{t.label}{phaseIdx >= 0 && phaseIdx < 4 && phaseIdx < stageIdx && <span className="n">✓</span>}</Link>
        })}
      </nav>
      {tab === 'overview' && <Overview idea={idea} />}
      {tab === 'plan' && <PlanTab idea={idea} />}
      {tab === 'research' && <ResearchTab idea={idea} />}
      {tab === 'launch' && <LaunchTab idea={idea} />}
      {tab === 'monitor' && <MonitorTab idea={idea} />}
      {tab === 'decide' && <DecideTab idea={idea} />}
    </>
  )
}

function ScoreTile({ label, value, max, good, hint }: { label: string; value: number | null; max: number; good: number; hint: string }) {
  const tone = value === null ? '' : value >= good ? 'good' : value >= good * 0.7 ? 'warn' : 'bad'
  return (
    <Card className="flat">
      <div className="stat">
        <span className="label">{label}</span>
        <span className="value">{value === null ? <span className="muted">–</span> : value.toFixed(1)}<span className="muted" style={{ fontSize: 14, fontWeight: 400 }}> / {max}</span></span>
        <div className="mt8"><Meter value={value ?? 0} max={max} tone={tone} /></div>
        <span className="delta">{hint}</span>
      </div>
    </Card>
  )
}

function Overview({ idea }: { idea: Idea }) {
  const { state, updateIdea } = useStore()
  const s = scores(idea, state.settings)
  const g = state.settings.gates
  const gate = gateFor(idea, state.settings)
  const rec = recommend(idea, state.settings)
  const [advOpen, setAdvOpen] = useState(false)
  const [rationale, setRationale] = useState('')
  const [editOpen, setEditOpen] = useState(false)
  const [name, setName] = useState(idea.name)
  const [line, setLine] = useState(idea.oneLiner)
  const next: Stage | null = idea.stage === 'decided' ? null : STAGES[STAGES.indexOf(idea.stage) + 1]

  const advance = () => {
    if (!next) return
    updateIdea(idea.id, i => ({
      ...i,
      stage: next === 'decided' ? 'monitor' : next,
      decisions: [...i.decisions, { id: uid(), date: today(), stage: i.stage, decision: 'advance', rationale: rationale.trim() || (gate.ready ? 'Gate passed.' : 'Advanced before the gate was fully met.'), pivotType: '' }],
    }))
    setAdvOpen(false); setRationale('')
    if (next === 'decided') go(`#/idea/${idea.id}/decide`)
    else go(`#/idea/${idea.id}/${next === 'build' ? 'launch' : next}`)
  }

  return (
    <div className="stack">
      <div className="grid4">
        <ScoreTile label="Market" value={s.market} max={5} good={g.marketMin} hint="Starving crowd: pain, money, reachable, growing" />
        <ScoreTile label="Value" value={s.value} max={10} good={g.valueMin} hint="Dream × likelihood ÷ time × effort" />
        <ScoreTile label="Demand" value={s.demand} max={10} good={7} hint="Names, money and validated tests" />
        <ScoreTile label="Traction" value={s.traction} max={10} good={6} hint="Growth, conversion and unit economics" />
      </div>

      <div className="grid2">
        <Card title={gate.title} hint={`${gate.passed} of ${gate.total} met`} right={idea.stage !== 'decided' && (
          <button type="button" className={`btn sm ${gate.ready ? 'primary' : ''}`} onClick={() => setAdvOpen(true)}>{gate.ready ? gate.next : `${gate.next} anyway`}</button>
        )}>
          <GateList gate={gate} />
        </Card>
        <div className="stack">
          <Card title="Recommendation" right={rec.verdict !== 'early' && <Chip tone={VERDICT_TONE[rec.verdict]} dot>{VERDICT_LABEL[rec.verdict]}</Chip>}>
            <div className={`callout ${VERDICT_TONE[rec.verdict]}`}>
              <div className="title">{rec.headline}</div>
              {rec.reasons.length > 0 && <ul>{rec.reasons.map((r, i) => <li key={i}>{r}</li>)}</ul>}
            </div>
            <div className="row mt12"><Link to={`#/idea/${idea.id}/decide`} className="btn sm">Record a decision →</Link></div>
          </Card>
          <Card title="The offer in one breath" right={<button type="button" className="btn ghost sm" onClick={() => { setName(idea.name); setLine(idea.oneLiner); setEditOpen(true) }}>Edit name</button>}>
            <div className="stack tight small">
              <div><span className="muted">For</span> {idea.plan.avatar || <span className="muted">(avatar not set)</span>}</div>
              <div><span className="muted">Who want</span> {idea.plan.dreamOutcome || <span className="muted">(dream outcome not set)</span>}</div>
              <div><span className="muted">We offer</span> {idea.plan.offer.core || <span className="muted">(offer not drafted)</span>}{idea.plan.offer.price && <span> at <b>{idea.plan.offer.price}</b></span>}</div>
              <div><span className="muted">Value bet</span> {idea.plan.valueHypothesis || <span className="muted">(none)</span>}</div>
              <div><span className="muted">Growth bet</span> {idea.plan.growthHypothesis || <span className="muted">(none)</span>}</div>
            </div>
          </Card>
        </div>
      </div>

      <Card title="Decision log" hint={`${idea.decisions.length} entries`}>
        {idea.decisions.length === 0 ? <p className="small muted">No decisions yet. Advancing a stage or recording a call writes here.</p> : (
          <table className="tbl">
            <thead><tr><th>Date</th><th>From</th><th>Decision</th><th>Rationale</th></tr></thead>
            <tbody>
              {[...idea.decisions].reverse().map(d => (
                <tr key={d.id}><td className="nowrap">{fmtDate(d.date)}</td><td className="nowrap">{STAGE_LABEL[d.stage]}</td><td><Chip tone={d.decision === 'kill' ? 'bad' : d.decision === 'pivot' || d.decision === 'hold' ? 'warn' : 'good'}>{d.decision}</Chip>{d.pivotType && <div className="tiny muted mt8">{d.pivotType}</div>}</td><td>{d.rationale}</td></tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Modal open={advOpen} onClose={() => setAdvOpen(false)} title={gate.next}>
        <div className="stack">
          {!gate.ready && <div className="callout warn"><div className="title">{gate.total - gate.passed} gate item(s) not met</div>Moving on anyway is allowed. Say why, so future-you knows what was skipped.</div>}
          <Field label="Why now?"><TextArea value={rationale} onChange={setRationale} placeholder={gate.ready ? 'Gate passed. Anything else worth noting?' : 'What evidence makes you confident enough to skip the gate?'} /></Field>
          <div className="row" style={{ justifyContent: 'flex-end' }}>
            <button type="button" className="btn" onClick={() => setAdvOpen(false)}>Cancel</button>
            <button type="button" className="btn primary" onClick={advance}>{gate.next}</button>
          </div>
        </div>
      </Modal>
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit idea">
        <div className="stack">
          <Field label="Name"><TextInput value={name} onChange={setName} /></Field>
          <Field label="One line"><TextInput value={line} onChange={setLine} /></Field>
          <div className="row" style={{ justifyContent: 'flex-end' }}>
            <button type="button" className="btn" onClick={() => setEditOpen(false)}>Cancel</button>
            <button type="button" className="btn primary" disabled={!name.trim()} onClick={() => { updateIdea(idea.id, i => ({ ...i, name: name.trim(), oneLiner: line.trim() })); setEditOpen(false) }}>Save</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
