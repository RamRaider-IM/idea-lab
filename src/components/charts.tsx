import { useMemo, useRef, useState } from 'react'
import { compact, fmt } from '../scoring'

// ---------- Sparkline (12-point, de-emphasised, last point accented) ----------
export function Sparkline({ values, width = 110, height = 28 }: { values: number[]; width?: number; height?: number }) {
  const v = values.slice(-12)
  if (v.length < 2) return <svg width={width} height={height} aria-hidden="true" />
  const max = Math.max(...v, 1), min = Math.min(...v, 0)
  const x = (i: number) => 4 + (i / (v.length - 1)) * (width - 8)
  const y = (n: number) => height - 4 - ((n - min) / (max - min || 1)) * (height - 8)
  const d = v.map((n, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(n).toFixed(1)}`).join(' ')
  const lx = x(v.length - 1), ly = y(v[v.length - 1])
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <path d={d} fill="none" stroke="var(--axis)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={lx} cy={ly} r="4" fill="var(--series-1)" stroke="var(--surface)" strokeWidth="2" />
    </svg>
  )
}

// ---------- Single-series line chart with area wash, crosshair, tooltip, table view ----------
export interface Point { label: string; value: number }
export function LineChart({ points, title, unit = '', target, height = 220, compactY = true }: { points: Point[]; title: string; unit?: string; target?: number; height?: number; compactY?: boolean }) {
  const [hover, setHover] = useState<number | null>(null)
  const [table, setTable] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const W = 640, H = height, padL = 44, padR = 56, padT = 16, padB = 28
  const n = points.length
  const { max, ticks } = useMemo(() => {
    const raw = Math.max(1, ...points.map(p => p.value), target ?? 0)
    const mag = Math.pow(10, Math.floor(Math.log10(raw)))
    const nice = [1, 2, 2.5, 5, 10].map(m => m * mag).find(m => raw / m <= 4) ?? mag * 10
    const top = Math.ceil(raw / nice) * nice
    const ticks: number[] = []
    for (let t = 0; t <= top + 1e-9; t += nice) ticks.push(t)
    return { max: top, ticks }
  }, [points, target])
  const x = (i: number) => (n > 1 ? padL + (i / (n - 1)) * (W - padL - padR) : padL)
  const y = (v: number) => padT + (1 - v / max) * (H - padT - padB)
  const path = points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(' ')
  const area = n > 0 ? `${path} L${x(n - 1).toFixed(1)},${y(0).toFixed(1)} L${x(0).toFixed(1)},${y(0).toFixed(1)} Z` : ''
  const fmtY = (v: number) => (compactY ? compact(v, unit) : unit + fmt(v))
  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    const px = ((e.clientX - r.left) / r.width) * W
    let best = 0, bd = Infinity
    for (let i = 0; i < n; i++) { const d = Math.abs(x(i) - px); if (d < bd) { bd = d; best = i } }
    setHover(best)
  }
  if (n === 0) return <div className="empty small">No data yet</div>
  const last = points[n - 1]
  const hp = hover !== null ? points[hover] : null
  return (
    <div className="chart" ref={ref}>
      <div className="spread mb8">
        <span className="small ink2">{title}</span>
        <button type="button" className="btn ghost sm" onClick={() => setTable(t => !t)}>{table ? 'Chart' : 'Table'}</button>
      </div>
      {table ? (
        <table className="tbl"><thead><tr><th>Week</th><th className="num">{title}</th></tr></thead>
          <tbody>{points.map((p, i) => <tr key={i}><td>{p.label}</td><td className="num">{unit}{fmt(p.value)}</td></tr>)}</tbody></table>
      ) : (
        <>
          <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={title} onPointerMove={onMove} onPointerLeave={() => setHover(null)} style={{ touchAction: 'none' }}>
            {ticks.map(t => (
              <g key={t}>
                <line x1={padL} x2={W - padR} y1={y(t)} y2={y(t)} stroke={t === 0 ? 'var(--axis)' : 'var(--hairline)'} strokeWidth="1" />
                <text x={padL - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill="var(--muted)" style={{ fontVariantNumeric: 'tabular-nums' }}>{fmtY(t)}</text>
              </g>
            ))}
            {target !== undefined && target > 0 && (
              <g>
                <line x1={padL} x2={W - padR} y1={y(target)} y2={y(target)} stroke="var(--series-2)" strokeWidth="1" />
                <text x={W - padR + 6} y={y(target) + 4} fontSize="11" fill="var(--ink-2)">target</text>
              </g>
            )}
            {points.map((p, i) => (i === 0 || i === n - 1 || n <= 8 || i % Math.ceil(n / 8) === 0) && (
              <text key={i} x={x(i)} y={H - 8} textAnchor={i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'} fontSize="11" fill="var(--muted)">{p.label}</text>
            ))}
            <path d={area} fill="var(--series-1)" opacity="0.10" />
            <path d={path} fill="none" stroke="var(--series-1)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
            {hp && hover !== null && <line x1={x(hover)} x2={x(hover)} y1={padT} y2={H - padB} stroke="var(--axis)" strokeWidth="1" />}
            <circle cx={x(n - 1)} cy={y(last.value)} r="4" fill="var(--series-1)" stroke="var(--surface)" strokeWidth="2" />
            {hp && hover !== null && hover !== n - 1 && <circle cx={x(hover)} cy={y(hp.value)} r="4" fill="var(--series-1)" stroke="var(--surface)" strokeWidth="2" />}
            <text x={x(n - 1) + 8} y={y(last.value) + 4} fontSize="12" fontWeight="600" fill="var(--ink)" style={{ fontVariantNumeric: 'tabular-nums' }}>{unit}{fmt(last.value)}</text>
          </svg>
          {hp && hover !== null && (
            <div className="tip" style={{ left: `calc(${(x(hover) / W) * 100}% + 12px)`, top: 36, transform: x(hover) > W * 0.7 ? 'translateX(calc(-100% - 24px))' : undefined }}>
              <div className="d">{hp.label}</div>
              <div className="v"><span className="k" />{unit}{fmt(hp.value)}</div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ---------- Funnel: ordinal ramp, horizontal, labelled at the tip ----------
export function Funnel({ steps, unit = '' }: { steps: { label: string; value: number }[]; unit?: string }) {
  const max = Math.max(1, ...steps.map(s => s.value))
  const ramp = ['var(--ord-1)', 'var(--ord-2)', 'var(--ord-3)', 'var(--ord-4)', 'var(--ord-5)']
  const [hover, setHover] = useState<number | null>(null)
  return (
    <div className="chart">
      <table className="tbl" style={{ tableLayout: 'fixed' }}>
        <tbody>
          {steps.map((s, i) => {
            const prev = i > 0 ? steps[i - 1].value : null
            const conv = prev && prev > 0 ? (s.value / prev) * 100 : null
            const w = (s.value / max) * 100
            return (
              <tr key={i} onPointerEnter={() => setHover(i)} onPointerLeave={() => setHover(null)} style={{ background: hover === i ? 'var(--accent-wash)' : undefined }}>
                <td style={{ width: 140, borderBottom: 0, padding: '5px 8px' }}>{s.label}</td>
                <td style={{ borderBottom: 0, padding: '5px 8px' }}>
                  <div className="row">
                    <div style={{ flex: 1, height: 20, position: 'relative' }}>
                      <div style={{ width: `${w}%`, minWidth: s.value > 0 ? 4 : 0, height: 20, background: ramp[Math.min(i, ramp.length - 1)], borderRadius: '0 4px 4px 0', opacity: hover === null || hover === i ? 1 : 0.6 }} />
                    </div>
                    <span className="tabular small" style={{ width: 70, textAlign: 'right' }}>{unit}{fmt(s.value)}</span>
                  </div>
                </td>
                <td className="num small muted" style={{ width: 70, borderBottom: 0, padding: '5px 8px' }}>{conv !== null ? `${conv.toFixed(1)}%` : ''}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
