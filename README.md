# Rayana Social Hub

A phone-first web app where Rayana Coffees plans its social media with its social media agent. It looks like the green chalkboard at the market stall: this week chalked on the board, a pipeline from idea to posted, a preview of the Instagram grid, a references board (links, pictures, videos), each platform's guide, and the A/B/C trial results for every video.

- **This repository is public and holds code only.** All content lives in a separate **private** data repository, read and written in the browser through the GitHub REST API with a fine-grained token that stays in that browser's storage.
- **No build step.** Plain HTML, CSS and JavaScript modules, served by GitHub Pages from the repository root.
- **The app never publishes or schedules anything.** Any "approved" status is only a record; approval to publish happens in chat with the agent.

Setup (repositories, token, GitHub Pages): [SETUP.md](SETUP.md).

## Run it locally

```
node tools/dev-server.mjs
```

Open http://localhost:5173 and choose **Use local test data**. The dev server fakes the GitHub contents API under `/mock-api`, backed by `.mock-data/` (seeded once from `../rayana-social-data`; `--reset` re-seeds).

## Layout

```
index.html              shell: top bar, tab bar, <main>
css/app.css             all styles (brand tokens at the top)
js/app.js               router and shared context
js/github.js            GitHub REST client (contents API)
js/store.js             data layer: one file per item, sha-keyed cache, media cache
js/md.js                safe markdown renderer for the guidelines
js/image.js             in-browser photo compression (about 2048 px, under 1.8 MB)
js/ui.js                element builder, icons (Phosphor), status marks, post codes, sheets, vocabulary, dates
js/views/*.js           week (and the post editor), pipeline (and ideas), feed, references, platforms (guides), settings
manifest.webmanifest    installable app, Android share target
sw.js                   network-first shell cache (never caches GitHub data)
tools/dev-server.mjs    local server plus fake GitHub API
```

The data repository's file formats are described in its own README. Design decisions: PRODUCT.md and DESIGN.md.
