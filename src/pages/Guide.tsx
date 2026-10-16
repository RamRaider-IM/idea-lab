import { useStore } from '../store'

export default function Guide() {
  const { state } = useStore()
  const g = state.settings.gates
  return (
    <>
      <div className="page-head"><div><h1>Method guide</h1><p className="lede">How the dashboard turns three playbooks into one loop: Priestley for demand before product, Hormozi for the offer and the market, Ries for testing and the pivot-or-persevere call.</p></div></div>
      <div className="card prose">
        <h2>The loop</h2>
        <p>Every idea runs the same four phases and must pass a gate to leave each one. The gates are deliberately boring: they ask for evidence, not enthusiasm. An idea that cannot pass a gate either gets more work, a pivot, or a kill. Nothing sits in limbo.</p>
        <ol>
          <li><b>Plan</b> (a few hours): pick the person, map their problems, score the market, build the offer, write down what has to be true.</li>
          <li><b>Research</b> (one to three weeks): run cheap demand tests until people put their name or their money down.</li>
          <li><b>Build & launch</b> (one to four weeks): ship the smallest product that keeps the promise, to the people who already said yes.</li>
          <li><b>Monitor</b> (four or more weeks): log one row a week; let growth, conversion and unit economics make the call.</li>
          <li><b>Decide</b>: scale, persevere, pivot, hold or kill. Written down, with reasons.</li>
        </ol>

        <h2>Plan</h2>
        <h3>Starving crowd (Hormozi)</h3>
        <p>Four questions, scored 1 to 5: massive pain, purchasing power, easy to target, growing. The dashboard averages them. The gate is <b>{g.marketMin} or better</b>. Hormozi’s point is that market beats offer beats persuasion: a brilliant offer to the wrong crowd still starves.</p>
        <h3>Founder fit (Priestley)</h3>
        <p>Passion, skill and an unfair advantage. Not a gate, but low fit is a warning: you will be competing against someone who has all three.</p>
        <h3>Problems to solutions (Hormozi)</h3>
        <p>List every problem the avatar hits before, during and after getting the result. Each gets a solution and a delivery vehicle. This list is the raw material for the offer and its bonuses.</p>
        <h3>Value equation (Hormozi)</h3>
        <div className="formula">value = (dream outcome × perceived likelihood) ÷ (time delay × effort and sacrifice)</div>
        <p>Each input is scored 1 to 10. The ratio is mapped onto a 0 to 10 score on a log scale (ratio 1 scores 5, ratio 10 scores 7.5, ratio 100 scores 10). The gate is <b>{g.valueMin}</b>. Raise the top line with proof and vivid outcomes; shrink the bottom line with speed and doing the work for them.</p>
        <h3>Hypotheses and assumptions (Ries)</h3>
        <p>The value hypothesis (they want it enough to pay) and the growth hypothesis (how customers find it) are the two leaps of faith. Below them sit the riskiest assumptions, rated by how badly the idea dies if they are false. Research tests the risky ones first.</p>

        <h2>Research</h2>
        <p>Priestley’s rule: create the demand before you build the thing. Pitch the idea and count who signs up. His benchmark, roughly a hundred names, is the default waiting-list gate here. Money is a stronger signal than names, so a handful of pre-sales ({g.presaleMin} by default) also clears the gate, as does a landing page converting at {g.landingConvMin}% or better with real volume behind it.</p>
        <p>Hormozi’s core four, warm outreach, cold outreach, content and paid ads, are the channels for reaching people. His rule of a hundred: do a hundred of something before judging it. The dashboard tracks which channels you have tried so the launch plan is built on what worked.</p>
        <p>Every test links to an assumption and ends with a verdict: validated, invalidated or inconclusive. Marking a verdict updates the linked assumption. If a could-kill-it assumption is invalidated, the recommendation becomes a pivot before any building happens.</p>
        <div className="formula">demand score = verdict ratio (up to 6) + pre-sales (up to 4) + list size (up to 3) + landing conversion (1), capped at 10</div>

        <h2>Build & launch</h2>
        <p>The MVP (Ries) does the one thing the offer promises and nothing else. Writing down what is out of scope matters more than what is in. Pick the engine of growth you will tune: sticky (retention), viral (referral) or paid (CAC against LTV). Choose a north-star metric and the weekly target you would need to hit by week four, then launch to the people who already said yes.</p>

        <h2>Monitor</h2>
        <p>Innovation accounting (Ries): establish a baseline, tune the engine, then decide. One row a week, same day each week: visitors, sign-ups, activated users, new paying customers, total paying, churned, revenue and marketing spend.</p>
        <ul>
          <li><b>Weekly growth</b>: compound growth of the north star across the window. Bar: {g.growthMin}% a week.</li>
          <li><b>Sign-up to paying</b>: new paying customers divided by sign-ups over the window. Bar: {g.payingConvMin}%.</li>
          <li><b>CAC</b>: spend divided by new paying customers.</li>
          <li><b>LTV</b>: weekly revenue per paying customer divided by weekly churn. With no churn observed yet, a six-month life is assumed and marked as an estimate.</li>
          <li><b>LTV : CAC</b>: bar is {g.ltvCacMin}×, Hormozi’s threshold for an engine worth feeding.</li>
        </ul>
        <p>The funnel shows step-to-step conversion over the window. The weakest step is the next week’s work. Vanity metrics (cumulative anything, page views on their own) are not on the dashboard on purpose.</p>

        <h2>Decide</h2>
        <p>Ries insists the pivot-or-persevere meeting is scheduled, not triggered by panic. After {g.monitorWeeks} weeks of data the dashboard recommends one of:</p>
        <ul>
          <li><b>Scale</b>: growth, conversion and economics all clear their bars. Graduate the idea out of the lab and put real resource behind it.</li>
          <li><b>Persevere</b>: one of them clears. Something works; tune the rest.</li>
          <li><b>Pivot</b>: sign-ups but no payment (change the offer, not the audience), or traffic but no sign-ups (change the promise or the audience). The pivot sends the idea back to Plan with its assumptions reset to untested, and the type of pivot is recorded.</li>
          <li><b>Kill</b>: flat for a month with nothing to tune. Reinvest the time.</li>
        </ul>
        <p>The recommendation is advice, not a verdict. You record the decision and the reasoning, and the log keeps it.</p>

        <h2>Weekly rhythm</h2>
        <ol>
          <li>Open the portfolio. Work the “needs you this week” list top to bottom.</li>
          <li>Log last week’s row for every live app.</li>
          <li>Call any test that has run three weeks.</li>
          <li>Advance anything whose gate is green; record the reasoning.</li>
          <li>Pick one experiment per live app for the coming week and note it in the weekly log.</li>
        </ol>

        <h2>Sources</h2>
        <ul>
          <li>Daniel Priestley: <i>Oversubscribed</i>, <i>Key Person of Influence</i>, <i>24 Assets</i>.</li>
          <li>Alex Hormozi: <i>$100M Offers</i>, <i>$100M Leads</i>.</li>
          <li>Eric Ries: <i>The Lean Startup</i>.</li>
        </ul>
        <p>Thresholds live in <a href="#/settings">Settings</a>. Change them as you learn what your markets actually do.</p>
      </div>
    </>
  )
}
