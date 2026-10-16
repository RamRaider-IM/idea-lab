import { useState } from 'react'
import { useStore } from '../store'
import { Card, Chip, Field, TextArea, PillSelect, GateList, fmtDate, go } from '../components/ui'
import { recommend, gateFor, PIVOT_TYPES, VERDICT_LABEL, VERDICT_TONE } from '../scoring'
import { uid, today, STAGE_LABEL, type Idea, type DecisionType } from '../types'

export default function DecideTab({ idea }: { idea: Idea }) {
  const { state, updateIdea } = useStore()
  const rec = recommend(idea, state.settings)
  const gate = gateFor(idea, state.settings)
  const [decision, setDecision] = useState<DecisionType>(rec.verdict === 'early' ? 'persevere' : rec.verdict)
  const [pivotType, setPivotType] = useState('')
  const [rationale, setRationale] = useState('')

  const record = () => {
    if (!rationale.trim()) return
    updateIdea(idea.id, i => {
      const log = { id: uid(), date: today(), stage: i.stage, decision, rationale: rationale.trim(), pivotType: decision === 'pivot' ? pivotType : '' }
      const base = { ...i, decisions: [...i.decisions, log] }
      switch (decision) {
        case 'scale': return { ...base, stage: 'decided', outcome: 'scale' }
        case 'kill': return { ...base, stage: 'decided', outcome: 'kill' }
        case 'hold': return { ...base, stage: 'decided', outcome: 'hold' }
        case 'pivot': return { ...base, stage: 'plan', outcome: 'pivot', plan: { ...i.plan, assumptions: i.plan.assumptions.map(a => ({ ...a, status: 'untested' as const })) } }
        default: return { ...base, outcome: '' }
      }
    })
    setRationale('')
    if (decision === 'pivot') go(`#/idea/${idea.id}/plan`)
    else if (decision === 'persevere' || decision === 'advance') go(`#/idea/${idea.id}/${idea.stage === 'monitor' ? 'monitor' : ''}`)
    else go('#/')
  }

  const reopen = () => updateIdea(idea.id, i => ({ ...i, stage: 'monitor', outcome: '', decisions: [...i.decisions, { id: uid(), date: today(), stage: i.stage, decision: 'persevere', rationale: 'Reopened for further monitoring.', pivotType: '' }] }))

  return (
    <div className="stack">
      <div className="grid2">
        <Card title="What the numbers say" right={rec.verdict !== 'early' && <Chip tone={VERDICT_TONE[rec.verdict]} dot>{VERDICT_LABEL[rec.verdict]}</Chip>}>
          <div className={`callout ${VERDICT_TONE[rec.verdict]}`}>
            <div className="title">{rec.headline}</div>
            {rec.reasons.length > 0 && <ul>{rec.reasons.map((r, i) => <li key={i}>{r}</li>)}</ul>}
          </div>
          <p className="tiny muted mt12">The rules: scale when growth, conversion and economics all clear the bar. Persevere when one does. Pivot when there is interest without payment, or traffic without interest. Kill when it is flat for a month with nothing to tune.</p>
        </Card>
        <Card title={gate.title} hint={`${gate.passed} of ${gate.total}`}><GateList gate={gate} /></Card>
      </div>

      {idea.stage === 'decided' ? (
        <Card title={`Decided: ${idea.outcome}`}>
          <p className="small ink2">This idea is out of the loop. Reopen it to keep logging metrics and testing.</p>
          <button type="button" className="btn mt12" onClick={reopen}>Reopen into Monitor</button>
        </Card>
      ) : (
        <Card title="Record the call" why="Ries: the pivot-or-persevere meeting is scheduled, not triggered by panic. Write the reasoning down; your future self will want it.">
          <div className="stack">
            <PillSelect<DecisionType> options={[{ value: 'persevere', label: 'Persevere: keep tuning' }, { value: 'scale', label: 'Scale: it works, graduate it' }, { value: 'pivot', label: 'Pivot: change one thing, back to Plan' }, { value: 'hold', label: 'Hold: park it' }, { value: 'kill', label: 'Kill: stop' }]} value={decision} onChange={setDecision} />
            {decision === 'pivot' && (
              <Field label="Pivot type" help="Ries’s catalogue">
                <select value={pivotType} onChange={e => setPivotType(e.target.value)}>
                  <option value="">Choose one</option>
                  {PIVOT_TYPES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </Field>
            )}
            <Field label="Rationale" help="required"><TextArea rows={3} value={rationale} onChange={setRationale} placeholder="What evidence drove this, and what would change your mind?" /></Field>
            <div className="row" style={{ justifyContent: 'flex-end' }}>
              <button type="button" className={`btn primary ${decision === 'kill' ? 'danger' : ''}`} disabled={!rationale.trim() || (decision === 'pivot' && !pivotType)} onClick={record}>Record {decision}</button>
            </div>
          </div>
        </Card>
      )}

      <Card title="Decision history" hint={`${idea.decisions.length}`}>
        {idea.decisions.length === 0 ? <p className="small muted">Nothing recorded yet.</p> : (
          <table className="tbl">
            <thead><tr><th>Date</th><th>Stage</th><th>Decision</th><th>Rationale</th></tr></thead>
            <tbody>{[...idea.decisions].reverse().map(d => (
              <tr key={d.id}><td className="nowrap">{fmtDate(d.date)}</td><td className="nowrap">{STAGE_LABEL[d.stage]}</td><td><Chip tone={d.decision === 'kill' ? 'bad' : d.decision === 'pivot' || d.decision === 'hold' ? 'warn' : 'good'}>{d.decision}</Chip>{d.pivotType && <div className="tiny muted mt8">{d.pivotType}</div>}</td><td>{d.rationale}</td></tr>
            ))}</tbody>
          </table>
        )}
      </Card>
    </div>
  )
}
