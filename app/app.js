/* Offline quiz PWA */
const state = {
  loaded: false,
  questions: [],
  order: [],
  idx: 0,
  answers: new Map(), // id -> {choice, correctBool}
};

const el = {
  btnStart: document.getElementById("btnStart"),
  btnPrev: document.getElementById("btnPrev"),
  btnNext: document.getElementById("btnNext"),
  btnResults: document.getElementById("btnResults"),
  statusLine: document.getElementById("statusLine"),
  subStatus: document.getElementById("subStatus"),
  quizPanel: document.getElementById("quizPanel"),
  resultsPanel: document.getElementById("resultsPanel"),
  questionImg: document.getElementById("questionImg"),
  answers: document.getElementById("answers"),
  answerBtns: Array.from(document.querySelectorAll(".answer")),
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

function renderQuestion() {
  const q = currentQuestion();
  if (!q) return;
  setPanel("quiz");
  clearAnswerStyles();

  el.questionImg.src = q.img;
  el.questionImg.alt = `Otázka ${state.idx + 1}`;

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
  renderQuestion();
}

function goNext() { goToIndex(state.idx + 1); }
function goPrev() { goToIndex(state.idx - 1); }

function startOrReset() {
  if (!state.loaded) return;
  state.answers.clear();
  state.order = shuffleInPlace(state.questions.map(q => q.id));
  state.idx = 0;
  renderQuestion();
}

function handleChoice(choice) {
  const q = currentQuestion();
  if (!q) return;

  const isCorrect = (choice === q.correct);
  state.answers.set(q.id, { choice, correctBool: isCorrect });

  clearAnswerStyles();
  const btn = el.answerBtns.find(b => b.dataset.choice === choice);
  if (btn) {
    btn.classList.add("selected");
    btn.classList.add(isCorrect ? "correct" : "wrong");
  }

  updateStatus();

  // auto-next only on correct
  if (isCorrect) {
    // small microtask so UI paints selected state on low-end devices
    setTimeout(() => goNext(), 30);
  }
}

function renderResults() {
  if (!state.loaded) return;

  setPanel("results");
  const total = state.order.length;
  const ok = correctCount();
  const no = wrongCount();
  const done = answeredCount();
  el.resultsSummary.textContent = `Zodpovězeno: ${done}/${total}. Správně: ${ok}. Špatně: ${no}. Nezodpovězeno: ${total - done}.`;

  el.resultsList.innerHTML = "";

  // Show in the current randomized order, so clicking jumps correctly.
  state.order.forEach((qid, i) => {
    const q = state.questions.find(x => x.id === qid);
    const a = state.answers.get(qid);
    const isAnswered = !!a;
    const isOk = isAnswered ? a.correctBool : null;

    const row = document.createElement("div");
    row.className = "result-item";
    row.tabIndex = 0;
    row.role = "button";

    const badge = document.createElement("div");
    badge.className = "badge " + (isAnswered ? (isOk ? "ok" : "no") : "");
    badge.textContent = isAnswered ? (isOk ? "✓" : "✕") : "–";

    const text = document.createElement("div");
    text.className = "result-text";
    const title = document.createElement("div");
    title.style.fontWeight = "700";
    title.textContent = `Otázka ${i + 1}/${total}`;
    const sub = document.createElement("div");
    sub.className = "small";
    const picked = isAnswered ? `Vybral: ${a.choice}` : "Nezodpovězeno";
    sub.textContent = `${q.topic} • úloha ${q.qnum} • ${picked} • Správně: ${q.correct}`;
    text.appendChild(title);
    text.appendChild(sub);

    row.appendChild(badge);
    row.appendChild(text);

    row.addEventListener("click", () => {
      goToIndex(i);
    });
    row.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        goToIndex(i);
      }
    });

    el.resultsList.appendChild(row);
  });
}

async function init() {
  // Service worker
  if ("serviceWorker" in navigator) {
    try {
      await navigator.serviceWorker.register("./sw.js");
    } catch (_) {}
  }

  // Load questions
  const res = await fetch("./questions.json", { cache: "no-store" });
  const data = await res.json();
  state.questions = data.questions;
  state.loaded = true;

  // Initialize randomized order every time app opens (requirement: always random)
  startOrReset();
}

el.btnStart.addEventListener("click", startOrReset);
el.btnNext.addEventListener("click", goNext);
el.btnPrev.addEventListener("click", goPrev);
el.btnResults.addEventListener("click", () => {
  if (el.resultsPanel.style.display === "block") {
    renderQuestion();
  } else {
    renderResults();
  }
});

el.answers.addEventListener("click", (e) => {
  const t = e.target.closest(".answer");
  if (!t) return;
  handleChoice(t.dataset.choice);
});

document.addEventListener("keydown", (e) => {
  if (el.resultsPanel.style.display === "block") return;
  if (e.key === "ArrowRight") goNext();
  if (e.key === "ArrowLeft") goPrev();
  if (e.key === "1") handleChoice("A");
  if (e.key === "2") handleChoice("B");
  if (e.key === "3") handleChoice("C");
  if (e.key === "4") handleChoice("D");
});

init().catch(err => {
  el.statusLine.textContent = "Chyba při načítání.";
  el.subStatus.textContent = String(err);
});
