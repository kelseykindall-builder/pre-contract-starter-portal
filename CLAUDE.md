# pre-contract-landing-page

A landing page for influencers who've received outreach but haven't yet signed a contract — job is to motivate them to sign.

## Status

- **Created:** 2026-05-26
- **Phase:** Build (Page 1 active — `1-pre-contract.html`)
- **Definition of done:** Pre-contract page live, personalized by tier, with video + earnings calculator + contract CTA

## Stack

HTML/CSS/JS — single file, no build step. Deployed to Vercel + GitHub.

## Folder structure

```
projects/pre-contract-landing-page/
├── CLAUDE.md               ← this file (project context, ≤200 lines)
├── README.md               ← how to run this prototype
├── 1-pre-contract.html     ← Page 1: pre-contract landing (active build)
├── docs/                   ← sprint plan, research, notes
├── mood-board/             ← visual references
├── riff/                   ← design exploration boards
├── deployment/             ← Vercel / build artifacts
└── archive/                ← dead ends
```

## Context

This is v4 of the Starter Portal. v3 was a 2-page portal for post-contract starters. v4 splits the journey into 3 distinct funnel moments:

1. **Pre-contract** (this page) — motivate them to sign. Advance-agnostic (shows range, not specific amount).
2. **Petition creation** — post-contract, help them launch their petition. TBD.
3. **Share unit** — petition live, help them post + submit. TBD.

## Page 1 CTA + constraints

- **CTA:** "Sign your contract"
- **Audience:** Starter who clicked the outreach email — hasn't committed yet
- **Constraint:** Advance-agnostic. Show tier range, never a specific dollar amount.
- **Key content:** Hero, Kelsey video, deliverables grid, "not a brand deal" differentiators, earnings calculator (promo revenue only), tier chart, proof points, 3-step how it works

## Design system

Carries over from v3: Sunrise tokens, Commissioner font, red-as-punctuation, yellow CTA, tokenized URL (`?starter=<token>`)

## Key source docs

- Sprint plan: `docs/Starter Portal — Sprint Plan v4.md`
- Comms voice + load-bearing phrases: [SE Comms Flow](https://docs.google.com/document/d/17YJDQDj0Jr8HD_2W19jo2PhkT-kSpD2C3f_OvSVlK28/edit)

## Pointers

- Personal workspace memory: `/Users/kkindall/Desktop/Claude/CLAUDE.md`
- Related projects: `AI Weeks/Starter Portal v3 Demo`, `AI Weeks/Starter Portal v3 Deploy`
