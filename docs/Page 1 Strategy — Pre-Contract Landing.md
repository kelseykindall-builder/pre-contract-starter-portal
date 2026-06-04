# Page 1 Strategy — Pre-Contract Landing

**Owner:** Kelsey Kindall
**Status:** Active build
**Last updated:** 2026-05-26

---

## What this page is for

This is the first thing a prospective starter sees after clicking the outreach email. They've shown interest — they haven't committed. The page's job is to close the gap between "curious" and "I'm signing."

It does that through three levers:
1. **Legitimacy** — This is a real program with real pay. Not vague. Not a scam.
2. **Differentiation** — This is structurally different from a brand deal. The creator keeps their voice, picks their topic, earns on performance past the advance.
3. **Low friction** — The ask is clear (sign a contract), the timeline is short (2 weeks to live), and there's an offramp (book a call with Kelsey) for anyone who needs more reassurance before signing.

---

## Audience

- Influencer or creator who received the Starter Economy outreach email
- Has clicked through — so they've cleared the curiosity bar
- Hasn't signed a contract yet — so they're still evaluating
- Doesn't know their specific advance amount yet (tier confirmed in contract negotiation, not before)

**What they're probably wondering:**
- How much do I actually get paid?
- What do I have to deliver?
- Will this hurt my credibility or make me look like a sellout?
- What happens if my petition flops?
- Who's on the other side of this? Can I trust them?

---

## Funnel position

```
Outreach email → [this page] → Contract signed → Petition creation → Share units
```

This is Page 1 of 3 in the Starter Portal v4 split. Pages 2 and 3 (petition creation, share units) address post-contract moments and are TBD.

---

## Constraint: advance-agnostic

The advance amount is finalized during contract negotiation — so this page cannot state a specific dollar amount for a given starter. It can show the tier structure (100K–249K followers = $300, 250K–999K = $1,000, 1M+ = $5,000) and let the starter self-identify, but it never names "your advance is X."

The tier calculator widget resolves this: enter your follower count, see your advance band. Self-serve without making a specific promise.

---

## Section-by-section rationale

### Sticky header
CTA always visible: "Sign your contract." Removes the need to scroll back to act. The header is intentionally minimal — no navigation to distract.

### Hero
**"Get paid to spotlight what you care about."**

Leads with the creator's perspective, not ours. The subhead ("Your voice. Your topic. Your audience. Not a typical brand deal.") pre-empts the most common objection before the page even makes its case.

Two CTAs at the bottom: primary yellow "Sign your contract" + ghost "Book a call with Kelsey first." The second CTA is important — some creators need a human conversation before committing, and blocking that path would lose them.

### "Here's the deal" deliverables grid
Four cells: advance payment, 1 petition, 3 share units, 2-week timeline. Scannable. Answers the "what do I actually have to do?" question immediately, before they've read anything else. The advance cell is dark/featured and links down to the tier calculator.

### Advance calculator (tier lookup)
Placed immediately after the deliverables grid — because that's when the "how much?" question is live. Enter total followers, get your tier band + guaranteed advance.

Below-minimum state: shows a note that we typically partner with creators 100K+, but directs them to reach out anyway. Keeps the door open without over-promising.

The advance value feeds forward into the earnings calculator so the full estimated earnings number includes both components.

### Video
Kelsey's 3-minute walk-through. Covers the four questions every creator actually asks. For creators who don't want to read — this is the page.

The "TL;DR" block below the video frame gives the key summary for people who won't press play. The question grid signals what the video answers, functioning as a chapter guide.

### Share unit explainer
"One original post pointing your audience to your petition." With visual mockups of what real posts look like — a primary Reel, plus two secondary Stories.

This section exists because "share unit" is jargon. Creators need to see it before they believe it's as easy as we're saying. The mockups are concrete, platform-realistic, and show a range of topics (AI regulations, ALS, environmental) to signal that petitions don't have to be about one thing.

Callout below the visual: "3 is the floor — not the ceiling." Reframes the deliverable as a minimum, not a cap. More posts = more signatures = more promotions revenue.

### "Why this isn't a brand deal" — 4 differentiators
Four cards answering the four things that make creators nervous about sponsored content:

1. **Your voice, all the way through** — You pick the topic, you write it, you post in your style.
2. **Guaranteed payment, no signature target** — You keep the advance no matter how the petition performs.
3. **No earnings ceiling** — 95% of promotions revenue after recoup. There's upside.
4. **The chance to keep going** — Top performers can start a second petition. Reframes this as a relationship, not a one-off transaction.

### Earnings calculator
Slider from 1K to 200K+ signatures. Shows total estimated earnings = advance (if entered above) + promotions revenue at $0.30–$0.50/signature.

The range display ($X–$Y) is intentional — we don't want to overpromise with a single number. The note under the earnings figure updates based on whether the advance has been calculated yet.

### How it works — 3 steps
Step 01: Sign. Step 02: Launch. Step 03: Share, get paid. Removes procedural anxiety. Each step includes the honest timeline and payment trigger, so there are no surprises post-signature.

### Footer CTA
Dark panel. Two actions: "Send me the contract" (mailto that pre-fills subject/body) + "Book a 30-min call first." Repeats the dual-path pattern from the hero — commit now, or get a human if you need one.

---

## Design system notes

Carries forward from v3:
- **Sunrise tokens** — colors, radius, shadow, stroke
- **Commissioner** — only font used
- **Red as punctuation** — eyebrow labels, brand accents. Not dominant.
- **Yellow CTA** — `--fill-interactive: #FFDB00`. Primary action button throughout.
- **Tokenized URL** — `?starter=<token>` pattern ready for personalization hookup

---

## What's not on this page (intentional)

- **Specific advance dollar amount** — advance-agnostic constraint. Tier calculator covers it.
- **The petition creation flow** — that's Page 2. This page's only job is the sign decision.
- **Share unit submission** — that's Page 3.
- **Social proof / testimonials** — not yet built. Would go between the differentiators and earnings calculator if added.
- **FAQ** — deliberately avoided. The video + differentiator cards + how-it-works steps are designed to pre-answer the questions an FAQ would hold.

---

## Open items

- [ ] Swap video placeholder for real Kelsey recording when ready
- [ ] Wire `?starter=<token>` URL param to personalize the featured advance cell with the confirmed tier once contract is sent
- [ ] Add social proof section (starter testimonials or petition wins) — between differentiators and earnings calculator
- [ ] Confirm proof-point stats before launch (the proof cards section was removed in current build — re-add when data is confirmed)
- [ ] DocuSign link in footer CTA — currently a mailto. Replace with direct DocuSign envelope URL once contract template is standardized
