// The computer player for Pet Puzzle Battle: Easy, Medium and Hard.
// It looks at every possible swap on a copy of the board and scores the damage it would do.
//   Easy:   mostly random moves, sometimes the best one.
//   Medium: looks 2 clears ahead, likes power-ups, and sometimes slips up.
//   Hard:   looks 3 clears ahead, loves power-ups, also tries to clear your colour, and avoids leaving you a big move.
const LEVEL_NAMES = { easy: "Easy", medium: "Medium", hard: "Hard" };

function cloneGrid(g) { return g.map(row => row.map(t => t ? { r: t.r, c: t.c, color: t.color, special: t.special } : null)); }

function dropIn(g) { // blocks fall; new blocks are unknown to the computer, so the gaps stay empty
  for (let c = 0; c < N; c++) {
    let write = N - 1;
    for (let r = N - 1; r >= 0; r--) {
      const t = g[r][c];
      if (t) { if (r !== write) { g[write][c] = t; g[r][c] = null; t.r = write; } write--; }
    }
  }
}

// Plays one swap on a copy of the board. Returns null if it is not a legal move.
function evalMove(g, r1, c1, r2, c2, my, opp, depth) {
  const cg = cloneGrid(g), a = cg[r1][c1], b = cg[r2][c2];
  cg[r1][c1] = b; cg[r2][c2] = a;
  [a.r, b.r] = [b.r, a.r]; [a.c, b.c] = [b.c, a.c];
  const special = !!(a.special || b.special);
  if (!runsIn(cg).length && !special) return null;
  let forced = new Map(), swapped = [a, b], chain = 0;
  if (a.special) forced.set(a, b.color);
  if (b.special) forced.set(b, a.color);
  const res = { dmg: 0, enemy: 0, born: 0, fired: 0 };
  for (let d = 0; d < depth; d++) {
    const plan = planStep(cg, my, swapped, forced);
    swapped = []; forced = null;
    if (!plan.runs.length && !plan.fired.length) break;
    chain++;
    res.dmg += Math.round(plan.dmg * (1 + 0.5 * (chain - 1)));
    plan.kill.forEach(t => { if (t.color === opp) res.enemy++; cg[t.r][t.c] = null; });
    plan.born.forEach((type, t) => { t.special = type; res.born += type === "star" ? 22 : 9; });
    res.fired += plan.fired.length;
    dropIn(cg);
  }
  res.grid = cg;
  return res;
}

function eachPair(g, fn) {
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
    if (!g[r][c]) continue;
    if (c + 1 < N && g[r][c + 1]) fn(r, c, r, c + 1);
    if (r + 1 < N && g[r + 1][c]) fn(r, c, r + 1, c);
  }
}

function bestReply(g, my, opp) { // the most damage `my` could do next on this board
  let best = 0;
  eachPair(g, (r, c, r2, c2) => { const e = evalMove(g, r, c, r2, c2, my, opp, 1); if (e && e.dmg > best) best = e.dmg; });
  return best;
}

function chooseMove(level, side) {
  const my = chosen[side].color, opp = chosen[1 - side].color;
  const depth = level === "easy" ? 1 : level === "medium" ? 2 : 3;
  const cands = [];
  eachPair(grid, (r, c, r2, c2) => { const e = evalMove(grid, r, c, r2, c2, my, opp, depth); if (e) cands.push({ r, c, r2, c2, e }); });
  if (!cands.length) return null;
  const pickMax = (list, key) => list.reduce((best, m) => (key(m) > key(best) ? m : best), list[0]);
  const rand = list => list[Math.floor(Math.random() * list.length)];

  if (level === "easy") return Math.random() < 0.15 ? pickMax(cands, m => m.e.dmg + Math.random()) : rand(cands);

  const finishers = cands.filter(m => m.e.dmg >= hp[1 - side]); // a move that wins the game
  if (finishers.length) return pickMax(finishers, m => m.e.dmg);
  if (level === "medium" && Math.random() < 0.12) return rand(cands);

  const hard = level === "hard", noise = hard ? 1.5 : 8;
  cands.forEach(m => { m.score = m.e.dmg + m.e.born * (hard ? 1 : 0.6) + m.e.enemy * (hard ? 0.35 : 0.1) + Math.random() * noise; });
  if (hard) {
    cands.sort((x, y) => y.score - x.score);
    cands.slice(0, 10).forEach(m => { m.score -= 0.7 * bestReply(m.e.grid, opp, my); });
  }
  return pickMax(cands, m => m.score);
}

async function aiMove() {
  const mine = ai;
  if (!mine) return;
  await sleep(700 + Math.random() * 600);
  if (ai !== mine || gameOver || busy || turn !== 1) return;
  const m = chooseMove(mine.level, 1);
  if (!m) return;
  const a = grid[m.r][m.c], b = grid[m.r2][m.c2];
  a.el.classList.add("sel");
  await sleep(380);
  a.el.classList.remove("sel");
  if (ai !== mine || gameOver || busy) return;
  trySwap(a, b, true);
}

function vsComputer() {
  online = null; onMoveHook = null; ai = null; gameOver = true;
  modal("Play the computer", "Pick how smart the computer is. You are P1 and you go first.", [
    { label: "Easy", fn: () => startAi("easy") },
    { label: "Medium", fn: () => startAi("medium") },
    { label: "Hard", fn: () => startAi("hard") },
    { label: "Back", alt: true, fn: showMenu }
  ]);
}

function startAi(level) {
  ai = { level };
  picker(0, "Pick your pet. The computer gets a different one.", null, i => {
    chosen[0] = PET_LIST[i];
    const others = PET_LIST.filter((_, k) => k !== i);
    chosen[1] = others[Math.floor(Math.random() * others.length)];
    start();
  });
}

function aiFinish(winner) {
  const won = winner === 0;
  if (!won) SFX.play("lose");
  modal(won ? "You win!" : "The computer wins", won ? "You beat the " + LEVEL_NAMES[ai.level] + " computer. Try a harder level?" : "The " + LEVEL_NAMES[ai.level] + " computer was too strong this time.", [
    { label: "Rematch", fn: start },
    { label: "Change level", alt: true, fn: vsComputer },
    { label: "Menu", alt: true, fn: showMenu }
  ]);
}
