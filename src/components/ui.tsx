import { useEffect, useState, type ReactNode } from 'react'
import type { Gate } from '../scoring'

// ---------- Routing ----------
export function useHash(): string {
  const [h, setH] = useState(() => window.location.hash || '#/')
  useEffect(() => {
    const on = () => setH(window.location.hash || '#/')
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  return h
}
export const go = (to: string) => { window.location.hash = to }

export function Link({ to, children, className, active }: { to: string; children: ReactNode; className?: string; active?: boolean }) {
  return <a href={to} className={[className, active ? 'active' : ''].filter(Boolean).join(' ')}>{children}</a>
}

// ---------- Layout ----------
export function Card({ title, hint, why, right, children, className }: { title?: ReactNode; hint?: ReactNode; why?: ReactNode; right?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={['card', className].filter(Boolean).join(' ')}>
      {(title || right) && (
        <div className="card-head">
          <div>{typeof title === 'string' ? <h2>{title}</h2> : title}{hint && <div className="hint">{hint}</div>}</div>
          {right}
        </div>
      )}
      {why && <p className="why">{why}</p>}
      {children}
    </section>
  )
}

export function Chip({ tone = '', children, dot }: { tone?: '' | 'good' | 'warn' | 'bad' | 'accent' | 'outline'; children: ReactNode; dot?: boolean }) {
  return <span className={`chip ${tone}`}>{dot && <span className="ic" />}{children}</span>
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return <div className="empty"><h3>{title}</h3>{children}</div>
}

// ---------- Fields ----------
export function Field({ label, help, helpBelow, children }: { label: ReactNode; help?: ReactNode; helpBelow?: ReactNode; children: ReactNode }) {
  return (
    <label className="field">
      <span className="lbl"><span>{label}</span>{help && <span className="help">{help}</span>}</span>
      {children}
      {helpBelow && <span className="help-below">{helpBelow}</span>}
    </label>
  )
}

export function TextInput({ value, onChange, placeholder, type = 'text', autoFocus }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: 'text' | 'date' | 'url'; autoFocus?: boolean }) {
  return <input type={type} value={value} placeholder={placeholder} autoFocus={autoFocus} onChange={e => onChange(e.target.value)} />
}

export function TextArea({ value, onChange, placeholder, rows = 3 }: { value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
  return <textarea value={value} placeholder={placeholder} rows={rows} onChange={e => onChange(e.target.value)} />
}

export function NumberInput({ value, onChange, placeholder, min = 0, step, className }: { value: number; onChange: (v: number) => void; placeholder?: string; min?: number; step?: number; className?: string }) {
  return <input className={className} type="number" min={min} step={step} value={Number.isFinite(value) && value !== 0 ? value : (value === 0 ? '0' : '')} placeholder={placeholder} onChange={e => onChange(e.target.value === '' ? 0 : Number(e.target.value))} />
}

export function Rating({ value, onChange, max = 5 }: { value: number; onChange: (v: number) => void; max?: number }) {
  return (
    <div className={`rating ${max > 5 ? 'wide' : ''}`} role="radiogroup">
      {Array.from({ length: max }, (_, i) => i + 1).map(n => (
        <button key={n} type="button" role="radio" aria-checked={value === n} className={value === n ? 'on' : ''} onClick={() => onChange(value === n ? 0 : n)}>{n}</button>
      ))}
    </div>
  )
}

export function RatingRow({ q, d, value, onChange, max = 5 }: { q: string; d?: string; value: number; onChange: (v: number) => void; max?: number }) {
  return (
    <div className={`rating-row ${max > 5 ? 'stacked' : ''}`}>
      <div className="q">{q}{d && <div className="d">{d}</div>}</div>
      <Rating value={value} onChange={onChange} max={max} />
    </div>
  )
}

export function Segmented<T extends string>({ options, value, onChange }: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="segmented">
      {options.map(o => <button key={o.value} type="button" className={o.value === value ? 'on' : ''} onClick={() => onChange(o.value)}>{o.label}</button>)}
    </div>
  )
}

export function PillSelect<T extends string>({ options, value, onChange }: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="pill-select">
      {options.map(o => <button key={o.value} type="button" className={o.value === value ? 'on' : ''} onClick={() => onChange(o.value)}>{o.label}</button>)}
    </div>
  )
}

// ---------- Figures ----------
export function Meter({ value, max = 1, tone }: { value: number; max?: number; tone?: 'good' | 'warn' | 'bad' | '' }) {
  const p = Math.max(0, Math.min(1, max > 0 ? value / max : 0)) * 100
  return <div className={`meter ${tone ?? ''}`}><span style={{ width: `${p}%` }} /></div>
}

export function Stat({ label, value, delta, deltaUp, hero, spark, sub }: { label: string; value: ReactNode; delta?: string; deltaUp?: boolean | null; hero?: boolean; spark?: ReactNode; sub?: ReactNode }) {
  const cls = deltaUp === true ? 'up' : deltaUp === false ? 'down' : ''
  return (
    <div className="stat">
      <span className="label">{label}</span>
      <span className={`value ${hero ? 'hero' : ''}`}>{value}</span>
      {delta && <span className={`delta ${cls}`}>{deltaUp === true ? '↑' : deltaUp === false ? '↓' : ''} {delta}</span>}
      {sub && <span className="delta">{sub}</span>}
      {spark && <div className="spark">{spark}</div>}
    </div>
  )
}

// ---------- Gate ----------
export function GateList({ gate }: { gate: Gate }) {
  return (
    <div className="gate">
      {gate.items.map((it, i) => (
        <div className="g" key={i}>
          <span className={`mark ${it.ok ? 'ok' : it.warn ? 'warn' : 'no'}`}>{it.ok ? '✓' : it.warn ? '!' : ''}</span>
          <div>
            <div>{it.label}</div>
            {it.detail && <div className="d">{it.detail}</div>}
          </div>
          <span className="v">{it.value ?? ''}</span>
        </div>
      ))}
    </div>
  )
}

// ---------- Modal ----------
export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  useEffect(() => {
    if (!open) return
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="modal-bg" onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <h2 className="mb12">{title}</h2>
        {children}
      </div>
    </div>
  )
}

export const fmtDate = (iso: string): string => {
  if (!iso) return '–'
  const d = new Date(iso + (iso.length === 10 ? 'T00:00:00' : ''))
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
}
