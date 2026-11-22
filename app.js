/**
 * RecallRocket: MemoryMint Marathon
 * SM-2 Spaced Repetition Engine, ISO UTC Streak Tracking,
 * Cohort Leaderboard, CSV Import/Export, Speech Synthesis & Decay Curve
 */

const STORAGE_KEY = "recallrocket_attempt4_v1";

function utcToday(offsetDays = 0) {
  const now = new Date();
  const utc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + offsetDays);
  return new Date(utc).toISOString().split("T")[0];
}

const STARTER_STATE = {
  theme: "light",
  activeDeckId: "deck-cs",
  user: {
    name: "You",
    streak: 6,
    lastUtc: utcToday(-1),
    reviews: 46
  },
  cohort: [
    { name: "Riya Sen", streak: 13, reviews: 84 },
    { name: "Aditya Joshi", streak: 9, reviews: 71 },
    { name: "Sneha Pillai", streak: 10, reviews: 59 },
    { name: "Kunal Das", streak: 4, reviews: 38 }
  ],
  decks: [
    {
      id: "deck-cs",
      name: "Algorithms",
      cards: [
        {
          id: "cs-1",
          front: "What is the average and worst-case time complexity of **QuickSort**?",
          back: "Average: `O(n log n)` · Worst: `O(n²)` when partitions are unbalanced.",
          ef: 2.5,
          interval: 0,
          reps: 0,
          due: utcToday(0)
        },
        {
          id: "cs-2",
          front: "How does **MergeSort** achieve `O(n log n)` worst-case time?",
          back: "It divides the array into halves (`log n` depth) and merges in linear `O(n)` time.",
          ef: 2.5,
          interval: 0,
          reps: 0,
          due: utcToday(0)
        },
        {
          id: "cs-3",
          front: "What data structure supports fast min-extraction in **Dijkstra's Algorithm**?",
          back: "A **Min-Priority Queue** (`O((V + E) log V)` with a binary heap).",
          ef: 2.5,
          interval: 0,
          reps: 0,
          due: utcToday(0)
        },
        {
          id: "cs-4",
          front: "What is the time complexity of bottom-up **Heapify** on $n$ elements?",
          back: "`O(n)` linear time.",
          ef: 2.5,
          interval: 0,
          reps: 0,
          due: utcToday(0)
        },
        {
          id: "cs-5",
          front: "What are the two core requirements for **Dynamic Programming**?",
          back: "**Optimal substructure** and **overlapping subproblems**.",
          ef: 2.5,
          interval: 0,
          reps: 0,
          due: utcToday(0)
        },
        {
          id: "cs-6",
          front: "How can you detect a cycle in a **Directed Graph**?",
          back: "Track recursion stack nodes during **DFS** or check **Topological Sort** node count.",
          ef: 2.5,
          interval: 0,
          reps: 0,
          due: utcToday(0)
        },
        {
          id: "cs-7",
          front: "What is the call-stack space complexity of **DFS** on a tree of height $h$?",
          back: "`O(h)` space.",
          ef: 2.5,
          interval: 0,
          reps: 0,
          due: utcToday(0)
        },
        {
          id: "cs-8",
          front: "Why does **Binary Search** run in `O(log n)` time?",
          back: "Each step halves the remaining sorted search range.",
          ef: 2.5,
          interval: 0,
          reps: 0,
          due: utcToday(0)
        },
        {
          id: "cs-9",
          front: "What is the amortized cost of pushing to a doubling **Dynamic Array**?",
          back: "`O(1)` amortized per push.",
          ef: 2.5,
          interval: 0,
          reps: 0,
          due: utcToday(0)
        },
        {
          id: "cs-10",
          front: "Which traversal visits a **Binary Search Tree** in sorted order?",
          back: "**In-order traversal** (`Left → Root → Right`).",
          ef: 2.5,
          interval: 0,
          reps: 0,
          due: utcToday(0)
        }
      ]
    }
  ]
};

let state = loadState();
let queue = [];
let index = 0;
let flipped = false;
let practiceAll = false;

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(STARTER_STATE));
    return structuredClone(STARTER_STATE);
  }
  return JSON.parse(saved);
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function runSM2(card, grade) {
  let { ef, interval, reps } = card;
  if (grade < 3) {
    reps = 0;
    interval = 1;
  } else {
    if (reps === 0) interval = 1;
    else if (reps === 1) interval = 6;
    else interval = Math.round(interval * ef);
    reps += 1;
  }
  ef = ef + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02));
  if (ef < 1.3) ef = 1.3;

  return {
    ef: Number(ef.toFixed(2)),
    interval,
    reps,
    due: utcToday(interval)
  };
}

function formatText(text) {
  const safe = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return safe
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/`(.+?)`/g, "<code>$1</code>");
}

function updateStreak(completedToday = false) {
  const today = utcToday(0);
  const yesterday = utcToday(-1);
  if (state.user.lastUtc && state.user.lastUtc !== today && state.user.lastUtc !== yesterday) {
    state.user.streak = 0;
  }
  if (completedToday && state.user.lastUtc !== today) {
    state.user.streak += 1;
    state.user.lastUtc = today;
  }
}

function getBadge(streak) {
  if (streak >= 30) return "🏆 Grandmaster";
  if (streak >= 14) return "⚡ Pro";
  if (streak >= 7) return "🔥 7-Day Streak";
  if (streak >= 3) return "🌱 Active";
  return "🚀 Starter";
}

function currentDeck() {
  return state.decks.find(d => d.id === state.activeDeckId) || state.decks[0];
}

function rebuildQueue() {
  const deck = currentDeck();
  const today = utcToday(0);
  queue = practiceAll ? [...deck.cards] : deck.cards.filter(c => c.due <= today);
  index = 0;
  flipped = false;
}

function render() {
  document.documentElement.setAttribute("data-theme", state.theme);
  updateStreak(false);

  document.getElementById("streakNum").textContent = state.user.streak;
  document.getElementById("streakTier").textContent = getBadge(state.user.streak);

  const menu = document.getElementById("deckMenu");
  menu.innerHTML = state.decks
    .map(d => `<option value="${d.id}" ${d.id === state.activeDeckId ? "selected" : ""}>${d.name} (${d.cards.length})</option>`)
    .join("");

  const deck = currentDeck();
  const dueCount = deck.cards.filter(c => c.due <= utcToday(0)).length;
  document.getElementById("duePill").textContent = `${dueCount} due`;

  renderArena();
  renderDeckCards();
  renderRanks();
  renderDecayChart();
}

function renderArena() {
  const arenaBox = document.getElementById("arenaBox");
  const finishedBox = document.getElementById("finishedBox");
  const card3d = document.getElementById("card3d");
  const gradePanel = document.getElementById("gradePanel");

  if (!queue.length || index >= queue.length) {
    arenaBox.classList.add("hidden");
    finishedBox.classList.remove("hidden");
    return;
  }

  arenaBox.classList.remove("hidden");
  finishedBox.classList.add("hidden");

  const card = queue[index];
  card3d.classList.toggle("is-flipped", flipped);
  gradePanel.classList.toggle("hidden", !flipped);

  document.getElementById("qText").innerHTML = formatText(card.front);
  document.getElementById("aText").innerHTML = formatText(card.back);
  document.getElementById("queuePos").textContent = `Card ${index + 1} of ${queue.length}`;
  document.getElementById("sm2Readout").textContent = `EF: ${card.ef.toFixed(2)} · Interval: ${card.interval}d · Reps: ${card.reps}`;
  document.getElementById("progressFill").style.width = `${(index / queue.length) * 100}%`;

  [3, 4, 5].forEach(g => {
    document.getElementById(`nextInt-${g}`).textContent = `${runSM2(card, g).interval}d`;
  });
}

function renderDeckCards() {
  document.getElementById("deckCardsList").innerHTML = currentDeck().cards
    .map(c => `
      <div class="deck-card-row">
        <div>${formatText(c.front)}</div>
        <div class="row-info">Due ${c.due} · EF ${c.ef.toFixed(2)}</div>
      </div>
    `)
    .join("");
}

function renderRanks() {
  const rows = [
    ...state.cohort.map(p => ({ ...p, isYou: false })),
    {
      name: state.user.name,
      streak: state.user.streak,
      reviews: state.user.reviews,
      isYou: true
    }
  ].map(r => ({
    ...r,
    points: r.reviews * 10 + r.streak * 25
  }));

  rows.sort((a, b) => b.points - a.points);
  const rank = rows.findIndex(r => r.isYou) + 1;
  document.getElementById("myRankVal").textContent = `#${rank}`;

  document.getElementById("ranksBody").innerHTML = rows
    .map((r, i) => `
      <tr class="${r.isYou ? "me" : ""}">
        <td>#${i + 1}</td>
        <td>${r.name}</td>
        <td>${getBadge(r.streak)}</td>
        <td>🔥 ${r.streak}d</td>
        <td>${r.reviews}</td>
        <td><strong>${r.points}</strong></td>
      </tr>
    `)
    .join("");
}

function renderDecayChart() {
  const canvas = document.getElementById("decayChart");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const cards = currentDeck().cards;
  const avgEf = cards.length ? cards.reduce((s, c) => s + c.ef, 0) / cards.length : 2.5;
  document.getElementById("avgEfVal").textContent = avgEf.toFixed(2);

  const w = canvas.width;
  const h = canvas.height;
  const pad = 42;
  ctx.clearRect(0, 0, w, h);

  ctx.strokeStyle = "#9ca3af";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(pad, 18);
  ctx.lineTo(pad, h - pad);
  ctx.lineTo(w - 18, h - pad);
  ctx.stroke();

  ctx.fillStyle = "#9ca3af";
  ctx.font = "12px sans-serif";
  ctx.fillText("100%", 6, 24);
  ctx.fillText("Day 0", pad, h - 18);
  ctx.fillText("Day 30", w - 58, h - 18);

  const reviewDays = [1, 6, Math.round(6 * avgEf)];
  let baseDay = 0;
  let stability = 1.5;

  ctx.strokeStyle = "#2563eb";
  ctx.lineWidth = 3;
  ctx.beginPath();

  for (let d = 0; d <= 30; d += 0.25) {
    if (reviewDays.includes(Math.round(d)) && Math.abs(d - Math.round(d)) < 0.14 && d > 0) {
      baseDay = d;
      stability *= avgEf * 0.85;
    }
    const r = Math.exp(-(d - baseDay) / stability);
    const x = pad + (d / 30) * (w - pad - 28);
    const y = (h - pad) - r * (h - pad - 28);
    if (d === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
}

function flip() {
  if (!queue.length || index >= queue.length) return;
  flipped = !flipped;
  renderArena();
}

function gradeCard(g) {
  if (!flipped || index >= queue.length) return;
  const card = queue[index];
  Object.assign(card, runSM2(card, g));
  state.user.reviews += 1;
  updateStreak(true);
  saveState();
  index += 1;
  flipped = false;
  render();
}

function speak(str) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(new SpeechSynthesisUtterance(str.replace(/[*`]/g, "")));
}

document.getElementById("card3d").addEventListener("click", e => {
  if (e.target.closest(".speak-btn")) return;
  flip();
});

document.getElementById("speakQ").addEventListener("click", () => speak(queue[index]?.front || ""));
document.getElementById("speakA").addEventListener("click", () => speak(queue[index]?.back || ""));

document.querySelectorAll(".grade-btn").forEach(btn => {
  btn.addEventListener("click", () => gradeCard(Number(btn.dataset.grade)));
});

document.addEventListener("keydown", e => {
  if (["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName)) return;
  if (e.code === "Space") {
    e.preventDefault();
    flip();
  } else if (["1", "2", "3", "4", "5"].includes(e.key) && flipped) {
    gradeCard(Number(e.key));
  }
});

document.querySelectorAll(".tab-item").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab-item").forEach(t => t.classList.remove("active"));
    document.querySelectorAll(".tab-view").forEach(v => v.classList.remove("active"));
    tab.classList.add("active");
    document.getElementById(`tab-${tab.dataset.tab}`).classList.add("active");
    if (tab.dataset.tab === "decay") renderDecayChart();
  });
});

document.getElementById("openRanksBtn").addEventListener("click", () => {
  document.querySelector('[data-tab="ranks"]').click();
});

document.getElementById("deckMenu").addEventListener("change", e => {
  state.activeDeckId = e.target.value;
  practiceAll = false;
  saveState();
  rebuildQueue();
  render();
});

document.getElementById("practiceAllBtn").addEventListener("click", () => {
  practiceAll = true;
  rebuildQueue();
  render();
});

document.getElementById("themeSwitch").addEventListener("click", () => {
  state.theme = state.theme === "light" ? "dark" : "light";
  saveState();
  render();
});

const deckModal = document.getElementById("deckModal");
document.getElementById("btnAddDeck").addEventListener("click", () => deckModal.classList.remove("hidden"));
document.getElementById("cancelDeckBtn").addEventListener("click", () => deckModal.classList.add("hidden"));
document.getElementById("confirmDeckBtn").addEventListener("click", () => {
  const name = document.getElementById("deckNameField").value.trim();
  if (!name) return;
  const deck = { id: `deck-${Date.now()}`, name, cards: [] };
  state.decks.push(deck);
  state.activeDeckId = deck.id;
  document.getElementById("deckNameField").value = "";
  deckModal.classList.add("hidden");
  saveState();
  rebuildQueue();
  render();
});

const cardModal = document.getElementById("cardModal");
const qField = document.getElementById("qField");
const aField = document.getElementById("aField");

document.getElementById("btnAddCard").addEventListener("click", () => cardModal.classList.remove("hidden"));
document.getElementById("cancelCardBtn").addEventListener("click", () => cardModal.classList.add("hidden"));

qField.addEventListener("input", () => {
  document.getElementById("qLive").innerHTML = formatText(qField.value || "Question preview...");
});
aField.addEventListener("input", () => {
  document.getElementById("aLive").innerHTML = formatText(aField.value || "Answer preview...");
});

document.getElementById("confirmCardBtn").addEventListener("click", () => {
  const front = qField.value.trim();
  const back = aField.value.trim();
  if (!front || !back) return;
  currentDeck().cards.push({
    id: `c-${Date.now()}`,
    front,
    back,
    ef: 2.5,
    interval: 0,
    reps: 0,
    due: utcToday(0)
  });
  qField.value = "";
  aField.value = "";
  cardModal.classList.add("hidden");
  saveState();
  rebuildQueue();
  render();
});

document.getElementById("btnExport").addEventListener("click", () => {
  const deck = currentDeck();
  const rows = [["Question", "Answer"], ...deck.cards.map(c => [c.front, c.back])];
  const csv = rows.map(r => r.map(v => `"${v.replace(/"/g, '""')}"`).join(",")).join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  a.download = `${deck.name.toLowerCase().replace(/\s+/g, "-")}.csv`;
  a.click();
});

document.getElementById("csvFileInput").addEventListener("change", e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    const lines = ev.target.result.split(/\r?\n/).slice(1);
    const deck = currentDeck();
    lines.forEach(line => {
      if (!line.trim()) return;
      const cols = line.split(",");
      if (cols.length >= 2) {
        deck.cards.push({
          id: `c-${Date.now()}-${Math.random()}`,
          front: cols[0].replace(/^"|"$/g, "").trim(),
          back: cols.slice(1).join(",").replace(/^"|"$/g, "").trim(),
          ef: 2.5,
          interval: 0,
          reps: 0,
          due: utcToday(0)
        });
      }
    });
    saveState();
    rebuildQueue();
    render();
  };
  reader.readAsText(file);
});

rebuildQueue();
render();
