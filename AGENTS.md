# AGENTS.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

Offline-first PWA for practicing Czech citizenship test questions. The UI is in Czech. All code lives in the `app/` directory — there is no build step, bundler, or package manager. The app is plain HTML + CSS + vanilla JS served as static files.

## Running Locally

Serve the `app/` directory over HTTP (required for the service worker):

```
npx serve app
```

Or any static file server pointing at `app/`. Opening `index.html` directly via `file://` will fail because the service worker and fetch API require an HTTP origin.

## Architecture

- **`app/index.html`** — Single-page shell. Contains the quiz panel (question + 4 answer buttons) and the results panel. All DOM elements are referenced by ID in `app.js`.
- **`app/app.js`** — All application logic. A single `state` object holds quiz state (loaded questions, randomized order, current index, answer history). Key flows:
  - `loadQuestions()` fetches `questions.json`, then `startOrReset()` shuffles question IDs and begins the quiz.
  - `onAnswer(choice)` records the user's **first** answer per question (subsequent taps don't overwrite) and auto-advances on correct answers after 250 ms.
  - `renderResults()` builds the results list from `state.order` and `state.answers`.
  - `btnRetryWrong` starts a new quiz containing only previously incorrect questions.
- **`app/questions.json`** — Question bank generated from a PDF source. Each question object has: `id` (e.g. `t01_q01`), `topic`, `topic_seq`, `qnum`, `correct` (A/B/C/D), `question` (text, may be empty for image-only questions), `options` (array of `{label, text}`), and `scan`/`img` paths pointing into `assets/`.
- **`app/sw.js`** — Service worker using a cache-first strategy. The `PRECACHE_URLS` array lists every asset that must be cached on install. **When adding new assets or questions, update this array** and bump `CACHE_NAME`.
- **`app/assets/`** — PNG scans of each question (named `t{topic}_q{num}.png`). These serve as fallback images when question/option text is empty or when the user toggles the image view.
- **`app/styles.css`** — Supports both light and dark mode via `prefers-color-scheme` media queries.

## Key Conventions

- No build tools, no npm dependencies, no transpilation. Keep everything as plain browser-compatible JS/CSS/HTML.
- The app must work fully offline after first load. Any new static assets must be added to the `PRECACHE_URLS` array in `sw.js`.
- When modifying `sw.js`, increment the version suffix in `CACHE_NAME` (e.g. `"obcanstvi-offline-v2"` → `"obcanstvi-offline-v3"`) to force cache invalidation.
- Question IDs follow the pattern `t{NN}_q{NN}` where the first number is the topic sequence and the second is the question number within that topic.
- Some questions have empty `question` or option `text` fields — these are image-only and the app auto-shows the scan image via `shouldDefaultShowScan()`.
