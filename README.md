# 🇨🇿 Czech Citizenship Quiz (Reálie ČR)

[![PWA Ready](https://img.shields.io/badge/PWA-ready-brightgreen)](#)
[![Offline Support](https://img.shields.io/badge/Works-Offline-blue)](#)
[![Non-Commercial](https://img.shields.io/badge/License-Non--Commercial-lightgrey)](#)
[![Official Question Source](https://img.shields.io/badge/Data-Official%20NPI%20ČR-red)](https://cestina-pro-cizince.cz/obcanstvi/databanka-uloh/)

A lightweight, fully offline **Progressive Web App (PWA)** for practicing the Czech citizenship exam (*knowledge of Czech realities — reálie ČR*).

This is a **non-commercial, altruistic project** created to help applicants prepare in a simple, distraction-free way.

---

## 🌐 Online Version

Use the app directly here:

👉 **https://k0taperk0t.github.io/cz-citizenship-quiz/app/**

After the first load, the application works fully offline.

---

## 📚 Official Question Source

All questions are based on the official public database published by:

**NPI ČR – Databanka testových úloh**
- https://cestina-pro-cizince.cz/obcanstvi/databanka-uloh/
- **Last updated:** 5 January 2026 (*Aktualizováno 5. 1. 2026*)

This application does not modify the content of the questions.
It reorganizes them into a more convenient interactive format.

---

## ✨ Features

- ✅ All official questions included
- 🖼 All official images preserved (including image-only answers)
- 🔀 Randomized question order
- 🧠 Learning-oriented logic:
  - You must answer correctly before moving forward
  - The **first attempt** is recorded for scoring
- 📊 Detailed results view:
  - Correct / incorrect / unanswered counters
  - Jump to any question
  - Filter only incorrect answers
  - Retry test using only incorrect answers
- 📱 Installable PWA (works like a native app)
- 🌐 Fully offline after first load
- 🚫 No ads, no tracking, no analytics

---

## 🧩 How Scoring Works

- The **first answer** selected for each question is stored.
- If your answer is incorrect, you must correct it before continuing.
- The results screen evaluates correctness based on your first attempt.

This allows:
- Realistic evaluation
- Active learning
- Focused repetition of mistakes

---

## 🚀 Running Locally

Because this is a PWA, it must be served via HTTP (not opened via `file://`).

### Option 1 — Python

```bash
python -m http.server 8000
```

Then open: http://localhost:8000/app/

### Option 2 — Node.js

```bash
npx serve .
```

Then open the `/app/` path shown by the server output.

---

## 📲 Installing as an App

**iPhone (Safari)**

1. Open the app
2. Tap **Share**
3. Select **Add to Home Screen**

**Android (Chrome)**

1. Open the app
2. Open the browser menu
3. Select **Install app**

Once installed, the app works completely offline.

---

## ⚠️ Disclaimer

This project:

- Is not affiliated with NPI ČR or the Czech government
- Is provided for educational purposes only
- Does not replace official preparation materials

Always verify exam requirements on the official website.

---

## ❤️ Why This Exists

Preparing for the Czech citizenship exam can be stressful.

This project exists to make studying:

- simpler
- faster
- distraction-free
- accessible offline

If it helps someone succeed — it has achieved its goal.

---

## 📄 License

This project is intended for non-commercial educational use.

Official test content remains the property of its original publisher (NPI ČR).
