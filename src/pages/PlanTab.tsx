import { useStore, useIdeaUpdater } from '../store'
import { Card, Field, TextInput, TextArea, RatingRow, Chip, Segmented, PillSelect } from '../components/ui'
import { marketScore, fitScore, valueRatio, valueScore } from '../scoring'
import { uid, type Idea, type PlanData, type Problem, type Assumption } from '../types'

export default function PlanTab({ idea }: { idea: Idea }) {
  const { state } = useStore()
  const g = state.settings.gates
  const update = useIdeaUpdater(idea.id)
  const p = idea.plan
  const set = (patch: Partial<PlanData>) => update(i => ({ plan: { ...i.plan, ...patch } }))
  const setMarket = (k: keyof PlanData['market'], v: number) => update(i => ({ plan: { ...i.plan, market: { ...i.plan.market, [k]: v } } }))
  const setFit = (k: keyof PlanData['fit'], v: number) => update(i => ({ plan: { ...i.plan, fit: { ...i.plan.fit, [k]: v } } }))
  const setValue = (k: keyof PlanData['value'], v: number) => update(i => ({ plan: { ...i.plan, value: { ...i.plan.value, [k]: v } } }))
  const setOffer = (k: keyof PlanData['offer'], v: string) => update(i => ({ plan: { ...i.plan, offer: { ...i.plan.offer, [k]: v } } }))
  const setProblem = (id: string, patch: Partial<Problem>) => update(i => ({ plan: { ...i.plan, problems: i.plan.problems.map(x => (x.id === id ? { ...x, ...patch } : x)) } }))
  const setAssumption = (id: string, patch: Partial<Assumption>) => update(i => ({ plan: { ...i.plan, assumptions: i.plan.assumptions.map(x => (x.id === id ? { ...x, ...patch } : x)) } }))

  const ms = marketScore(p), fs = fitScore(p), vr = valueRatio(p), vs = valueScore(p)
  const tone = (v: number | null, good: number) => (v === null ? '' : v >= good ? 'good' : v >= good * 0.7 ? 'warn' : 'bad')

  return (
    <div className="stack">
      <Card title="1 · Who, and what do they want" why="Hormozi: pick the person before the product. Priestley: be specific enough that they feel seen.">
        <div className="grid2">
          <Field label="Avatar" help="one specific person"><TextArea value={p.avatar} onChange={v => set({ avatar: v })} placeholder="UK freelance designers, 1-3 years in, invoicing £3-10k a month, chasing late payers by hand" /></Field>
          <Field label="Dream outcome" help="in their words"><TextArea value={p.dreamOutcome} onChange={v => set({ dreamOutcome: v })} placeholder="Get paid on time without ever writing an awkward chaser email again" /></Field>
        </div>
      </Card>

      <div className="grid2">
        <Card title="2 · Is this a starving crowd?" hint="Hormozi’s four market tests" right={<Chip tone={tone(ms, g.marketMin)}>{ms === null ? 'unscored' : `${ms.toFixed(1)} / 5`}</Chip>}>
          <RatingRow q="Massive pain" d="Do they feel it weekly, and does it cost them money, time or status?" value={p.market.pain} onChange={v => setMarket('pain', v)} />
          <RatingRow q="Purchasing power" d="Can they pay, and are they used to paying for solutions?" value={p.market.money} onChange={v => setMarket('money', v)} />
          <RatingRow q="Easy to target" d="Do they gather somewhere you can reach: a community, a list, a platform?" value={p.market.targetable} onChange={v => setMarket('targetable', v)} />
          <RatingRow q="Growing" d="More of them every year, not fewer?" value={p.market.growing} onChange={v => setMarket('growing', v)} />
          <p className="tiny muted mt8">Gate: average of {g.marketMin} or better. A great offer to a dying, broke or unreachable market still fails.</p>
        </Card>
        <Card title="3 · Is this your sweet spot?" hint="Priestley’s founder fit" right={<Chip tone={tone(fs, 3.5)}>{fs === null ? 'unscored' : `${fs.toFixed(1)} / 5`}</Chip>}>
          <RatingRow q="Passion" d="Will you still care about this problem in year three?" value={p.fit.passion} onChange={v => setFit('passion', v)} />
          <RatingRow q="Skill" d="Can you build and sell it with what you already know?" value={p.fit.skill} onChange={v => setFit('skill', v)} />
          <RatingRow q="Unfair advantage" d="Audience, access, data, reputation or timing others lack" value={p.fit.unfair} onChange={v => setFit('unfair', v)} />
          <p className="tiny muted mt8">Not a gate, but a tiebreaker. Low fit means a slower, lonelier build.</p>
        </Card>
      </div>

      <Card title="4 · Problems → solutions" why="Hormozi: list every problem the avatar hits before, during and after getting the result. Each one becomes part of the offer." right={<button type="button" className="btn sm" onClick={() => set({ problems: [...p.problems, { id: uid(), problem: '', solution: '', vehicle: '' }] })}>+ Problem</button>}>
        {p.problems.length === 0 ? <p className="small muted">No problems listed. Aim for at least five, then keep the three that matter most.</p> : (
          <table className="tbl">
            <thead><tr><th style={{ width: '35%' }}>Problem</th><th style={{ width: '35%' }}>Solution</th><th>Delivery vehicle</th><th /></tr></thead>
            <tbody>
              {p.problems.map(x => (
                <tr key={x.id}>
                  <td><input type="text" value={x.problem} placeholder="They forget which invoices are overdue" onChange={e => setProblem(x.id, { problem: e.target.value })} /></td>
                  <td><input type="text" value={x.solution} placeholder="Sync with Stripe and flag automatically" onChange={e => setProblem(x.id, { solution: e.target.value })} /></td>
                  <td><input type="text" value={x.vehicle} placeholder="Software, template, 1:1, group, done-for-you" onChange={e => setProblem(x.id, { vehicle: e.target.value })} /></td>
                  <td className="right"><button type="button" className="btn ghost sm danger" onClick={() => set({ problems: p.problems.filter(y => y.id !== x.id) })}>×</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Card title="5 · Value equation" hint="Hormozi" right={<Chip tone={tone(vs, g.valueMin)}>{vs === null ? 'unscored' : `${vs.toFixed(1)} / 10`}</Chip>}>
        <div className="grid2" style={{ columnGap: 32 }}>
          <div>
            <div className="tiny muted" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>Top line: bigger is better</div>
            <RatingRow max={10} q="Dream outcome" d="How badly do they want this?" value={p.value.dream} onChange={v => setValue('dream', v)} />
            <RatingRow max={10} q="Perceived likelihood" d="How sure are they it will work for them?" value={p.value.likelihood} onChange={v => setValue('likelihood', v)} />
          </div>
          <div>
            <div className="tiny muted" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>Bottom line: smaller is better</div>
            <RatingRow max={10} q="Time delay" d="How long until they see the result?" value={p.value.time} onChange={v => setValue('time', v)} />
            <RatingRow max={10} q="Effort and sacrifice" d="How much do they have to change or give up?" value={p.value.effort} onChange={v => setValue('effort', v)} />
          </div>
        </div>
        <div className="row wrap mt12 small ink2">
          <span className="mono">(dream × likelihood) ÷ (time × effort)</span>
          <span>=</span>
          <b>{vr === null ? '–' : vr.toFixed(2)}</b>
          <span className="muted">· 1.0 is break-even, 10 is strong, 25+ is a no-brainer. Gate: score {g.valueMin}+.</span>
        </div>
        <p className="tiny muted mt8">To raise the score: make the outcome more vivid, add proof and guarantees, deliver a quick win early, do the work for them.</p>
      </Card>

      <Card title="6 · The offer" why="Hormozi’s grand slam offer: core promise, stacked bonuses, a guarantee that reverses the risk, and a reason to act now.">
        <div className="grid2">
          <Field label="Offer name" help="MAGIC: magnet, avatar, goal, interval, container"><TextInput value={p.offer.name} onChange={v => setOffer('name', v)} placeholder="The 60-day Get Paid On Time system for freelancers" /></Field>
          <Field label="Price to test"><TextInput value={p.offer.price} onChange={v => setOffer('price', v)} placeholder="£12 / month, or £60 founding year" /></Field>
        </div>
        <div className="grid2 mt12">
          <Field label="Core offer" help="what they get"><TextArea value={p.offer.core} onChange={v => setOffer('core', v)} placeholder="Automated chaser sequences for every overdue invoice, synced from your accounting tool" /></Field>
          <Field label="Bonuses" help="solve the adjacent problems"><TextArea value={p.offer.bonuses} onChange={v => setOffer('bonuses', v)} placeholder="Late-fee clause pack, payment-terms template" /></Field>
          <Field label="Guarantee" help="who carries the risk?"><TextArea value={p.offer.guarantee} onChange={v => setOffer('guarantee', v)} placeholder="Get paid faster in 60 days or the next 3 months are free" /></Field>
          <Field label="Scarcity and urgency" help="honest reasons to act now"><TextArea value={p.offer.scarcity} onChange={v => setOffer('scarcity', v)} placeholder="Founding price for the first 50 accounts, closes on launch day" /></Field>
        </div>
      </Card>

      <Card title="7 · Leap-of-faith hypotheses" why="Lean Startup: the two assumptions everything rests on. Write them so they can be proven wrong.">
        <div className="grid2">
          <Field label="Value hypothesis" help="they want it enough to pay"><TextArea value={p.valueHypothesis} onChange={v => set({ valueHypothesis: v })} placeholder="Freelancers will pay £12 a month to never chase an invoice by hand again" /></Field>
          <Field label="Growth hypothesis" help="how new customers find it"><TextArea value={p.growthHypothesis} onChange={v => set({ growthHypothesis: v })} placeholder="Freelancers talk in communities; a referral credit drives most sign-ups" /></Field>
        </div>
      </Card>

      <Card title="8 · Riskiest assumptions" why="If this were false, would the idea die? Test those first, in Research." right={<button type="button" className="btn sm" onClick={() => set({ assumptions: [...p.assumptions, { id: uid(), text: '', kind: 'value', risk: 2, status: 'untested' }] })}>+ Assumption</button>}>
        {p.assumptions.length === 0 ? <p className="small muted">None yet. Start with: “people feel this pain enough to pay”, “I can reach them cheaply”, “they will switch from what they do now”.</p> : (
          <div className="stack tight">
            {p.assumptions.map(a => (
              <div key={a.id} className="item">
                <div className="row wrap">
                  <input type="text" className="flex1" value={a.text} placeholder="Freelancers feel chasing is painful enough to pay for" onChange={e => setAssumption(a.id, { text: e.target.value })} style={{ minWidth: 220 }} />
                  <Segmented options={[{ value: 'value', label: 'Value' }, { value: 'growth', label: 'Growth' }]} value={a.kind} onChange={v => setAssumption(a.id, { kind: v })} />
                  <PillSelect options={[{ value: '1', label: 'Low risk' }, { value: '2', label: 'Medium' }, { value: '3', label: 'Could kill it' }]} value={String(a.risk) as '1' | '2' | '3'} onChange={v => setAssumption(a.id, { risk: Number(v) as 1 | 2 | 3 })} />
                  <Segmented options={[{ value: 'untested', label: 'Untested' }, { value: 'validated', label: 'Validated' }, { value: 'invalidated', label: 'Invalidated' }]} value={a.status} onChange={v => setAssumption(a.id, { status: v })} />
                  <button type="button" className="btn ghost sm danger" onClick={() => set({ assumptions: p.assumptions.filter(y => y.id !== a.id) })}>×</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
