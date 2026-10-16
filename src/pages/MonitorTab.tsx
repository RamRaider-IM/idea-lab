import { useState } from 'react'
import { useStore, useIdeaUpdater } from '../store'
import { Card, Stat, Segmented, Chip, fmtDate, Link } from '../components/ui'
import { LineChart, Funnel, Sparkline } from '../components/charts'
import { traction, recommend, fmt, fmtPct, compact, VERDICT_LABEL, VERDICT_TONE } from '../scoring'
import { newMetricEntry, mondayOf, METRIC_LABEL, type Idea, type MetricEntry } from '../types'

type Win = '4' | '8' | '12' | 'all'
const NUM_COLS: { key: keyof MetricEntry; label: string; money?: boolean }[] = [
  { key: 'visitors', label: 'Visitors' },
  { key: 'signups', label: 'Sign-ups' },
  { key: 'activated', label: 'Activated' },
  { key: 'newPaying', label: 'New paying' },
  { key: 'paying', label: 'Paying (total)' },
  { key: 'churned', label: 'Churned' },
  { key: 'revenue', label: 'Revenue', money: true },
  { key: 'spend', label: 'Spend', money: true },
]

export default function MonitorTab({ idea }: { idea: Idea }) {
  const { state } = useStore()
  const cur = state.settings.currency
  const g = state.settings.gates
  const update = useIdeaUpdater(idea.id)
  const [win, setWin] = useState<Win>('8')
  const n = win === 'all' ? Infinity : Number(win)
  const all = [...idea.metrics].sort((a, b) => a.weekOf.localeCompare(b.weekOf))
  const shown = n === Infinity ? all : all.slice(-n)
  const t = traction({ ...idea, metrics: shown }, Math.max(2, shown.length))
  const rec = recommend(idea, state.settings)
  const key = idea.launch.northStar
  const isMoney = key === 'revenue'
  const unit = isMoney ? cur : ''
  const thisWeek = mondayOf(new Date())
  const hasThisWeek = all.some(m => m.weekOf === thisWeek)

  const setRow = (id: string, patch: Partial<MetricEntry>) => update(i => ({ metrics: i.metrics.map(m => (m.id === id ? { ...m, ...patch } : m)) }))
  const addWeek = () => {
    const last = all[all.length - 1]
    let weekOf = thisWeek
    if (last && last.weekOf >= thisWeek) { const d = new Date(last.weekOf + 'T00:00:00'); d.setDate(d.getDate() + 7); weekOf = mondayOf(d) }
    const e = newMetricEntry(weekOf)
    if (last) e.paying = last.paying
    update(i => ({ metrics: [...i.metrics, e] }))
  }
  const removeRow = (id: string) => { if (window.confirm('Delete this week?')) update(i => ({ metrics: i.metrics.filter(m => m.id !== id) })) }

  const points = t.series.map(p => ({ label: fmtDate(p.weekOf), value: p.value }))
  const targetKey = key === 'activated' ? 'signups' : key
  const target = idea.launch.weeklyTargets[targetKey as keyof typeof idea.launch.weeklyTargets]
  // 'paying' plots the running total, so a per-week target line would mislead; the gate uses new paying instead.
  const chartTarget = key !== 'paying' && target > 0 ? target : undefined
  const sum = (k: keyof MetricEntry) => shown.reduce((a, m) => a + (Number(m[k]) || 0), 0)

  const last = t.last, prev = t.prev
  const delta = (k: keyof MetricEntry) => (last && prev && Number(prev[k]) > 0 ? ((Number(last[k]) - Number(prev[k])) / Number(prev[k])) * 100 : null)
  const series = (k: keyof MetricEntry) => shown.map(m => Number(m[k]) || 0)

  if (all.length === 0) {
    return (
      <div className="stack">
        <Card title="Weekly metrics">
          <div className="empty">
            <h3>No weeks logged yet</h3>
            <p>Log one row a week, same day every week. The dashboard does the rest.</p>
            <button type="button" className="btn primary mt16" onClick={addWeek}>+ Log this week</button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="stack">
      <div className="spread">
        <div className="row">
          <span className="small muted">Window</span>
          <Segmented<Win> options={[{ value: '4', label: '4 wks' }, { value: '8', label: '8 wks' }, { value: '12', label: '12 wks' }, { value: 'all', label: 'All' }]} value={win} onChange={setWin} />
        </div>
        <button type="button" className={`btn sm ${hasThisWeek ? '' : 'primary'}`} onClick={addWeek}>{hasThisWeek ? '+ Add next week' : '+ Log this week'}</button>
      </div>

      <div className="grid4">
        <Card className="flat">
          <Stat label={`${METRIC_LABEL[key]} (north star), last week`} hero value={last ? (isMoney ? compact(last[key], cur) : fmt(last[key])) : '–'} delta={t.wow !== null ? `${t.wow >= 0 ? '+' : ''}${t.wow.toFixed(0)}% vs previous week` : undefined} deltaUp={t.wow === null ? null : t.wow >= 0} spark={<Sparkline values={series(key)} />} />
        </Card>
        <Card className="flat"><Stat label={`Weekly growth, ${shown.length} wks`} value={fmtPct(t.growth)} deltaUp={t.growth === null ? null : t.growth >= g.growthMin} delta={`bar: ${g.growthMin}% / wk`} /></Card>
        <Card className="flat"><Stat label="Sign-up → paying" value={fmtPct(t.payingConv)} deltaUp={t.payingConv === null ? null : t.payingConv >= g.payingConvMin} delta={`bar: ${g.payingConvMin}% · activation ${fmtPct(t.activationRate, 0)}`} /></Card>
        <Card className="flat"><Stat label="LTV : CAC" value={t.ltvCac === null ? '–' : `${t.ltvCac.toFixed(1)}×`} deltaUp={t.ltvCac === null ? null : t.ltvCac >= g.ltvCacMin} delta={t.cac === null ? 'no spend logged yet' : `CAC ${compact(t.cac, cur)} · LTV ${compact(t.ltv, cur)}${t.ltvEstimated ? ' (est.)' : ''}`} /></Card>
      </div>

      <div className="grid2">
        <Card title={`${METRIC_LABEL[key]} by week`} hint={target > 0 ? `target ${unit}${fmt(target)}${key === 'paying' ? ' new' : ''} / week` : 'no weekly target set'}>
          <LineChart points={points} title={METRIC_LABEL[key]} unit={unit} target={chartTarget} />
        </Card>
        <Card title="Funnel, window total" hint={`${shown.length} weeks`}>
          <Funnel steps={[{ label: 'Visitors', value: sum('visitors') }, { label: 'Sign-ups', value: sum('signups') }, { label: 'Activated', value: sum('activated') }, { label: 'New paying', value: sum('newPaying') }]} />
          <p className="tiny muted mt8">Percentages are step-to-step conversion. The weakest step is where next week’s work goes.</p>
        </Card>
      </div>

      <div className="grid4">
        {([['visitors', 'Visitors'], ['signups', 'Sign-ups'], ['paying', 'Paying customers'], ['revenue', 'Revenue']] as const).filter(([k]) => k !== key).slice(0, 4).map(([k, label]) => {
          const d = delta(k)
          return <Card className="flat" key={k}><Stat label={`${label}, last week`} value={last ? (k === 'revenue' ? compact(last[k], cur) : fmt(last[k])) : '–'} delta={d !== null ? `${d >= 0 ? '+' : ''}${d.toFixed(0)}% WoW` : undefined} deltaUp={d === null ? null : d >= 0} spark={<Sparkline values={series(k)} />} /></Card>
        })}
        <Card className="flat"><Stat label="Weekly churn" value={fmtPct(t.churnRate)} deltaUp={t.churnRate === null ? null : t.churnRate <= 2} delta="of paying customers" /></Card>
      </div>

      <Card title="Reading" right={rec.verdict !== 'early' && <Chip tone={VERDICT_TONE[rec.verdict]} dot>{VERDICT_LABEL[rec.verdict]}</Chip>}>
        <div className={`callout ${VERDICT_TONE[rec.verdict]}`}>
          <div className="title">{rec.headline}</div>
          {rec.reasons.length > 0 && <ul>{rec.reasons.map((r, i) => <li key={i}>{r}</li>)}</ul>}
        </div>
        <div className="row mt12"><Link to={`#/idea/${idea.id}/decide`} className="btn sm">Go to Decide →</Link></div>
      </Card>

      <Card title="Weekly log" hint="totals for the week; paying is the running total at week end" right={<button type="button" className="btn sm" onClick={addWeek}>+ Week</button>}>
        <div style={{ overflowX: 'auto' }}>
          <table className="tbl">
            <thead>
              <tr>
                <th>Week of</th>
                {NUM_COLS.map(c => <th key={c.key} className="num">{c.label}{c.money ? ` (${cur})` : ''}</th>)}
                <th>Notes</th><th />
              </tr>
            </thead>
            <tbody>
              {[...all].reverse().map(m => (
                <tr key={m.id} className={m.weekOf === thisWeek ? 'active' : ''}>
                  <td><input type="date" value={m.weekOf} onChange={e => setRow(m.id, { weekOf: e.target.value })} /></td>
                  {NUM_COLS.map(c => (
                    <td key={c.key} className="num"><input className="tiny-input" type="number" min={0} value={Number(m[c.key]) || 0} onChange={e => setRow(m.id, { [c.key]: Number(e.target.value) || 0 })} /></td>
                  ))}
                  <td style={{ minWidth: 180 }}><input type="text" value={m.notes} placeholder="What changed this week?" onChange={e => setRow(m.id, { notes: e.target.value })} /></td>
                  <td><button type="button" className="btn ghost sm danger" onClick={() => removeRow(m.id)}>×</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
