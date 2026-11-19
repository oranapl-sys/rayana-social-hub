# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Oran**, founder of Rayana Coffees, a small specialty coffee brand. Mostly on his Android phone, in short bursts between market days and roasting. His main job when he opens the hub: **check this week** (what's due, what's ready for him to look at, what to film). His second job: drop a reference (a reel, TikTok, photo or video he likes) in a few taps, often from the Android share menu.
- **The social media agent** (Claude), which reads and writes the same files from the PC: plans posts, writes guidelines, logs trial results.
- A second person with view-only access on their own device.

## Product Purpose

A shared planning space between Oran and his social media agent: this week's posting slots on a 2-week cycle, an ideas inbox, a references board, each platform's guidelines, and (v2) a feed preview, a pipeline board and trial-results cards. Success: Oran knows in ten seconds what needs him this week, and saving a reference never feels like work.

## Positioning

Not a scheduler. It never publishes or schedules anything; approval to publish happens only in chat with the agent, so every "approved" control only records a status. Its data is private files in Oran's own GitHub repository, edited by both a human and an agent.

## Operating Context

- Weekly rhythm: a few video and carousel slots a week on a 2-week cycle, plus stories. The actual days and times live in the private data repository.
- Every video is tested first as 3 Instagram Trial Reel variants (A/B/C), judged at 48 hours on the 3-second hold, then watch time, shares and saves. Only the winner goes to the feed.
- Market days drive filming. The dates live in the private data repository.
- Instagram first, then TikTok, Facebook and YouTube Shorts.

## Capabilities and Constraints

- Static site on GitHub Pages (public repo, code only, no build step: plain HTML, CSS, ES modules). All content in a private data repo, read and written through the GitHub contents API with a fine-grained token kept in the browser.
- One JSON or markdown file per item. Pictures compressed in the browser to under ~1.8 MB; big videos are Google Drive links, clips under 20 MB can be uploaded.
- Installable PWA with an Android share target.
- No business facts invented in the app; open questions are shown as open.

## Brand Commitments

- Colours: deep green #1F3B31, oxblood #5B2024, cream #F1E8D8, brass #C0A06A (thin lines only).
- Type: Libre Baskerville for headlines, Plus Jakarta Sans for text.
- Calm, premium, readable on a phone. Oran said v1 "looks really AI": the redesign must not read as a generic template.

## Evidence on Hand

- Platform guidelines, series, rhythm and market dates in the data starter (`../rayana-social-data`).
- No real post covers or trial results yet; empty states must say so honestly.

## Product Principles

1. This week first: the home screen answers "what needs me now".
2. Capture in seconds: saving a reference is never more than share, pick, save.
3. Records, not actions: nothing in the app publishes.
4. Honest about gaps: undecided things look undecided.
5. One shared source: the agent and Oran edit the same files.
