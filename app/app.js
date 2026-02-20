/* Offline quiz PWA (CZ citizenship test)
   - supports text questions/options + optional "scan" image fallback
*/

const state = {
  loaded: false,
  questions: [],
  order: [],
  idx: 0,
  answers: new Map(), // id -> {choice, correctBool}
  showScan: false,
};

const el = {
  btnStart: document.getElementById("btnStart"),
  btnPrev: document.getElementById("btnPrev"),
  btnNext: document.getElementById("btnNext"),
  btnResults: document.getElementById("btnResults"),
  btnToggleScan: document.getElementById("btnToggleScan"),
  statusLine: document.getElementById("statusLine"),
  subStatus: document.getElementById("subStatus"),
  quizPanel: document.getElementById("quizPanel"),
  resultsPanel: document.getElementById("resultsPanel"),
  questionText: document.getElementById("questionText"),
  scanWrap: document.getElementById("scanWrap"),
  questionImg: document.getElementById("questionImg"),
  answerBtns: Array.from(document.querySelectorAll(".answer")),
  optionSlots: Array.from(document.querySelectorAll('[data-slot]')),
  resultsSummary: document.getElementById("resultsSummary"),
  resultsList: document.getElementById("resultsList"),
};

function shuffleInPlace(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function currentQuestion() {
  const qid = state.order[state.idx];
  return state.questions.find(q => q.id === qid) || null;
}

function answeredCount() {
  return state.answers.size;
}

function correctCount() {
  let c = 0;
  for (const v of state.answers.values()) if (v.correctBool) c++;
  return c;
}

function wrongCount() {
  let w = 0;
  for (const v of state.answers.values()) if (!v.correctBool) w++;
  return w;
}

function updateStatus() {
  const total = state.order.length;
  const done = answeredCount();
  const left = total - done;
  el.statusLine.textContent = state.loaded
    ? `Otázka ${state.idx + 1}/${total} • Hotovo: ${done} • Zbývá: ${left}`
    : "Načítám…";

  const q = currentQuestion();
  if (q) {
    el.subStatus.textContent = `${q.topic} • úloha ${q.qnum} • Správně: ${correctCount()} • Špatně: ${wrongCount()}`;
  } else {
    el.subStatus.textContent = "";
  }
}

function setPanel(which) {
  const showResults = which === "results";
  el.resultsPanel.style.display = showResults ? "block" : "none";
  el.quizPanel.style.display = showResults ? "none" : "block";
}

function clearAnswerStyles() {
  for (const b of el.answerBtns) {
    b.classList.remove("selected", "correct", "wrong");
  }
}

function normalizeSpaces(s) {
  return (s || "").replace(/\s+/g, " ").trim();
}

function shouldDefaultShowScan(q) {
  // if any option text is empty, user likely needs the scan (image-only answers)
  if (!q?.options) return false;
  return q.options.some(o => !normalizeSpaces(o.text));
}

function renderQuestion() {
  const q = currentQuestion();
  if (!q) return;

  setPanel("quiz");
  clearAnswerStyles();

  el.questionText.textContent = q.question ? q.question : "";

  // fill options text
  const byLabel = new Map((q.options || []).map(o => [o.label, o]));
  for (const slot of el.optionSlots) {
    const label = slot.getAttribute("data-slot");
    const opt = byLabel.get(label);
    slot.textContent = opt ? (opt.text || "") : "";
  }

  // scan toggle
  const show = state.showScan || shouldDefaultShowScan(q);
  el.scanWrap.style.display = show ? "flex" : "none";
  el.btnToggleScan.setAttribute("aria-expanded", String(show));
  el.btnToggleScan.textContent = show ? "Skrýt obrázek" : "Obrázek";

  if (q.scan) {
    el.questionImg.src = q.scan;
    el.questionImg.alt = `Otázka ${state.idx + 1} (scan)`;
  } else if (q.img) {
    el.questionImg.src = q.img;
    el.questionImg.alt = `Otázka ${state.idx + 1}`;
  }

  const saved = state.answers.get(q.id);
  if (saved) {
    const btn = el.answerBtns.find(b => b.dataset.choice === saved.choice);
    if (btn) {
      btn.classList.add("selected");
      btn.classList.add(saved.correctBool ? "correct" : "wrong");
    }
  }

  el.btnPrev.disabled = state.idx <= 0;
  el.btnNext.disabled = state.idx >= state.order.length - 1;

  updateStatus();
}

function goToIndex(i) {
  const clamped = Math.max(0, Math.min(state.order.length - 1, i));
  state.idx = clamped;
  // reset per-question scan state
  state.showScan = false;
  renderQuestion();
}

function goNext() { goToIndex(state.idx + 1); }
function goPrev() { goToIndex(state.idx - 1); }

function startOrReset() {
  if (!state.loaded) return;
  if (state.answers.size > 0) {
    const ok = confirm("Smazat odpovědi a spustit test znovu?");
    if (!ok) return;
  }
  state.answers.clear();
  state.order = shuffleInPlace(state.questions.map(q => q.id));
  state.idx = 0;
  state.showScan = false;
  renderQuestion();
}

function onAnswer(choice) {
  const q = currentQuestion();
  if (!q) return;

  const correctBool = choice === q.correct;
  state.answers.set(q.id, { choice, correctBool });

  // styles reset
  for (const b of el.answerBtns) {
    b.classList.remove("selected", "correct", "wrong", "flash-correct");
  }

  const chosenBtn = el.answerBtns.find(b => b.dataset.choice === choice);
  const correctBtn = el.answerBtns.find(b => b.dataset.choice === q.correct);

  if (chosenBtn) {
    chosenBtn.classList.add("selected");
    chosenBtn.classList.add(correctBool ? "correct" : "wrong");
  }

  if (!correctBool && correctBtn) {
    // blink green on correct answer
    // forcibly reset the animation
    correctBtn.classList.remove("flash-correct");
    // reflow trick
    void correctBtn.offsetWidth;
    correctBtn.classList.add("flash-correct");
  }

  updateStatus();

  if (correctBool) {
    // auto-next only in case of right answer and if the question is not last
    if (state.idx < state.order.length - 1) {
      // small delay to make animation visible
      setTimeout(() => goNext(), 250);
    }
  }
}

function renderResults() {
  setPanel("results");

  const total = state.order.length;
  const ok = correctCount();
  const bad = wrongCount();
  const done = answeredCount();
  const na = total - done;

  el.resultsSummary.textContent = `Správně: ${ok} • Špatně: ${bad} • Nezodpovězeno: ${na} • Celkem: ${total}`;
  el.resultsList.innerHTML = "";

  state.order.forEach((qid, i) => {
    const q = state.questions.find(x => x.id === qid);
    if (!q) return;

    const ans = state.answers.get(qid);
    const status = ans ? (ans.correctBool ? "correct" : "wrong") : "na";

    const item = document.createElement("div");
    item.className = `result-item ${status}`;

    const badge = document.createElement("div");
    badge.className = `badge ${ans ? (ans.correctBool ? "ok" : "no") : "na"}`;
    badge.textContent = ans ? (ans.correctBool ? "✓" : "✕") : "…";

    const num = document.createElement("div");
    num.className = "num";
    num.textContent = String(i + 1);

    const text = document.createElement("div");
    text.className = "result-text";

    const title = document.createElement("div");
    title.style.fontWeight = "700";
    title.textContent = `${q.topic} • úloha ${q.qnum}`;

    const sub = document.createElement("div");
    sub.className = "small";

    if (!ans) {
      sub.textContent = "Nezodpovězeno";
    } else {
      sub.textContent = `Odpověď: ${ans.choice} • Správně: ${q.correct}`;
    }

    text.appendChild(title);
    text.appendChild(sub);

    item.appendChild(badge);
    item.appendChild(num);
    item.appendChild(text);

    item.addEventListener("click", () => {
      goToIndex(i);
    });

    el.resultsList.appendChild(item);
  });
}

async function loadQuestions() {
  // Let service worker handle caching (Cache First).
  const res = await fetch("questions.json");
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  state.questions = data.questions;
  state.loaded = true;
}

function registerSW() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
}

// Events
el.btnStart.addEventListener("click", startOrReset);
el.btnPrev.addEventListener("click", goPrev);
el.btnNext.addEventListener("click", goNext);
el.btnResults.addEventListener("click", renderResults);
el.btnToggleScan.addEventListener("click", () => {
  state.showScan = !state.showScan;
  renderQuestion();
});

for (const b of el.answerBtns) {
  b.addEventListener("click", () => onAnswer(b.dataset.choice));
}

(async function init() {
  registerSW();
  try {
    await loadQuestions();
    startOrReset();
  } catch (e) {
    el.statusLine.textContent = "Chyba načítání (zkus otevřít přes http/https).";
    console.error(e);
  }
})();
