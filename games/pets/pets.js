const N = 8;
const COLORS = {
  blue:   ["#5fb4ff", "#1565c0"],
  red:    ["#ff7a7a", "#c62828"],
  green:  ["#6fdc7a", "#2e7d32"],
  yellow: ["#ffe066", "#f9a825"],
  purple: ["#c58bff", "#6a1b9a"]
};
const COLOR_IDS = Object.keys(COLORS);
const PETS = [
  { name: "Bubbles", color: "blue", ears: "round" },
  { name: "Blaze", color: "red", ears: "pointy" }
];
const MAX_HP = 100;

const $ = id => document.getElementById(id);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const board = $("board");

let grid, turn = 0, busy = false, selected = null, nextId = 0, gameOver = true;
let hp = [MAX_HP, MAX_HP];

// ---------- pet drawing ----------
function petSVG(p) {
  const [light, dark] = COLORS[p.color];
  const ears = p.ears === "pointy"
    ? `<path d="M26 44L30 12L52 34Z" fill="${dark}"/><path d="M94 44L90 12L68 34Z" fill="${dark}"/><path d="M32 38L33 22L44 33Z" fill="#ffc9c9"/><path d="M88 38L87 22L76 33Z" fill="#ffc9c9"/>`
    : `<circle cx="32" cy="30" r="15" fill="${dark}"/><circle cx="88" cy="30" r="15" fill="${dark}"/><circle cx="32" cy="30" r="8" fill="#cfe9ff"/><circle cx="88" cy="30" r="8" fill="#cfe9ff"/>`;
  const extra = p.ears === "pointy"
    ? `<path d="M60 8C52 18 56 24 60 26C64 24 68 18 60 8Z" fill="#ffb300"/>`
    : `<circle cx="60" cy="12" r="6" fill="#fff" opacity=".7"/>`;
  return `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${p.name}">
    ${ears}${extra}
    <ellipse cx="60" cy="98" rx="30" ry="18" fill="${dark}"/>
    <circle cx="60" cy="62" r="40" fill="${light}"/>
    <ellipse cx="46" cy="44" rx="14" ry="7" fill="#fff" opacity=".28" transform="rotate(-25 46 44)"/>
    <circle cx="44" cy="62" r="8" fill="#fff"/><circle cx="76" cy="62" r="8" fill="#fff"/>
    <circle cx="46" cy="63" r="4.5" fill="#1b1b2f"/><circle cx="78" cy="63" r="4.5" fill="#1b1b2f"/>
    <circle cx="47.5" cy="61" r="1.6" fill="#fff"/><circle cx="79.5" cy="61" r="1.6" fill="#fff"/>
    <ellipse cx="32" cy="76" rx="7" ry="4.5" fill="#ff8a9b" opacity=".7"/><ellipse cx="88" cy="76" rx="7" ry="4.5" fill="#ff8a9b" opacity=".7"/>
    <path d="M52 80Q60 88 68 80" stroke="#1b1b2f" stroke-width="3" fill="none" stroke-linecap="round"/>
    <path d="M57 73h6l-3 4z" fill="#1b1b2f"/>
  </svg>`;
}

function buildPanels() {
  PETS.forEach((p, i) => {
    $("panel-" + i).innerHTML =
      `<div class="who">P${i + 1}</div>
       <div class="pet" id="pet-${i}">${petSVG(p)}</div>
       <div class="pname">${p.name}</div>
       <div class="swatch"><i style="background:${COLORS[p.color][0]}"></i>${p.color} blocks hurt</div>
       <div class="hpbar"><span id="hp-${i}"></span></div>
       <div class="hptext" id="hptext-${i}"></div>`;
  });
}

function updateHP() {
  PETS.forEach((_, i) => {
    $("hp-" + i).style.width = Math.max(0, hp[i]) + "%";
    $("hptext-" + i).textContent = Math.max(0, hp[i]) + " / " + MAX_HP + " HP";
  });
}
function updateTurn() {
  $("turn").textContent = gameOver ? "" : "P" + (turn + 1) + "'s turn · " + PETS[turn].name;
  $("turn").dataset.p = turn;
  [0, 1].forEach(i => $("panel-" + i).classList.toggle("active", !gameOver && i === turn));
}

// ---------- board ----------
const randColor = () => COLOR_IDS[Math.floor(Math.random() * COLOR_IDS.length)];

function makeTile(r, c, color) {
  const t = { id: nextId++, color, r, c, el: document.createElement("div") };
  t.el.className = "tile";
  t.el.innerHTML = `<i style="--a:${COLORS[color][0]};--b:${COLORS[color][1]}"></i>`;
  t.el.dataset.id = t.id;
  place(t);
  board.append(t.el);
  return t;
}
function place(t) { t.el.style.transform = `translate(${t.c * 100}%, ${t.r * 100}%)`; }

function newBoard() {
  board.replaceChildren();
  grid = Array.from({ length: N }, () => Array(N).fill(null));
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
    let col;
    do { col = randColor(); } while (
      (c >= 2 && grid[r][c - 1].color === col && grid[r][c - 2].color === col) ||
      (r >= 2 && grid[r - 1][c].color === col && grid[r - 2][c].color === col));
    grid[r][c] = makeTile(r, c, col);
  }
  if (!hasMoves()) newBoard();
}

function findRuns() {
  const runs = [];
  for (let r = 0; r < N; r++) {
    let c = 0;
    while (c < N) {
      let e = c;
      while (e + 1 < N && grid[r][e + 1] && grid[r][c] && grid[r][e + 1].color === grid[r][c].color) e++;
      if (grid[r][c] && e - c >= 2) runs.push({ color: grid[r][c].color, cells: Array.from({ length: e - c + 1 }, (_, k) => grid[r][c + k]) });
      c = e + 1;
    }
  }
  for (let c = 0; c < N; c++) {
    let r = 0;
    while (r < N) {
      let e = r;
      while (e + 1 < N && grid[e + 1][c] && grid[r][c] && grid[e + 1][c].color === grid[r][c].color) e++;
      if (grid[r][c] && e - r >= 2) runs.push({ color: grid[r][c].color, cells: Array.from({ length: e - r + 1 }, (_, k) => grid[r + k][c]) });
      r = e + 1;
    }
  }
  return runs;
}

function swapCells(a, b) {
  grid[a.r][a.c] = b; grid[b.r][b.c] = a;
  [a.r, b.r] = [b.r, a.r]; [a.c, b.c] = [b.c, a.c];
  place(a); place(b);
}

function hasMoves() {
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
    for (const [dr, dc] of [[0, 1], [1, 0]]) {
      const r2 = r + dr, c2 = c + dc;
      if (r2 >= N || c2 >= N) continue;
      const a = grid[r][c], b = grid[r2][c2];
      grid[r][c] = b; grid[r2][c2] = a;
      const ok = lineAt(r, c) || lineAt(r2, c2);
      grid[r][c] = a; grid[r2][c2] = b;
      if (ok) return true;
    }
  }
  return false;
}
function lineAt(r, c) {
  const col = grid[r][c].color;
  let h = 1, v = 1;
  for (let k = c - 1; k >= 0 && grid[r][k].color === col; k--) h++;
  for (let k = c + 1; k < N && grid[r][k].color === col; k++) h++;
  for (let k = r - 1; k >= 0 && grid[k][c].color === col; k--) v++;
  for (let k = r + 1; k < N && grid[k][c].color === col; k++) v++;
  return h >= 3 || v >= 3;
}

async function reshuffle() {
  $("hint").textContent = "No moves left. Shuffling!";
  const tiles = grid.flat();
  do {
    const colors = tiles.map(t => t.color).sort(() => Math.random() - 0.5);
    tiles.forEach((t, i) => { t.color = colors[i]; t.el.firstChild.style.cssText = `--a:${COLORS[t.color][0]};--b:${COLORS[t.color][1]}`; });
  } while (findRuns().length || !hasMoves());
  await sleep(500);
}

// ---------- turn resolution ----------
function showDamage(target, amount) {
  const el = document.createElement("div");
  el.className = "float";
  el.textContent = "-" + amount;
  $("pet-" + target).append(el);
  setTimeout(() => el.remove(), 1000);
}

async function attack(from, amount) {
  const to = 1 - from;
  hp[to] -= amount;
  const a = $("pet-" + from), b = $("pet-" + to);
  a.classList.add("lunge");
  await sleep(180);
  b.classList.add("hit");
  showDamage(to, amount);
  updateHP();
  await sleep(380);
  a.classList.remove("lunge"); b.classList.remove("hit");
}

async function resolve() {
  const color = PETS[turn].color;
  let chain = 0, total = 0;
  for (;;) {
    const runs = findRuns();
    if (!runs.length) break;
    chain++;
    let dmg = 0;
    const kill = new Set();
    runs.forEach(run => {
      run.cells.forEach(t => kill.add(t));
      if (run.color === color) {
        const n = run.cells.length;
        dmg += n * 5 + (n === 4 ? 10 : n >= 5 ? 25 : 0);
      }
    });
    dmg = Math.round(dmg * (1 + 0.5 * (chain - 1)));
    kill.forEach(t => t.el.classList.add("pop"));
    await sleep(260);
    kill.forEach(t => { grid[t.r][t.c] = null; t.el.remove(); });
    if (dmg > 0) { total += dmg; attack(turn, dmg); }
    await gravity();
    if (hp[1 - turn] <= 0) break;
  }
  return total;
}

async function gravity() {
  for (let c = 0; c < N; c++) {
    let write = N - 1;
    for (let r = N - 1; r >= 0; r--) {
      const t = grid[r][c];
      if (t) { if (r !== write) { grid[write][c] = t; grid[r][c] = null; t.r = write; place(t); } write--; }
    }
    for (let r = write; r >= 0; r--) {
      const t = makeTile(-1 - (write - r), c, randColor());
      t.el.style.transition = "none";
      place(t);
      void t.el.offsetWidth;
      t.el.style.transition = "";
      grid[r][c] = t; t.r = r; place(t);
    }
  }
  await sleep(300);
}

async function trySwap(a, b) {
  if (busy || gameOver) return;
  busy = true;
  clearSelection();
  $("hint").textContent = "";
  swapCells(a, b);
  await sleep(220);
  if (!findRuns().length) {
    swapCells(a, b);
    a.el.classList.add("nope"); b.el.classList.add("nope");
    await sleep(250);
    a.el.classList.remove("nope"); b.el.classList.remove("nope");
    $("hint").textContent = "That swap makes no match. Try another.";
    busy = false;
    return;
  }
  const total = await resolve();
  await sleep(350);
  if (hp[1 - turn] <= 0) return finish(turn);
  $("hint").textContent = total > 0 ? "" : "No " + PETS[turn].color + " match, so no damage!";
  if (!hasMoves()) await reshuffle();
  turn = 1 - turn;
  updateTurn();
  busy = false;
}

// ---------- input ----------
function clearSelection() {
  if (selected) selected.el.classList.remove("sel");
  selected = null;
}
const adjacent = (a, b) => Math.abs(a.r - b.r) + Math.abs(a.c - b.c) === 1;
const tileOf = e => {
  const el = e.target.closest(".tile");
  if (!el) return null;
  return grid.flat().find(t => t && t.id === +el.dataset.id) || null;
};

let drag = null;
board.addEventListener("pointerdown", e => {
  if (busy || gameOver) return;
  const t = tileOf(e);
  if (!t) return;
  if (selected && selected !== t && adjacent(selected, t)) { trySwap(selected, t); return; }
  clearSelection();
  selected = t;
  t.el.classList.add("sel");
  drag = { x: e.clientX, y: e.clientY, t };
});
board.addEventListener("pointermove", e => {
  if (!drag) return;
  const size = board.clientWidth / N;
  const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
  if (Math.hypot(dx, dy) < size * 0.4) return;
  const horizontal = Math.abs(dx) > Math.abs(dy);
  const r = drag.t.r + (horizontal ? 0 : Math.sign(dy)), c = drag.t.c + (horizontal ? Math.sign(dx) : 0);
  const t = drag.t;
  drag = null;
  if (r >= 0 && r < N && c >= 0 && c < N && grid[r][c]) trySwap(t, grid[r][c]);
});
window.addEventListener("pointerup", () => { drag = null; });

// ---------- game flow ----------
function finish(winner) {
  gameOver = true;
  busy = false;
  updateTurn();
  $("ov-title").textContent = "P" + (winner + 1) + " wins!";
  $("ov-text").textContent = PETS[winner].name + " is the champion. Play again?";
  $("ov-btn").textContent = "Play again";
  $("overlay").hidden = false;
}

function start() {
  hp = [MAX_HP, MAX_HP];
  turn = 0; busy = false; gameOver = false;
  newBoard();
  updateHP(); updateTurn();
  $("hint").textContent = "";
  $("overlay").hidden = true;
}

buildPanels();
updateHP();
newBoard();
$("ov-title").textContent = "Pet Puzzle Battle";
$("ov-text").innerHTML = "Two players share one screen and take turns.<br>Swap two neighbouring blocks to make a line of 3 or more.<br><b>Only your pet's colour hurts the enemy.</b> Other colours do nothing.<br>Bigger lines and chain reactions hit harder!";
$("ov-btn").addEventListener("click", start);
$("btn-restart").addEventListener("click", start);
