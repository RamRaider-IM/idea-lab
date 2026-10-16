import type { Idea, PlanData, ResearchData, Settings, Stage, MetricEntry, MetricKey } from './types'

// ---------- helpers ----------
const avg = (xs: number[]): number | null => {
  const v = xs.filter(x => x > 0)
  if (v.length !== xs.length) return null
  return v.reduce((a, b) => a + b, 0) / v.length
}
export const pct = (num: number, den: number): number | null => (den > 0 ? (num / den) * 100 : null)
export const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x))
export const fmt = (n: number | null | undefined, digits = 0): string => {
  if (n === null || n === undefined || Number.isNaN(n)) return '–'
  return n.toLocaleString(undefined, { maximumFractionDigits: digits, minimumFractionDigits: 0 })
}
export const fmtPct = (n: number | null | undefined, digits = 1): string => (n === null || n === undefined || Number.isNaN(n) ? '–' : `${n.toFixed(digits)}%`)
export const compact = (n: number | null | undefined, currency = ''): string => {
  if (n === null || n === undefined || Number.isNaN(n)) return '–'
  const a = Math.abs(n)
  const s = a >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : a >= 10_000 ? `${(n / 1000).toFixed(0)}K` : a >= 1000 ? `${(n / 1000).toFixed(1)}K` : fmt(n)
  return currency + s
}

// ---------- Plan scores ----------
/** Hormozi's "starving crowd": pain, purchasing power, easy to target, growing. 0-5. */
export const marketScore = (p: PlanData): number | null => avg([p.market.pain, p.market.money, p.market.targetable, p.market.growing])

/** Priestley's sweet spot: passion, skill, unfair advantage. 0-5. */
export const fitScore = (p: PlanData): number | null => avg([p.fit.passion, p.fit.skill, p.fit.unfair])

/** Hormozi's value equation: (dream × likelihood) / (time × effort). Inputs 1-10. */
export const valueRatio = (p: PlanData): number | null => {
  const { dream, likelihood, time, effort } = p.value
  if (!dream || !likelihood || !time || !effort) return null
  return (dream * likelihood) / (time * effort)
}
/** Value ratio mapped to 0-10 on a log scale: ratio 1 → 5, ratio 10 → 7.5, ratio 100 → 10. */
export const valueScore = (p: PlanData): number | null => {
  const r = valueRatio(p)
  if (r === null) return null
  return clamp(((Math.log10(r) + 2) / 4) * 10, 0, 10)
}

export const planCompleteness = (p: PlanData): number => {
  const checks = [
    !!p.avatar.trim(),
    !!p.dreamOutcome.trim(),
    marketScore(p) !== null,
    fitScore(p) !== null,
    p.problems.length > 0,
    valueRatio(p) !== null,
    !!p.offer.core.trim(),
    !!p.valueHypothesis.trim(),
    !!p.growthHypothesis.trim(),
    p.assumptions.length > 0,
  ]
  return checks.filter(Boolean).length / checks.length
}

// ---------- Research scores ----------
export interface DemandSummary {
  planned: number
  running: number
  done: number
  validated: number
  invalidated: number
  inconclusive: number
  waitlist: number       // total waiting-list + landing-page + scorecard sign-ups
  presales: number
  interviews: number
  landingConv: number | null
  outreachReached: number
  outreachResult: number
}

export function demandSummary(r: ResearchData): DemandSummary {
  const s: DemandSummary = { planned: 0, running: 0, done: 0, validated: 0, invalidated: 0, inconclusive: 0, waitlist: 0, presales: 0, interviews: 0, landingConv: null, outreachReached: 0, outreachResult: 0 }
  let landReached = 0, landResult = 0
  for (const t of r.tests) {
    s[t.status]++
    if (t.verdict === 'validated') s.validated++
    if (t.verdict === 'invalidated') s.invalidated++
    if (t.verdict === 'inconclusive') s.inconclusive++
    if (t.type === 'waitlist' || t.type === 'landing' || t.type === 'scorecard') s.waitlist += t.result
    if (t.type === 'landing' || t.type === 'waitlist') { landReached += t.reached; landResult += t.result }
    if (t.type === 'presale') s.presales += t.result
    if (t.type === 'interviews') s.interviews += t.result
    if (t.type === 'warm' || t.type === 'cold' || t.type === 'content' || t.type === 'ads') { s.outreachReached += t.reached; s.outreachResult += t.result }
  }
  s.landingConv = pct(landResult, landReached)
  return s
}

/** 0-10. Verdicts carry most of the weight; hard signals (money, names) top it up. */
export function demandScore(r: ResearchData, g: Settings['gates']): number | null {
  const s = demandSummary(r)
  if (s.done === 0) return null
  const decided = s.validated + s.invalidated
  let score = decided > 0 ? (s.validated / decided) * 6 : 3
  if (s.presales >= g.presaleMin) score += 4
  else if (s.presales > 0) score += 2
  if (s.waitlist >= g.waitlistMin) score += 3
  else if (s.waitlist >= g.waitlistMin / 2) score += 1.5
  if (s.landingConv !== null && s.landingConv >= g.landingConvMin) score += 1
  return clamp(score, 0, 10)
}

// ---------- Traction (Lean Startup innovation accounting) ----------
export interface Traction {
  weeks: number
  northStar: MetricKey
  series: { weekOf: string; value: number }[]
  last: MetricEntry | null
  prev: MetricEntry | null
  growth: number | null          // compound weekly growth of north star over the window, %
  wow: number | null             // last week vs previous, %
  visitors4: number
  signups4: number
  newPaying4: number
  revenue4: number
  spend4: number
  signupConv: number | null      // % visitors -> sign-ups (4w)
  payingConv: number | null      // % sign-ups -> new paying (4w)
  activationRate: number | null  // % sign-ups -> activated (4w)
  cac: number | null
  arpu: number | null            // weekly revenue per paying customer (last week)
  churnRate: number | null       // weekly churn % (avg over window)
  ltv: number | null
  ltvCac: number | null
  ltvEstimated: boolean
  vsTarget: number | null        // last week's north star as % of weekly target
}

const sortMetrics = (m: MetricEntry[]) => [...m].sort((a, b) => a.weekOf.localeCompare(b.weekOf))

export function traction(idea: Idea, window = 4): Traction {
  const m = sortMetrics(idea.metrics)
  const key = idea.launch.northStar
  const series = m.map(e => ({ weekOf: e.weekOf, value: e[key] }))
  const last = m[m.length - 1] ?? null
  const prev = m[m.length - 2] ?? null
  const win = m.slice(-window)
  const sum = (k: keyof MetricEntry) => win.reduce((a, e) => a + (Number(e[k]) || 0), 0)
  const visitors4 = sum('visitors'), signups4 = sum('signups'), newPaying4 = sum('newPaying'), revenue4 = sum('revenue'), spend4 = sum('spend')
  const activated4 = sum('activated')
  let growth: number | null = null
  if (win.length >= 2) {
    const first = win[0][key], lastV = win[win.length - 1][key]
    if (first > 0 && lastV >= 0) growth = (Math.pow(lastV / first, 1 / (win.length - 1)) - 1) * 100
  }
  const wow = last && prev && prev[key] > 0 ? ((last[key] - prev[key]) / prev[key]) * 100 : null
  const cac = newPaying4 > 0 && spend4 > 0 ? spend4 / newPaying4 : null
  const arpu = last && last.paying > 0 ? last.revenue / last.paying : null
  const churns: number[] = []
  for (let i = 1; i < m.length; i++) {
    const p = m[i - 1].paying
    if (p > 0) churns.push((m[i].churned / p) * 100)
  }
  const churnRate = churns.length ? churns.slice(-window).reduce((a, b) => a + b, 0) / Math.min(churns.length, window) : null
  let ltv: number | null = null, ltvEstimated = false
  if (arpu !== null) {
    if (churnRate !== null && churnRate > 0) ltv = arpu / (churnRate / 100)
    else { ltv = arpu * 26; ltvEstimated = true } // no churn observed yet: assume a 6-month life
  }
  const ltvCac = ltv !== null && cac !== null ? ltv / cac : null
  // Weekly targets are per-week counts; 'paying' is a running total, so compare new paying customers instead.
  const targetKey = key === 'activated' ? 'signups' : key
  const target = idea.launch.weeklyTargets[targetKey as keyof typeof idea.launch.weeklyTargets]
  const lastForTarget = last ? (key === 'paying' ? last.newPaying : last[key]) : 0
  const vsTarget = last && target > 0 ? (lastForTarget / target) * 100 : null
  return {
    weeks: m.length, northStar: key, series, last, prev, growth, wow,
    visitors4, signups4, newPaying4, revenue4, spend4,
    signupConv: pct(signups4, visitors4), payingConv: pct(newPaying4, signups4), activationRate: pct(activated4, signups4),
    cac, arpu, churnRate, ltv, ltvCac, ltvEstimated, vsTarget,
  }
}

/** 0-10 blend of growth, conversion and unit economics. */
export function tractionScore(idea: Idea, g: Settings['gates']): number | null {
  const t = traction(idea)
  if (t.weeks < 2) return null
  let s = 0
  if (t.growth !== null) s += clamp((t.growth / g.growthMin) * 4, -2, 5)
  if (t.payingConv !== null) s += clamp((t.payingConv / g.payingConvMin) * 2, 0, 3)
  if (t.ltvCac !== null) s += clamp((t.ltvCac / g.ltvCacMin) * 2, 0, 2)
  else if (t.revenue4 > 0) s += 1
  return clamp(s, 0, 10)
}

// ---------- Gates ----------
export interface GateItem { label: string; ok: boolean; warn?: boolean; detail?: string; value?: string }
export interface Gate { stage: Stage; title: string; next: string; items: GateItem[]; passed: number; total: number; ready: boolean }

export function gateFor(idea: Idea, settings: Settings): Gate {
  const g = settings.gates
  const p = idea.plan
  const items: GateItem[] = []
  const stage = idea.stage
  if (stage === 'plan') {
    const ms = marketScore(p), vs = valueScore(p), fs = fitScore(p)
    items.push({ label: 'Avatar and dream outcome written', ok: !!p.avatar.trim() && !!p.dreamOutcome.trim(), detail: 'Who exactly, and what do they want?' })
    items.push({ label: `Market scores at least ${g.marketMin} / 5`, ok: ms !== null && ms >= g.marketMin, value: ms === null ? 'unscored' : `${ms.toFixed(1)} / 5`, detail: 'Pain, purchasing power, easy to target, growing' })
    items.push({ label: 'Founder fit scored', ok: fs !== null, warn: fs !== null && fs < 3, value: fs === null ? 'unscored' : `${fs.toFixed(1)} / 5`, detail: 'Passion, skill, unfair advantage' })
    items.push({ label: 'At least three problems mapped to solutions', ok: p.problems.filter(x => x.problem.trim() && x.solution.trim()).length >= 3, value: `${p.problems.length}` })
    items.push({ label: `Value score at least ${g.valueMin} / 10`, ok: vs !== null && vs >= g.valueMin, value: vs === null ? 'unscored' : `${vs.toFixed(1)} / 10`, detail: 'Dream outcome × likelihood ÷ time × effort' })
    items.push({ label: 'Offer drafted', ok: !!p.offer.core.trim() && !!p.offer.price.trim(), detail: 'Core offer and a price to test' })
    items.push({ label: 'Value and growth hypotheses written', ok: !!p.valueHypothesis.trim() && !!p.growthHypothesis.trim(), detail: 'The two leap-of-faith assumptions' })
    items.push({ label: 'Riskiest assumptions listed', ok: p.assumptions.length >= 2, value: `${p.assumptions.length}` })
  } else if (stage === 'research') {
    const s = demandSummary(idea.research)
    const riskyOpen = p.assumptions.filter(a => a.risk === 3 && a.status === 'untested').length
    const riskyDead = p.assumptions.filter(a => a.risk === 3 && a.status === 'invalidated').length
    const signal = s.presales >= g.presaleMin || s.waitlist >= g.waitlistMin || (s.landingConv !== null && s.landingConv >= g.landingConvMin && s.waitlist >= g.waitlistMin / 2)
    items.push({ label: 'At least two demand tests finished', ok: s.done >= 2, value: `${s.done} done` })
    items.push({ label: 'At least one test validated', ok: s.validated >= 1, value: `${s.validated} validated, ${s.invalidated} invalidated` })
    items.push({ label: 'Every high-risk assumption tested', ok: riskyOpen === 0, value: riskyOpen ? `${riskyOpen} untested` : 'all tested' })
    items.push({ label: 'No high-risk assumption invalidated', ok: riskyDead === 0, value: riskyDead ? `${riskyDead} invalidated` : 'none' , detail: 'If one is, pivot the idea before building' })
    items.push({ label: 'Hard demand signal', ok: signal, detail: `${g.presaleMin}+ pre-sales, or ${g.waitlistMin}+ names, or ${g.landingConvMin}%+ landing conversion with ${g.waitlistMin / 2}+ names`, value: `${s.presales} paid · ${s.waitlist} names · ${fmtPct(s.landingConv)}` })
    items.push({ label: 'Ten or more customer conversations', ok: s.interviews >= 10, warn: s.interviews < 10 && s.interviews > 0, value: `${s.interviews}` })
  } else if (stage === 'build') {
    const l = idea.launch
    const chan = Object.values(l.channels).some(Boolean)
    const checklistDone = l.checklist.filter(c => c.done).length
    items.push({ label: 'MVP scope written (and what is out)', ok: !!l.mvpScope.trim() && !!l.notInScope.trim() })
    items.push({ label: 'North-star metric chosen with weekly targets', ok: Object.values(l.weeklyTargets).some(v => v > 0) })
    items.push({ label: 'At least one acquisition channel chosen', ok: chan, detail: 'Warm, cold, content, paid' })
    items.push({ label: 'Engine of growth named', ok: !!l.engine, detail: 'Sticky, viral or paid' })
    items.push({ label: 'Launch date set', ok: !!l.launchDate, value: l.launchDate || 'none' })
    items.push({ label: 'Launch checklist complete', ok: l.checklist.length > 0 && checklistDone === l.checklist.length, value: `${checklistDone} / ${l.checklist.length}` })
  } else if (stage === 'monitor') {
    const t = traction(idea)
    items.push({ label: `${g.monitorWeeks}+ weeks of metrics logged`, ok: t.weeks >= g.monitorWeeks, value: `${t.weeks} weeks` })
    items.push({ label: `North star growing ${g.growthMin}%+ a week`, ok: t.growth !== null && t.growth >= g.growthMin, value: fmtPct(t.growth) + ' / wk' })
    items.push({ label: `Sign-up to paying conversion ${g.payingConvMin}%+`, ok: t.payingConv !== null && t.payingConv >= g.payingConvMin, value: fmtPct(t.payingConv) })
    items.push({ label: `LTV : CAC at least ${g.ltvCacMin}`, ok: t.ltvCac !== null && t.ltvCac >= g.ltvCacMin, warn: t.ltvCac === null, value: t.ltvCac === null ? 'not yet measurable' : `${t.ltvCac.toFixed(1)}×` })
    items.push({ label: 'Hitting weekly target', ok: t.vsTarget !== null && t.vsTarget >= 100, value: t.vsTarget === null ? 'no target' : `${t.vsTarget.toFixed(0)}% of target` })
  } else {
    items.push({ label: `Outcome recorded: ${idea.outcome || 'none'}`, ok: !!idea.outcome })
  }
  const passed = items.filter(i => i.ok).length
  const titles: Record<Stage, [string, string]> = {
    plan: ['Ready to research?', 'Move to Research'],
    research: ['Ready to build?', 'Move to Build & launch'],
    build: ['Ready to launch?', 'Launch and start monitoring'],
    monitor: ['Ready to decide?', 'Make the call'],
    decided: ['Decided', ''],
  }
  return { stage, title: titles[stage][0], next: titles[stage][1], items, passed, total: items.length, ready: passed === items.length }
}

// ---------- Recommendation (pivot / persevere / kill) ----------
export type Verdict = 'scale' | 'persevere' | 'pivot' | 'kill' | 'early'
export interface Recommendation { verdict: Verdict; headline: string; reasons: string[] }

export function recommend(idea: Idea, settings: Settings): Recommendation {
  const g = settings.gates
  const reasons: string[] = []
  if (idea.stage === 'plan') {
    const ms = marketScore(idea.plan), vs = valueScore(idea.plan)
    if (ms !== null && ms < 2.5) return { verdict: 'kill', headline: 'Weak market. Park it.', reasons: [`Market scores ${ms.toFixed(1)} / 5: no starving crowd, no amount of offer-craft fixes that.`] }
    if (vs !== null && vs < 4) return { verdict: 'pivot', headline: 'The offer is not valuable enough yet.', reasons: ['Raise the dream outcome or likelihood, or cut the time and effort the customer bears.'] }
    return { verdict: 'early', headline: 'Finish the plan, then test demand.', reasons: ['Nothing here is evidence yet. The gate below says what is missing.'] }
  }
  if (idea.stage === 'research') {
    const s = demandSummary(idea.research)
    const ds = demandScore(idea.research, g)
    const riskyDead = idea.plan.assumptions.filter(a => a.risk === 3 && a.status === 'invalidated').length
    if (riskyDead > 0) return { verdict: 'pivot', headline: 'A high-risk assumption failed.', reasons: [`${riskyDead} high-risk assumption(s) invalidated. Change the customer, the problem or the offer before spending on a build.`] }
    if (s.done >= 3 && s.validated === 0) return { verdict: 'kill', headline: 'Nobody is biting.', reasons: [`${s.done} tests done, none validated. Either the avatar or the promise is wrong.`] }
    if (ds !== null && ds >= 7) return { verdict: 'persevere', headline: 'Demand is real. Build the MVP.', reasons: [`Demand score ${ds.toFixed(1)} / 10.`, s.presales ? `${s.presales} people paid before there was a product.` : `${s.waitlist} people put their name down.`] }
    return { verdict: 'early', headline: 'Keep testing until the signal is unambiguous.', reasons: ['Aim for money or names, not compliments.'] }
  }
  if (idea.stage === 'build') return { verdict: 'early', headline: 'Ship the smallest thing that keeps the promise.', reasons: ['Every week before launch is a week without data.'] }
  if (idea.stage === 'monitor') {
    const t = traction(idea)
    if (t.weeks < 2) return { verdict: 'early', headline: 'Too early to judge.', reasons: [`${t.weeks} week(s) of data. Log at least ${g.monitorWeeks}.`] }
    const growing = t.growth !== null && t.growth >= g.growthMin
    const converting = t.payingConv !== null && t.payingConv >= g.payingConvMin
    const economics = t.ltvCac !== null && t.ltvCac >= g.ltvCacMin
    if (t.growth !== null) reasons.push(`North star (${t.northStar}) ${t.growth >= 0 ? 'growing' : 'shrinking'} ${Math.abs(t.growth).toFixed(1)}% a week against a ${g.growthMin}% bar.`)
    if (t.payingConv !== null) reasons.push(`${t.payingConv.toFixed(1)}% of sign-ups pay (bar: ${g.payingConvMin}%).`)
    if (t.ltvCac !== null) reasons.push(`LTV : CAC is ${t.ltvCac.toFixed(1)}× (bar: ${g.ltvCacMin}×)${t.ltvEstimated ? ', with lifetime estimated' : ''}.`)
    if (t.weeks < g.monitorWeeks) return { verdict: 'early', headline: 'Early signal. Keep logging.', reasons }
    if (growing && converting && (economics || t.ltvCac === null)) return { verdict: 'scale', headline: 'It works. Pour fuel on it.', reasons }
    if (growing || (converting && t.revenue4 > 0)) return { verdict: 'persevere', headline: 'Something is working. Tune the engine.', reasons: [...reasons, growing ? 'Growth is there; fix conversion or economics next.' : 'People pay; fix the top of the funnel next.'] }
    if (t.signups4 > 0 && t.newPaying4 === 0) return { verdict: 'pivot', headline: 'Interest without payment. Change the offer, not the audience.', reasons: [...reasons, 'Sign-ups prove the problem is real. Zero payment says the promise or price is wrong.'] }
    if (t.visitors4 > 0 && t.signups4 === 0) return { verdict: 'pivot', headline: 'Traffic without interest. Change the promise or the audience.', reasons: [...reasons, 'People arrive and leave: the page is not speaking to a pain they feel.'] }
    return { verdict: 'kill', headline: 'Flat for a month with nothing to tune. Stop and reinvest the time.', reasons }
  }
  return { verdict: 'early', headline: `Decided: ${idea.outcome}`, reasons: [] }
}

export const VERDICT_LABEL: Record<Verdict, string> = { scale: 'Scale', persevere: 'Persevere', pivot: 'Pivot', kill: 'Kill', early: 'Too early' }
export const VERDICT_TONE: Record<Verdict, 'good' | 'warn' | 'bad' | ''> = { scale: 'good', persevere: 'good', pivot: 'warn', kill: 'bad', early: '' }

// ---------- Portfolio summary ----------
export interface IdeaScores { market: number | null; value: number | null; demand: number | null; traction: number | null; fit: number | null }
export function scores(idea: Idea, settings: Settings): IdeaScores {
  return {
    market: marketScore(idea.plan),
    value: valueScore(idea.plan),
    fit: fitScore(idea.plan),
    demand: demandScore(idea.research, settings.gates),
    traction: tractionScore(idea, settings.gates),
  }
}

export const PIVOT_TYPES = [
  'Zoom-in: one feature becomes the product',
  'Zoom-out: the product becomes one feature',
  'Customer segment: same problem, different avatar',
  'Customer need: same avatar, different problem',
  'Platform: app ↔ platform',
  'Business architecture: high-margin/low-volume ↔ low-margin/high-volume',
  'Value capture: change how you charge',
  'Engine of growth: sticky ↔ viral ↔ paid',
  'Channel: change how it reaches customers',
  'Technology: same solution, new tech',
]
