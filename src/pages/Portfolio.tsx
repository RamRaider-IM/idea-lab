import { useStore } from '../store'
import { Card, Chip, Stat, Link, go } from '../components/ui'
import { scores, recommend, gateFor, traction, demandSummary, compact, VERDICT_LABEL, VERDICT_TONE } from '../scoring'
import { STAGES, STAGE_LABEL, mondayOf, type Idea } from '../types'
import { exampleState } from '../seed'

function Pill({ k, v, max }: { k: string; v: number | null; max: number }) {
  return <span className="score-pill" title={`${k} score`}>{k} <b>{v === null ? '–' : v.toFixed(1)}</b><span className="muted">/{max}</span></span>
}

export default function Portfolio({ onNew }: { onNew: () => void }) {
  const { state, replaceState } = useStore()
  const { ideas, settings } = state
  const cur = settings.currency

  if (ideas.length === 0) {
    return (
      <>
        <div className="page-head"><div><h1>Portfolio</h1><p className="lede">Every idea moves through the same four phases and passes the same gates. Start with one.</p></div></div>
        <Card>
          <div className="empty">
            <h3>No ideas yet</h3>
            <p>Add your first idea, or load three worked examples to see how the system fits together.</p>
            <div className="row mt16" style={{ justifyContent: 'center' }}>
              <button type="button" className="btn primary" onClick={onNew}>+ New idea</button>
              <button type="button" className="btn" onClick={() => replaceState(exampleState())}>Load examples</button>
            </div>
          </div>
        </Card>
      </>
    )
  }

  const inPlay = ideas.filter(i => i.stage !== 'decided')
  const live = ideas.filter(i => i.stage === 'monitor')
  const testsRunning = ideas.reduce((a, i) => a + i.research.tests.filter(t => t.status === 'running').length, 0)
  const revenue4 = live.reduce((a, i) => a + traction(i).revenue4, 0)
  const paying = live.reduce((a, i) => a + (traction(i).last?.paying ?? 0), 0)

  // Attention list
  const thisWeek = mondayOf(new Date())
  const attention: { idea: Idea; text: string; tone: 'good' | 'warn' | 'bad' | '' ; to: string }[] = []
  for (const i of ideas) {
    if (i.stage === 'decided') continue
    const g = gateFor(i, settings)
    const r = recommend(i, settings)
    if (r.verdict === 'kill' || r.verdict === 'pivot') attention.push({ idea: i, text: `${VERDICT_LABEL[r.verdict]}: ${r.headline}`, tone: VERDICT_TONE[r.verdict], to: `#/idea/${i.id}/decide` })
    else if (g.ready) attention.push({ idea: i, text: `Gate passed: ${g.next.toLowerCase()}`, tone: 'good', to: `#/idea/${i.id}` })
    if (i.stage === 'monitor' && !i.metrics.some(m => m.weekOf === thisWeek)) attention.push({ idea: i, text: 'This week’s metrics not logged yet', tone: 'warn', to: `#/idea/${i.id}/monitor` })
    for (const t of i.research.tests) {
      if (t.status === 'running' && t.startedAt && (Date.now() - new Date(t.startedAt).getTime()) / 864e5 > 21) attention.push({ idea: i, text: `“${t.name}” has run 3+ weeks: call it`, tone: 'warn', to: `#/idea/${i.id}/research` })
    }
    if (i.stage === 'research' && i.research.tests.length === 0) attention.push({ idea: i, text: 'No demand test set up yet', tone: '', to: `#/idea/${i.id}/research` })
  }

  return (
    <>
      <div className="page-head">
        <div><h1>Portfolio</h1><p className="lede">Where every idea sits, what the numbers say, and what needs a decision this week.</p></div>
        <button type="button" className="btn primary" onClick={onNew}>+ New idea</button>
      </div>

      <div className="grid4 mb12">
        <Card className="flat"><Stat label="Ideas in play" value={inPlay.length} sub={`${ideas.length - inPlay.length} decided`} /></Card>
        <Card className="flat"><Stat label="Demand tests running" value={testsRunning} sub={`${ideas.reduce((a, i) => a + demandSummary(i.research).done, 0)} finished`} /></Card>
        <Card className="flat"><Stat label="Apps live" value={live.length} sub={`${paying} paying customers`} /></Card>
        <Card className="flat"><Stat label="Revenue, last 4 weeks" value={compact(revenue4, cur)} sub="across live apps" /></Card>
      </div>

      {attention.length > 0 && (
        <Card title="Needs you this week" className="mb12">
          <div className="stack tight">
            {attention.slice(0, 8).map((a, i) => (
              <div key={i} className="spread" style={{ padding: '6px 0', borderBottom: i < Math.min(attention.length, 8) - 1 ? '1px solid var(--hairline)' : undefined }}>
                <div className="row"><Chip tone={a.tone} dot>{a.idea.name}</Chip><span className="small">{a.text}</span></div>
                <button type="button" className="btn ghost sm" onClick={() => go(a.to)}>Open →</button>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="board">
        {STAGES.map(stage => {
          const col = ideas.filter(i => i.stage === stage)
          return (
            <div className="col" key={stage}>
              <div className="col-head"><span>{STAGE_LABEL[stage]}</span><span>{col.length}</span></div>
              {col.map(i => {
                const s = scores(i, settings)
                const r = recommend(i, settings)
                return (
                  <Link key={i.id} to={`#/idea/${i.id}`} className="idea-card">
                    <div className="t">{i.name}</div>
                    <div className="s">{i.oneLiner || 'No one-liner yet'}</div>
                    <div className="scores">
                      {stage === 'decided' ? <Chip tone={i.outcome === 'scale' ? 'good' : i.outcome === 'kill' ? 'bad' : 'warn'}>{i.outcome || 'decided'}</Chip> : (
                        <>
                          <Pill k="M" v={s.market} max={5} />
                          <Pill k="V" v={s.value} max={10} />
                          {(stage === 'research' || stage === 'build' || stage === 'monitor') && <Pill k="D" v={s.demand} max={10} />}
                          {stage === 'monitor' && <Pill k="T" v={s.traction} max={10} />}
                        </>
                      )}
                    </div>
                    {stage !== 'decided' && r.verdict !== 'early' && <div className="mt8"><Chip tone={VERDICT_TONE[r.verdict]} dot>{VERDICT_LABEL[r.verdict]}</Chip></div>}
                  </Link>
                )
              })}
              {col.length === 0 && <div className="tiny muted" style={{ padding: '8px 4px' }}>Nothing here</div>}
            </div>
          )
        })}
      </div>
      <p className="tiny muted mt12">M = market /5 · V = value /10 · D = demand /10 · T = traction /10. Formulas in the <a href="#/guide">method guide</a>.</p>
    </>
  )
}
