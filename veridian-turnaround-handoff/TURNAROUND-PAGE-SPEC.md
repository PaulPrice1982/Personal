# Build spec: Revenue Turnaround and Recovery page

New service page for the Veridian Revenue Partners website. Follow the
codebase's existing patterns exactly; precedents are named throughout.
Change nothing else.

## Page settings

- URL: `/services/revenue-turnaround-and-recovery`
- Navigation label: `Revenue Turnaround and Recovery` (fourth service, after
  Contract monetisation, Outsourced revenue operations and Advisory)
- Meta title: `Revenue Turnaround and Recovery for Software Businesses | Veridian Revenue Partners`
- Meta description: `Behind plan? Veridian diagnoses the sales engine, quantifies the gap, recovers revenue you are already owed and leaves the business running a plan it can hit. UK and EU software, £5m to £500m ARR.`

## Critical integration rules

1. **The live site has operator-edited content.** A new page must arrive the
   way pages arrive in `src/store.js`: as a one-time delivery guarded by a
   `delivered` flag, inserted into the content on boot if not already
   delivered, with the nav and footer links added by the same guarded
   delivery. Never reseed or overwrite existing pages, nav items the operator
   renamed, or anything in `data/`. Precedent: how `page_contract_monetisation`
   and `page_advisory` are delivered, and the `three-services-v1` transform.
2. **Page copy in `src/copy.js`** as a new page object following the existing
   shape (sections built from the site's own block vocabulary: hero, columns,
   checklist, prose, cta and the diagram block). Use the copy below verbatim.
   No em dashes anywhere. UK English.
3. **The animated figure** is supplied alongside this spec as
   `plan-vs-engine-figure.html`. It sits under the hero, in the same slot and
   style as the Contracted-versus-Billed figure on the Contract monetisation
   page. The site has a moving-diagram mechanism (see the diagram block
   renderer and its existing kinds); add a new diagram kind for this page
   using the supplied SVG and its embedded CSS exactly as given. It is
   CSS-only animation and already respects reduced motion. Caption:
   `Plan versus engine: four gaps closed, and kept closed.`
4. **The banner photograph** is supplied at the download URL given in the
   task (1920px wide JPEG). Save it and deliver it through the seed-media
   mechanism in `src/images.js` (`SEED_MEDIA` + `ensureSeedMedia`, per-image
   `seedmedia:` delivered flags): place the file in `seed-media/` as
   `banner-turnaround.jpg`, add a manifest entry with id `banner-turnaround`,
   page `revenue-turnaround-and-recovery`, alt text
   `A sales leader at the window at dusk, the city beyond, the forecast on the screen behind him.`
   The mechanism must not overwrite a banner the operator later assigns, and
   a deleted image must stay deleted, exactly like the existing eleven.
5. **Home page symptom card.** Add a seventh problem card to the home page's
   existing problem-card section: title `Behind plan and nobody can say why`,
   linking to this page. Deliver it with the same guarded one-time pattern
   (only add if the operator has not removed or rewritten that section).
6. **Self-test.** Extend `scripts/selftest.js` with checks for this page the
   way existing pages are checked: page published and rendering, nav entry
   present, banner delivered and protected, diagram kind rendering. Run the
   whole suite and make it pass before finishing. Do not weaken or remove
   existing checks.
7. **Proof figures must match the Track record page.** The figures below
   already do; do not change either.
8. Do not touch: the admin, the booking agent, voice features, HubSpot
   integration, any secrets, `data/`, or any other page's copy.

## Page copy (verbatim)

### 1. Hero
- Kicker: REVENUE TURNAROUND AND RECOVERY
- Headline (H1): Your revenue plan is behind. The engine underneath it is why.
- Sub-headline: We go into software businesses that are off plan, find out why the sales engine cannot carry the number, fix what is broken with the team that is already there, and recover the revenue the business is already owed. Twelve weeks to interventions that are live and owned. Every quarter after that, evidence of what moved.
- Primary CTA: Start a conversation (links to Contact)
- Secondary CTA: Take the 3-minute revenue leakage check (links to the leakage check)

### 2. Proof strip
- £1.2m to £26.9m | expansion revenue built at The Access Group, nine years above plan
- 120% / 90% | net and gross revenue retention across c.£375m of ARR
- 20 | operating companies where off-plan sales teams were put back on a plan they could hit
- +7% | contract book across acquired businesses, no new product, no new logos

### 3. Start from the symptom
Intro: If two of these are true, the plan is at risk and the cause is in the engine, not the market.
- Sellers carrying quotas they will never hit: A third of the team is below half of target and the plan still assumes everyone lands.
- Coverage looks fine, conversion says otherwise: Pipeline is three times the number and the number is still missed, quarter after quarter.
- The forecast moves every week: Nobody measures how far off it was last time, so nobody learns, so it moves again.
- Renewals run as service, not revenue: Churn is explained after the fact. Uplift, term and notice periods are levers nobody pulls.
- Customers use more than they pay for: More users, sites, entities and storage than the contract covers, and no one is billing it.
- The last review is still a deck: Findings with no owner, no deadline and no number against them. Nothing changed.

### 4. What you get
Intro: Not a report. A business that is running differently by week twelve, with the evidence to prove it.
- Week 1: The plan tested against the engine. We take the plan you are running to, the one the board or the sponsor signed off, and test each line of growth against the sales capacity, conversion, retention and contracts that actually exist. You find out where the plan is supported, where it is at risk and where there is value nobody counted.
- Weeks 2 to 5: The gap, quantified. Every part of the revenue engine, from targeting to referral, is assessed for whether it works, not whether it exists. The gap between plan and engine is put in pounds. Priorities are agreed with the CEO and CRO, with quick wins separated from the longer work.
- Weeks 6 to 12: Interventions live, owned by your people. Each fix has a named owner, a baseline, a target and a review date. The cadences that keep it honest start running: a weekly look at pipeline health, a weekly look at what will close, a monthly look at whether the fixes are working. The tools stay in the business.
- Every quarter: Evidence, not activity. The board sees what was started and what was created: revenue generated, revenue protected, profit impact, and which interventions failed. Successes and failures by name.

### 5. Where the money usually is
Intro: Most reviews look at one of these. We look at all four, because the plan depends on all four.
- Capacity: The plan assumes a sales team that does not exist. We rebuild the capacity model from how the team actually converts, ramps and churns, so the number is one the team can carry.
- Pipeline and forecast: Stalled and dead deals are removed before anyone trusts the pipeline. The forecast is triangulated from three independent views and then measured for accuracy and bias, by seller and by manager.
- Retention and the long tail: Renewals get the same discipline as new business: a renewal bridge, a health score that predicts churn, and uplift, term and notice levers used on purpose. The long tail of small customers is usually where the cheapest profit is hiding.
- Revenue you are already owed: Users, entities, sites, storage and indexation the customer is consuming but not paying for. This is recovery, not expansion: it is billed now, not sold later, and the conversation that recovers it also moves customers onto longer terms and current pricing.

### 6. What this is not
- Not a restructure. Most turnarounds change the people. We change what the people do, and most teams get better fast when the process, the cadence and the accountability are right.
- Not a questionnaire. A CRM, a QBR or a sales methodology can exist and change nothing. We score whether each one changes conversion, retention and pounds, and we treat a capability that changes nothing as if it were missing.
- Not a deck. A finding without a tool, an owner and a review date is advice. Every finding here becomes a record with all three, and the board sees whether it worked.

### 7. Who this is for
- CEOs and CROs: whose number is behind and who want the cause found and fixed with the team they have, not a year lost to a rebuild.
- Private equity operating partners: with a portfolio company whose revenue plan is at risk and who want quarterly evidence of value created, not initiative reports.
- Boards and chairs: who want an independent view of whether the engine can deliver the plan before the next forecast slips.

### 8. Built it, ran it, left the tools behind
Veridian was founded by Paul Price after ten years at The Access Group, a UK software group with around £1.6bn of ARR and twenty operating companies. As VP Revenue Excellence, reporting to the CRO, he was parachuted into the operating companies that were off plan to diagnose why, install the process and cadence that fixed it, and coach the sales leadership until it stuck. Before that he founded and built the group's expansion and contracts function from one person to forty-five, growing its order book from £1.2m to £26.9m, and designed the retention programme that ran at 120% net and 90% gross retention across c.£375m of ARR. Former board members of the group will vouch for the work.

### 9. How we engage
- Twelve-week turnaround: Fixed scope, fixed fee. Plan tested, engine diagnosed, gap quantified, interventions live and owned by week twelve.
- Run the cadence: A monthly retainer to run the weekly and monthly revenue cadences with your leadership team until the behaviour is embedded.
- Recovery on results: For revenue the business is already owed, we can work on a share of what is recovered rather than a fee.

### 10. Questions we get asked
- How quickly will we see something move? Quick wins are live inside thirty days. Recovered revenue is usually invoiced inside a quarter. Pipeline and forecast behaviour changes in the first month; the retention effect takes two to three quarters to show in the numbers, which is why we report every quarter.
- Do we have to replace people? Rarely. The usual finding is that capable people are running a process that cannot produce the number. When the process, cadence and accountability change, most of the team gets better quickly. Where someone cannot or will not change, you will know early and with evidence.
- What do you need from us? Access to the CRM, the financials, the contracts and the people, and two hours a week from the CEO and the CRO. The first week is mostly a data request and interviews; the diagnostic is scored on evidence and real calls, not on opinion.
- Does this work for a founder-led business? Yes. The questions are the same at £5m and £500m. What changes is the weight: a founder-led business gets one weekly commercial cadence and a handful of tools, not a governance layer.
- How is this different from your Contract Monetisation service? Contract Monetisation recovers revenue from entitlement and usage that is not being billed, as a standalone programme. Turnaround and Recovery starts from a plan that is behind and fixes the whole engine; recovery is one of the four places we look. If the only problem is unbilled usage, Contract Monetisation is the right door.

### 11. Closing call to action
- Headline: One company. Twelve weeks. Judged on what moves.
- Body: If the plan is behind and nobody can say exactly why, that is the conversation. Bring the plan and the last two forecasts; we will tell you where the engine can and cannot carry it, and what we would do about it.
- CTA: Start a conversation (links to Contact)

## Acceptance checklist

- [ ] Page live at /services/revenue-turnaround-and-recovery with all 11 sections in order
- [ ] Fourth item in the Services nav and footer Services column
- [ ] Banner photograph delivered and rendering under the overlay header
- [ ] Plan-versus-engine figure animating under the hero (static under reduced motion)
- [ ] Seventh symptom card on the home page linking to the new page
- [ ] Full self-test suite green, with new checks added
- [ ] No changes outside the files this spec names
