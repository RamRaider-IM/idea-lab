import { newIdea, newTest, newMetricEntry, uid, mondayOf, type Idea, type AppState, DEFAULT_SETTINGS } from './types'

function weeksAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n * 7)
  return mondayOf(d)
}

export function exampleState(): AppState {
  // 1. An idea being monitored after launch
  const a: Idea = newIdea('Invoice Nudge', 'Automatic, polite payment chasers for freelancers who hate asking for money.')
  a.stage = 'monitor'
  a.plan = {
    ...a.plan,
    avatar: 'UK freelance designers and developers, 1-3 years in, invoicing £3-10k a month, chasing late payers by hand.',
    dreamOutcome: 'Get paid on time without ever writing an awkward chaser email again.',
    market: { pain: 4, money: 4, targetable: 5, growing: 4 },
    fit: { passion: 4, skill: 5, unfair: 3 },
    problems: [
      { id: uid(), problem: 'Forgets which invoices are overdue', solution: 'Syncs with Stripe/Xero and flags overdue automatically', vehicle: 'Software' },
      { id: uid(), problem: 'Hates the tone of chasing', solution: 'Pre-written escalating sequence that sounds human', vehicle: 'Software + templates' },
      { id: uid(), problem: 'Clients claim they never saw the invoice', solution: 'Open and click tracking with a timeline per invoice', vehicle: 'Software' },
    ],
    value: { dream: 7, likelihood: 8, time: 3, effort: 2 },
    offer: { name: 'Invoice Nudge Pro', core: 'Automated chaser sequences for every overdue invoice, synced from your accounting tool.', bonuses: 'Late-fee clause pack, client payment-terms template', guarantee: 'Get paid faster in 60 days or the next 3 months are free', scarcity: 'Founding price for the first 50 accounts', price: '£12 / month' },
    valueHypothesis: 'Freelancers will pay £12/month to never chase an invoice manually again.',
    growthHypothesis: 'Freelancers talk to each other in communities; a referral credit drives most sign-ups.',
    assumptions: [
      { id: uid(), text: 'Freelancers feel chasing is painful enough to pay for', kind: 'value', risk: 3, status: 'validated' },
      { id: uid(), text: 'They will connect their accounting tool to a new app', kind: 'value', risk: 2, status: 'validated' },
      { id: uid(), text: 'Referrals from communities drive sign-ups', kind: 'growth', risk: 3, status: 'untested' },
    ],
  }
  const t1 = newTest('waitlist'); t1.status = 'done'; t1.verdict = 'validated'; t1.reached = 2400; t1.result = 164; t1.startedAt = weeksAgo(14); t1.endedAt = weeksAgo(11); t1.hypothesis = 'A post in three freelancer communities gets 100 names in two weeks.'; t1.learning = '164 names. The line that landed was "never write a chaser email again".'
  const t2 = newTest('presale'); t2.status = 'done'; t2.verdict = 'validated'; t2.reached = 164; t2.result = 14; t2.startedAt = weeksAgo(11); t2.endedAt = weeksAgo(9); t2.hypothesis = '10 of the list will pay £60 up front for a founding year.'; t2.learning = '14 paid. Two asked for Xero support before Stripe.'
  const t3 = newTest('interviews'); t3.status = 'done'; t3.verdict = 'validated'; t3.reached = 20; t3.result = 12; t3.startedAt = weeksAgo(12); t3.endedAt = weeksAgo(10); t3.learning = 'Everyone has a horror story. Half already use a spreadsheet to track chasers.'
  a.research = { tests: [t1, t2, t3], interviewNotes: '12 interviews. Pattern: the pain peaks at day 7 overdue. Nobody wanted automatic late fees, everyone wanted automatic reminders.', insights: 'Lead with the emotional cost of chasing, not the cash-flow maths.' }
  a.launch = {
    ...a.launch,
    mvpScope: 'Stripe sync, three-step chaser sequence, one dashboard of overdue invoices.',
    notInScope: 'Xero/QuickBooks sync, custom sequences, team accounts.',
    launchDate: weeksAgo(6), url: 'https://invoicenudge.example', channels: { warm: true, cold: false, content: true, ads: false },
    channelNotes: 'Launch post in the three communities; email to the 164 names.', engine: 'viral', northStar: 'paying',
    weeklyTargets: { visitors: 300, signups: 25, paying: 6, revenue: 150 },
    checklist: a.launch.checklist.map(c => ({ ...c, done: true })),
  }
  const rows = [
    [410, 38, 24, 14, 14, 168, 0, 0],
    [260, 22, 15, 20, 6, 240, 0, 0],
    [230, 19, 12, 25, 5, 300, 0, 40],
    [290, 27, 18, 31, 7, 372, 1, 40],
    [340, 31, 22, 38, 8, 456, 1, 60],
    [380, 36, 26, 46, 9, 552, 1, 60],
  ]
  a.metrics = rows.map((r, i) => ({ ...newMetricEntry(weeksAgo(5 - i)), visitors: r[0], signups: r[1], activated: r[2], paying: r[3], newPaying: r[4], revenue: r[5], churned: r[6], spend: r[7] }))
  a.decisions = [
    { id: uid(), date: weeksAgo(11), stage: 'plan', decision: 'advance', rationale: 'Market and value scores clear the bar; two risky assumptions to test.', pivotType: '' },
    { id: uid(), date: weeksAgo(8), stage: 'research', decision: 'advance', rationale: '14 pre-sales from 164 names. Building the Stripe-only MVP.', pivotType: '' },
    { id: uid(), date: weeksAgo(6), stage: 'build', decision: 'advance', rationale: 'Launched to the list.', pivotType: '' },
  ]

  // 2. An idea in research
  const b: Idea = newIdea('Kit Checker', 'Pre-match kit and safeguarding checklists for grassroots football coaches.')
  b.stage = 'research'
  b.plan = {
    ...b.plan,
    avatar: 'Volunteer coaches of under-12 teams in England, running one or two squads, organising via WhatsApp.',
    dreamOutcome: 'Turn up on Sunday knowing nothing has been forgotten and every safeguarding box is ticked.',
    market: { pain: 3, money: 2, targetable: 4, growing: 3 },
    fit: { passion: 5, skill: 4, unfair: 4 },
    problems: [
      { id: uid(), problem: 'Forgets the first-aid kit or match cards', solution: 'Saturday-night checklist push', vehicle: 'App' },
      { id: uid(), problem: 'Safeguarding paperwork scattered', solution: 'One place with expiry reminders', vehicle: 'App' },
      { id: uid(), problem: 'Parents ask the same questions', solution: 'Shareable match-day card', vehicle: 'App + link' },
    ],
    value: { dream: 5, likelihood: 7, time: 2, effort: 2 },
    offer: { name: 'Kit Checker', core: 'A match-day checklist and safeguarding folder for your team.', bonuses: '', guarantee: '', scarcity: '', price: '£3 / month per team' },
    valueHypothesis: 'Volunteer coaches will pay a small monthly fee for peace of mind on match day.',
    growthHypothesis: 'Clubs adopt it club-wide once two coaches use it.',
    assumptions: [
      { id: uid(), text: 'Volunteers will pay anything at all', kind: 'value', risk: 3, status: 'untested' },
      { id: uid(), text: 'The club secretary is the real buyer', kind: 'growth', risk: 2, status: 'untested' },
    ],
  }
  const b1 = newTest('landing'); b1.status = 'running'; b1.reached = 640; b1.result = 11; b1.startedAt = weeksAgo(2); b1.hypothesis = '2% of coaches who see the page leave an email.'
  const b2 = newTest('interviews'); b2.status = 'done'; b2.verdict = 'inconclusive'; b2.reached = 8; b2.result = 6; b2.learning = 'Everyone likes it. Nobody has paid for a coaching tool before.'
  const b3 = newTest('presale'); b3.status = 'planned'; b3.hypothesis = '5 coaches pay £20 for a season up front.'
  b.research = { tests: [b1, b2, b3], interviewNotes: '', insights: '' }
  b.decisions = [{ id: uid(), date: weeksAgo(3), stage: 'plan', decision: 'advance', rationale: 'Low purchasing power is the worry. Pre-sale will settle it.', pivotType: '' }]

  // 3. An idea just started
  const c: Idea = newIdea('Allotment Planner', 'Sowing calendar and bed planner for first-year allotment holders.')
  c.plan.avatar = 'People who just got an allotment after a long waiting list and have no idea what to plant when.'
  c.plan.market = { pain: 3, money: 3, targetable: 4, growing: 3 }

  return { version: 1, ideas: [a, b, c], settings: DEFAULT_SETTINGS, tombstones: {}, updatedAt: new Date().toISOString() }
}
