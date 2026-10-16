// ---------- Pipeline stages ----------
export type Stage = 'plan' | 'research' | 'build' | 'monitor' | 'decided'
export const STAGES: Stage[] = ['plan', 'research', 'build', 'monitor', 'decided']
export const STAGE_LABEL: Record<Stage, string> = {
  plan: 'Plan',
  research: 'Research',
  build: 'Build & launch',
  monitor: 'Monitor',
  decided: 'Decided',
}

export type Outcome = '' | 'scale' | 'persevere' | 'pivot' | 'kill' | 'hold'

// ---------- Plan (Hormozi + Priestley + Lean) ----------
export interface Problem {
  id: string
  problem: string      // a problem the avatar has (before / during / after)
  solution: string     // how the offer solves it
  vehicle: string      // delivery vehicle (1:1, group, software, DIY, done-for-you...)
}

export interface Assumption {
  id: string
  text: string
  kind: 'value' | 'growth'
  risk: 1 | 2 | 3          // 1 = low, 3 = this could sink the idea
  status: 'untested' | 'validated' | 'invalidated'
}

export interface PlanData {
  avatar: string
  dreamOutcome: string
  // Hormozi's four market criteria, 1-5 (0 = unset)
  market: { pain: number; money: number; targetable: number; growing: number }
  // Priestley's sweet spot: do you care and can you do it
  fit: { passion: number; skill: number; unfair: number }
  problems: Problem[]
  // Hormozi value equation, each 1-10 (0 = unset)
  value: { dream: number; likelihood: number; time: number; effort: number }
  offer: { name: string; core: string; bonuses: string; guarantee: string; scarcity: string; price: string }
  valueHypothesis: string
  growthHypothesis: string
  assumptions: Assumption[]
}

// ---------- Research (demand tests) ----------
export type TestType =
  | 'waitlist' | 'landing' | 'presale' | 'scorecard' | 'interviews'
  | 'warm' | 'cold' | 'content' | 'ads' | 'other'

export const TEST_TYPE_LABEL: Record<TestType, string> = {
  waitlist: 'Waiting list',
  landing: 'Landing page',
  presale: 'Pre-sale / deposit',
  scorecard: 'Scorecard / quiz',
  interviews: 'Customer interviews',
  warm: 'Warm outreach',
  cold: 'Cold outreach',
  content: 'Content post',
  ads: 'Paid ads',
  other: 'Other',
}

export const TEST_TYPE_HINT: Record<TestType, { metric: string; target: number; hint: string }> = {
  waitlist: { metric: 'Sign-ups', target: 100, hint: 'Priestley: pitch the idea, collect names. Aim for 100 before you build.' },
  landing: { metric: 'Email sign-ups', target: 50, hint: 'One page, one promise, one call to action. Track visitors vs sign-ups.' },
  presale: { metric: 'Paid deposits', target: 10, hint: 'Strongest signal there is: money before product.' },
  scorecard: { metric: 'Completions', target: 100, hint: 'A short assessment that reveals the problem and captures leads.' },
  interviews: { metric: 'Interviews done', target: 10, hint: 'Ask about the problem, not your solution. Past behaviour beats opinions.' },
  warm: { metric: 'Positive replies', target: 10, hint: 'Hormozi: message 100 people you know. Lead with value, ask for a conversation.' },
  cold: { metric: 'Booked calls', target: 5, hint: 'Hormozi: volume and a clear offer. Track reached vs replied vs booked.' },
  content: { metric: 'Engaged responses', target: 20, hint: 'Post about the problem. Count DMs, comments, saves from the right people.' },
  ads: { metric: 'Leads', target: 30, hint: 'Small budget, one creative, one audience. Watch cost per lead.' },
  other: { metric: 'Result', target: 1, hint: '' },
}

export interface DemandTest {
  id: string
  type: TestType
  name: string
  hypothesis: string
  metric: string
  target: number
  reached: number     // people exposed (visitors, sent, shown)
  result: number      // people who responded (sign-ups, deposits, calls)
  status: 'planned' | 'running' | 'done'
  verdict: '' | 'validated' | 'invalidated' | 'inconclusive'
  startedAt: string
  endedAt: string
  learning: string
  assumptionId: string
}

export interface ResearchData {
  tests: DemandTest[]
  interviewNotes: string
  insights: string
}

// ---------- Build & launch ----------
export interface ChecklistItem { id: string; text: string; done: boolean }
export type Engine = '' | 'sticky' | 'viral' | 'paid'
export type MetricKey = 'visitors' | 'signups' | 'activated' | 'paying' | 'revenue'
export const METRIC_LABEL: Record<MetricKey, string> = {
  visitors: 'Visitors',
  signups: 'Sign-ups',
  activated: 'Activated users',
  paying: 'Paying customers',
  revenue: 'Revenue',
}

export interface LaunchData {
  mvpScope: string
  notInScope: string
  launchDate: string
  url: string
  channels: { warm: boolean; cold: boolean; content: boolean; ads: boolean }
  channelNotes: string
  engine: Engine
  northStar: MetricKey
  weeklyTargets: { visitors: number; signups: number; paying: number; revenue: number }
  checklist: ChecklistItem[]
}

// ---------- Monitor ----------
export interface MetricEntry {
  id: string
  weekOf: string      // ISO date of the Monday
  visitors: number
  signups: number
  activated: number
  paying: number      // total paying customers at end of week
  newPaying: number   // new paying customers this week
  revenue: number
  churned: number
  spend: number       // marketing spend this week
  notes: string
}

// ---------- Decisions ----------
export type DecisionType = 'advance' | 'persevere' | 'pivot' | 'kill' | 'scale' | 'hold'
export interface DecisionLog {
  id: string
  date: string
  stage: Stage
  decision: DecisionType
  rationale: string
  pivotType: string
}

export interface Idea {
  id: string
  name: string
  oneLiner: string
  createdAt: string
  updatedAt: string
  stage: Stage
  outcome: Outcome
  plan: PlanData
  research: ResearchData
  launch: LaunchData
  metrics: MetricEntry[]
  decisions: DecisionLog[]
}

export interface Settings {
  currency: string
  gates: {
    marketMin: number        // avg of four market criteria, out of 5
    valueMin: number         // value score out of 10
    waitlistMin: number      // Priestley's "100 people"
    presaleMin: number
    landingConvMin: number   // % visitors -> sign-ups
    growthMin: number        // weekly growth % of north star
    payingConvMin: number    // % sign-ups -> paying
    ltvCacMin: number
    monitorWeeks: number     // weeks of data before a verdict
  }
}

export interface AppState {
  version: 1
  ideas: Idea[]
  settings: Settings
}

// ---------- Factories ----------
export const uid = (): string => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)
export const today = (): string => new Date().toISOString().slice(0, 10)

export function mondayOf(d: Date): string {
  const x = new Date(d)
  const day = (x.getDay() + 6) % 7
  x.setDate(x.getDate() - day)
  return x.toISOString().slice(0, 10)
}

export const DEFAULT_SETTINGS: Settings = {
  currency: '£',
  gates: {
    marketMin: 3.5,
    valueMin: 6,
    waitlistMin: 100,
    presaleMin: 10,
    landingConvMin: 2,
    growthMin: 5,
    payingConvMin: 2,
    ltvCacMin: 3,
    monitorWeeks: 4,
  },
}

export const DEFAULT_CHECKLIST = [
  'MVP does the one thing the offer promises',
  'Landing page states the promise, the price and the guarantee',
  'Analytics in place (visitors, sign-ups, activation, payment)',
  'Payment works end to end',
  'Waiting list / research contacts told the launch date',
  'Launch campaign scheduled across chosen channels',
  'Weekly metrics check-in booked in the calendar',
]

export function newPlan(): PlanData {
  return {
    avatar: '',
    dreamOutcome: '',
    market: { pain: 0, money: 0, targetable: 0, growing: 0 },
    fit: { passion: 0, skill: 0, unfair: 0 },
    problems: [],
    value: { dream: 0, likelihood: 0, time: 0, effort: 0 },
    offer: { name: '', core: '', bonuses: '', guarantee: '', scarcity: '', price: '' },
    valueHypothesis: '',
    growthHypothesis: '',
    assumptions: [],
  }
}

export function newLaunch(): LaunchData {
  return {
    mvpScope: '',
    notInScope: '',
    launchDate: '',
    url: '',
    channels: { warm: false, cold: false, content: false, ads: false },
    channelNotes: '',
    engine: '',
    northStar: 'signups',
    weeklyTargets: { visitors: 0, signups: 0, paying: 0, revenue: 0 },
    checklist: DEFAULT_CHECKLIST.map(text => ({ id: uid(), text, done: false })),
  }
}

export function newIdea(name: string, oneLiner = ''): Idea {
  const t = new Date().toISOString()
  return {
    id: uid(),
    name,
    oneLiner,
    createdAt: t,
    updatedAt: t,
    stage: 'plan',
    outcome: '',
    plan: newPlan(),
    research: { tests: [], interviewNotes: '', insights: '' },
    launch: newLaunch(),
    metrics: [],
    decisions: [],
  }
}

export function newTest(type: TestType): DemandTest {
  const h = TEST_TYPE_HINT[type]
  return {
    id: uid(),
    type,
    name: TEST_TYPE_LABEL[type],
    hypothesis: '',
    metric: h.metric,
    target: h.target,
    reached: 0,
    result: 0,
    status: 'planned',
    verdict: '',
    startedAt: '',
    endedAt: '',
    learning: '',
    assumptionId: '',
  }
}

export function newMetricEntry(weekOf: string): MetricEntry {
  return { id: uid(), weekOf, visitors: 0, signups: 0, activated: 0, paying: 0, newPaying: 0, revenue: 0, churned: 0, spend: 0, notes: '' }
}
