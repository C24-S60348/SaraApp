const W = 1280, H = 640, R = 17, S = R * 2;
const COLORS = [
  ["#ff8a80", "#c62828"], ["#82b1ff", "#1565c0"], ["#a5e8a0", "#2e7d32"], ["#fff59d", "#f9a825"], ["#ce93d8", "#6a1b9a"]
];
const TOTAL_BALLS = 80;
const BASE_SPEED = 26, RUSH_SPEED = 190, CLOSE_SPEED = 560, BACK_SPEED = 900;

const canvas = document.getElementById("c");
const ctx = canvas.getContext("2d");

// ---------- the curvy path ----------
const WAY = [[620, -50], [620, 70], [850, 105], [905, 250], [700, 318], [425, 268], [335, 395], [520, 495], [750, 478], [815, 365], [655, 385]];
const pts = [], cum = [];
(function buildPath() {
  const P = [WAY[0], ...WAY, WAY[WAY.length - 1]];
  for (let i = 1; i < P.length - 2; i++) {
    const [p0, p1, p2, p3] = [P[i - 1], P[i], P[i + 1], P[i + 2]];
    for (let k = 0; k < 48; k++) {
      const t = k / 48, t2 = t * t, t3 = t2 * t;
      pts.push([0, 1].map(j => 0.5 * ((2 * p1[j]) + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3)));
    }
  }
  pts.push(WAY[WAY.length - 1]);
  cum.push(0);
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
})();
const PATH_LEN = cum[cum.length - 1];

function seg(d) {
  let lo = 0, hi = cum.length - 2;
  while (lo < hi) { const m = (lo + hi + 1) >> 1; if (cum[m] <= d) lo = m; else hi = m - 1; }
  return lo;
}
function posAt(d) {
  if (d <= 0) { const t = tangentAt(0); return [pts[0][0] + t[0] * d, pts[0][1] + t[1] * d]; }
  if (d >= PATH_LEN) return pts[pts.length - 1];
  const i = seg(d), f = (d - cum[i]) / (cum[i + 1] - cum[i] || 1);
  return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * f, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * f];
}
function tangentAt(d) {
  const i = Math.min(Math.max(seg(Math.max(d, 0)), 0), pts.length - 2);
  const dx = pts[i + 1][0] - pts[i][0], dy = pts[i + 1][1] - pts[i][1], l = Math.hypot(dx, dy) || 1;
  return [dx / l, dy / l];
}

// ---------- pre-rendered pictures ----------
function makeLayer() { const c = document.createElement("canvas"); c.width = W; c.height = H; return [c, c.getContext("2d")]; }

const [bgCanvas, bg] = makeLayer();
(function drawBackground() {
  const g = bg.createRadialGradient(W / 2, H / 2, 80, W / 2, H / 2, 760);
  g.addColorStop(0, "#2f7d3a"); g.addColorStop(0.6, "#1d5a2c"); g.addColorStop(1, "#0d2d17");
  bg.fillStyle = g; bg.fillRect(0, 0, W, H);
  // soft leafy blobs
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 70; i++) {
    bg.save(); bg.translate(rnd() * W, rnd() * H); bg.rotate(rnd() * 6.28);
    bg.fillStyle = `rgba(${40 + rnd() * 40 | 0},${120 + rnd() * 60 | 0},${60 + rnd() * 30 | 0},.14)`;
    bg.beginPath(); bg.ellipse(0, 0, 40 + rnd() * 60, 14 + rnd() * 16, 0, 0, 6.28); bg.fill(); bg.restore();
  }
  // the winding path
  const trace = () => { bg.beginPath(); pts.forEach(([x, y], i) => i ? bg.lineTo(x, y) : bg.moveTo(x, y)); };
  bg.lineCap = "round"; bg.lineJoin = "round";
  [[66, "rgba(0,0,0,.28)", 5], [58, "#3b2a20", 0], [52, "#6d4c41", 0], [44, "#a1887f", 0], [37, "#6b4a3d", 0], [31, "#4e342e", 0]].forEach(([w, c, o]) => {
    bg.strokeStyle = c; bg.lineWidth = w; bg.save(); bg.translate(0, o); trace(); bg.stroke(); bg.restore();
  });
  // pebbles along both edges
  let last = -999;
  for (let i = 1; i < pts.length; i++) {
    if (cum[i] - last < 15) continue;
    last = cum[i];
    const t = tangentAt(cum[i]), nx = -t[1], ny = t[0];
    [-1, 1].forEach(sd => {
      const off = sd * (28 + rnd() * 3);
      bg.fillStyle = rnd() > .5 ? "#d7ccc8" : "#efebe9";
      bg.beginPath(); bg.arc(pts[i][0] + nx * off, pts[i][1] + ny * off, 2.2 + rnd() * 1.6, 0, 6.28); bg.fill();
    });
  }
  // little gold dots in the middle of the groove
  bg.fillStyle = "rgba(255,213,79,.35)";
  for (let d = 10; d < PATH_LEN; d += 34) { const p = posAt(d); bg.beginPath(); bg.arc(p[0], p[1], 2, 0, 6.28); bg.fill(); }
  // skull hole
  const [hx, hy] = pts[pts.length - 1];
  const hg = bg.createRadialGradient(hx, hy, 6, hx, hy, 42);
  hg.addColorStop(0, "#000"); hg.addColorStop(0.7, "#1a0d0d"); hg.addColorStop(1, "#4e342e");
  bg.fillStyle = hg; bg.beginPath(); bg.arc(hx, hy, 42, 0, 6.28); bg.fill();
  bg.strokeStyle = "#ffca28"; bg.lineWidth = 5; bg.stroke();
  bg.fillStyle = "#f5f5f5"; bg.beginPath(); bg.arc(hx, hy - 3, 17, 0, 6.28); bg.fill();
  bg.fillRect(hx - 9, hy + 6, 18, 12);
  bg.fillStyle = "#111"; [-7, 7].forEach(o => { bg.beginPath(); bg.arc(hx + o, hy - 4, 4.5, 0, 6.28); bg.fill(); });
  bg.fillRect(hx - 1.5, hy + 3, 3, 4);
  // platforms for both players
  [[150, 320, "P1 · KEYBOARD", "#42a5f5"], [1130, 320, "P2 · MOUSE", "#ef5350"]].forEach(([x, y, label, col]) => {
    const pg = bg.createRadialGradient(x, y, 20, x, y, 112);
    pg.addColorStop(0, "#6aa84f"); pg.addColorStop(1, "#3b7a37");
    bg.fillStyle = pg; bg.beginPath(); bg.arc(x, y, 108, 0, 6.28); bg.fill();
    bg.strokeStyle = col; bg.lineWidth = 5; bg.setLineDash([10, 9]); bg.stroke(); bg.setLineDash([]);
    bg.fillStyle = "rgba(255,255,255,.85)"; bg.font = "bold 15px system-ui,sans-serif"; bg.textAlign = "center";
    bg.fillText(label, x, y + 148);
  });
})();

const sprites = COLORS.map(([a, b]) => {
  const c = document.createElement("canvas"); c.width = c.height = S + 6;
  const x = c.getContext("2d"), m = (S + 6) / 2;
  const g = x.createRadialGradient(m - 5, m - 6, 2, m, m, R);
  g.addColorStop(0, "#fff"); g.addColorStop(0.25, a); g.addColorStop(1, b);
  x.fillStyle = g; x.beginPath(); x.arc(m, m, R, 0, 6.28); x.fill();
  x.strokeStyle = "rgba(0,0,0,.35)"; x.lineWidth = 1.5; x.stroke();
  x.fillStyle = "rgba(255,255,255,.55)"; x.beginPath(); x.ellipse(m - 5, m - 7, 5, 3, -0.6, 0, 6.28); x.fill();
  return c;
});
function drawBall(color, x, y, scale = 1) {
  const s = sprites[color], w = s.width * scale;
  ctx.drawImage(s, x - w / 2, y - w / 2, w, w);
}

// ---------- game state ----------
let chain, headD, spawned, projectiles, shooters, join, combo, state, bursts, time;
const keys = {};
const mouse = { x: 900, y: 320 };

function newShooter(x, y, ang, tint, name) {
  return { x, y, ang, tint, name, cur: 0, next: 0, cool: 0, score: 0 };
}
function chainColors() {
  const set = [...new Set(chain.map(b => b.color))];
  return set.length ? set : COLORS.map((_, i) => i);
}
function pickColor() { const c = chainColors(); return c[Math.floor(Math.random() * c.length)]; }

function start() {
  chain = []; headD = 0; spawned = 0; projectiles = []; join = null; combo = 0; bursts = []; time = 0;
  shooters = [newShooter(150, 320, 0, "#42a5f5", "P1"), newShooter(1130, 320, Math.PI, "#ef5350", "P2")];
  shooters.forEach(s => { s.cur = Math.floor(Math.random() * COLORS.length); s.next = Math.floor(Math.random() * COLORS.length); });
  state = "play";
  document.getElementById("overlay").hidden = true;
}

function spawnBalls() {
  while (spawned < TOTAL_BALLS && headD - chain.length * S >= 0) {
    let color;
    const n = chain.length;
    do { color = Math.floor(Math.random() * COLORS.length); if (n && Math.random() < 0.45) color = chain[n - 1].color; }
    while (n >= 2 && chain[n - 1].color === color && chain[n - 2].color === color);
    chain.push({ color, d: headD - n * S, ox: 0, oy: 0 });
    spawned++;
  }
}

// ---------- shooting ----------
function shoot(s) {
  if (state !== "play" || s.cool > 0) return;
  const speed = 980, muzzle = 52;
  projectiles.push({ x: s.x + Math.cos(s.ang) * muzzle, y: s.y + Math.sin(s.ang) * muzzle, vx: Math.cos(s.ang) * speed, vy: Math.sin(s.ang) * speed, color: s.cur, owner: s });
  s.cur = s.next; s.next = pickColor(); s.cool = 0.28;
}
function swap(s) { if (state === "play") [s.cur, s.next] = [s.next, s.cur]; }

window.addEventListener("keydown", e => {
  if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", " "].includes(e.key)) e.preventDefault();
  if (e.key === "ArrowDown" && !keys.ArrowDown && shooters) swap(shooters[0]);
  keys[e.key] = true;
});
window.addEventListener("keyup", e => { keys[e.key] = false; });
window.addEventListener("blur", () => Object.keys(keys).forEach(k => { keys[k] = false; }));

function toCanvas(e) {
  const r = canvas.getBoundingClientRect();
  return [(e.clientX - r.left) * W / r.width, (e.clientY - r.top) * H / r.height];
}
canvas.addEventListener("pointermove", e => { [mouse.x, mouse.y] = toCanvas(e); });
canvas.addEventListener("pointerdown", e => {
  [mouse.x, mouse.y] = toCanvas(e);
  if (!shooters) return;
  const s = shooters[1];
  if (e.button === 2 || Math.hypot(mouse.x - s.x, mouse.y - s.y) < 34) swap(s);
  else if (e.button === 0) { s.ang = Math.atan2(mouse.y - s.y, mouse.x - s.x); shoot(s); }
});
canvas.addEventListener("contextmenu", e => e.preventDefault());

// ---------- chain logic ----------
function runAround(i) {
  const c = chain[i].color;
  let a = i, b = i;
  while (a > 0 && chain[a - 1].color === c) a--;
  while (b < chain.length - 1 && chain[b + 1].color === c) b++;
  return [a, b];
}
function removeRange(a, b, owner) {
  const count = b - a + 1;
  for (let i = a; i <= b; i++) {
    const p = posAt(chain[i].d);
    bursts.push({ x: p[0] + chain[i].ox, y: p[1] + chain[i].oy, color: chain[i].color, t: 0 });
  }
  owner.score += count * 10 * (1 + combo);
  chain.splice(a, count);
  if (a === 0) headD -= count * S;
  join = a > 0 && a < chain.length ? a : null;
  joinOwner = owner;
}
let joinOwner = null;

function insertShot(p, hitIdx) {
  const ball = chain[hitIdx], bp = posAt(ball.d), t = tangentAt(ball.d);
  const ahead = (p.x - (bp[0] + ball.ox)) * t[0] + (p.y - (bp[1] + ball.oy)) * t[1] > 0;
  const idx = ahead ? hitIdx : hitIdx + 1;
  const target = headD - idx * S, tp = posAt(target);
  chain.splice(idx, 0, { color: p.color, d: target, ox: p.x - tp[0], oy: p.y - tp[1] });
  join = null; combo = 0;
  const [a, b] = runAround(idx);
  if (b - a + 1 >= 3) removeRange(a, b, p.owner);
}

function update(dt) {
  time += dt;
  const [p1, p2] = shooters;
  if (keys.ArrowLeft) p1.ang -= 2.7 * dt;
  if (keys.ArrowRight) p1.ang += 2.7 * dt;
  if (keys.ArrowUp) shoot(p1);
  p2.ang = Math.atan2(mouse.y - p2.y, mouse.x - p2.x);
  shooters.forEach(s => { s.cool = Math.max(0, s.cool - dt); });

  // chain moves
  headD += (spawned < 14 ? RUSH_SPEED : BASE_SPEED) * dt;
  spawnBalls();
  chain.forEach((b, i) => {
    const target = headD - i * S;
    if (b.d < target) b.d = Math.min(target, b.d + CLOSE_SPEED * dt);
    else if (b.d > target) b.d = Math.max(target, b.d - BACK_SPEED * dt);
    const k = Math.exp(-14 * dt); b.ox *= k; b.oy *= k;
  });

  // gap closed? check for a new match where the two halves meet
  if (join !== null) {
    if (join <= 0 || join >= chain.length) { join = null; combo = 0; }
    else if (chain.slice(join).every((b, k) => Math.abs(b.d - (headD - (join + k) * S)) < 0.6)) {
      if (chain[join - 1].color === chain[join].color) {
        const [a, b] = runAround(join);
        if (b - a + 1 >= 3) { combo++; removeRange(a, b, joinOwner); }
        else { join = null; combo = 0; }
      } else { join = null; combo = 0; }
    }
  }

  // shots fly
  for (let k = projectiles.length - 1; k >= 0; k--) {
    const p = projectiles[k];
    p.x += p.vx * dt; p.y += p.vy * dt;
    if (p.x < -60 || p.x > W + 60 || p.y < -60 || p.y > H + 60) { projectiles.splice(k, 1); continue; }
    let hit = -1, best = (R * 1.75) ** 2;
    chain.forEach((b, i) => {
      const bp = posAt(b.d), dx = p.x - (bp[0] + b.ox), dy = p.y - (bp[1] + b.oy), d2 = dx * dx + dy * dy;
      if (d2 < best) { best = d2; hit = i; }
    });
    if (hit >= 0) { projectiles.splice(k, 1); insertShot(p, hit); }
  }
  bursts.forEach(b => { b.t += dt; });
  bursts = bursts.filter(b => b.t < 0.35);

  // win / lose
  if (chain.length && chain[0].d >= PATH_LEN - R) endGame(false);
  else if (spawned >= TOTAL_BALLS && !chain.length) endGame(true);
}

function endGame(win) {
  state = "over";
  const [a, b] = shooters.map(s => s.score);
  document.getElementById("ov-title").textContent = win ? "You cleared the chain!" : "The chain reached the skull!";
  const lead = a === b ? "It is a tie." : (a > b ? "P1 scored more." : "P2 scored more.");
  document.getElementById("ov-body").innerHTML = `<p>${win ? "Great teamwork!" : "Try again together."}</p><p><b style="color:#90caf9">P1: ${a}</b> &nbsp;·&nbsp; <b style="color:#ef9a9a">P2: ${b}</b><br>Team total: ${a + b}<br>${lead}</p>`;
  document.getElementById("ov-btn").textContent = "Play again";
  document.getElementById("overlay").hidden = false;
}

// ---------- drawing ----------
function drawShooter(s, index) {
  ctx.save(); ctx.translate(s.x, s.y);
  // aim guide
  ctx.save(); ctx.rotate(s.ang);
  ctx.strokeStyle = "rgba(255,255,255,.35)"; ctx.lineWidth = 3; ctx.setLineDash([2, 12]); ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(60, 0); ctx.lineTo(420, 0); ctx.stroke(); ctx.setLineDash([]);
  // cannon
  ctx.fillStyle = "#37474f"; ctx.fillRect(10, -13, 46, 26);
  ctx.fillStyle = s.tint; ctx.fillRect(10, -13, 46, 7);
  ctx.beginPath(); ctx.moveTo(56, -16); ctx.lineTo(62, -16); ctx.lineTo(62, 16); ctx.lineTo(56, 16); ctx.fill();
  ctx.restore();
  // body
  const bg2 = ctx.createRadialGradient(-8, -10, 4, 0, 0, 40);
  bg2.addColorStop(0, "#fff"); bg2.addColorStop(0.25, s.tint); bg2.addColorStop(1, "#1b2a33");
  ctx.fillStyle = bg2; ctx.beginPath(); ctx.arc(0, 0, 38, 0, 6.28); ctx.fill();
  ctx.strokeStyle = "rgba(0,0,0,.45)"; ctx.lineWidth = 3; ctx.stroke();
  // loaded + next ball
  ctx.save(); ctx.rotate(s.ang);
  drawBall(s.cur, 62 + 4, 0, 0.9);
  ctx.restore();
  drawBall(s.cur, 0, 0, 1);
  const nx = -Math.cos(s.ang) * 50, ny = -Math.sin(s.ang) * 50;
  ctx.fillStyle = "rgba(0,0,0,.35)"; ctx.beginPath(); ctx.arc(nx, ny, 15, 0, 6.28); ctx.fill();
  drawBall(s.next, nx, ny, 0.7);
  ctx.restore();
}

function draw() {
  ctx.drawImage(bgCanvas, 0, 0);
  // chain (draw from tail to head so the head overlaps)
  for (let i = chain.length - 1; i >= 0; i--) {
    const b = chain[i], p = posAt(b.d);
    drawBall(b.color, p[0] + b.ox, p[1] + b.oy);
  }
  projectiles.forEach(p => drawBall(p.color, p.x, p.y));
  bursts.forEach(b => {
    const f = b.t / 0.35;
    ctx.strokeStyle = `rgba(255,255,255,${1 - f})`; ctx.lineWidth = 4 * (1 - f) + 1;
    ctx.beginPath(); ctx.arc(b.x, b.y, R + f * 22, 0, 6.28); ctx.stroke();
    drawBall(b.color, b.x, b.y, 1 - f);
  });
  shooters.forEach(drawShooter);

  // HUD
  ctx.textBaseline = "middle";
  const [a, b] = shooters;
  ctx.font = "bold 24px system-ui,sans-serif";
  ctx.textAlign = "left"; ctx.fillStyle = "#90caf9"; ctx.fillText("P1  " + a.score, 24, 30);
  ctx.textAlign = "right"; ctx.fillStyle = "#ef9a9a"; ctx.fillText(b.score + "  P2", W - 24, 30);
  ctx.textAlign = "center"; ctx.fillStyle = "#fff"; ctx.font = "bold 20px system-ui,sans-serif";
  ctx.fillText("Team " + (a.score + b.score), W / 2, H - 40);
  const left = TOTAL_BALLS - spawned + chain.length;
  ctx.font = "14px system-ui,sans-serif"; ctx.fillStyle = "rgba(255,255,255,.8)";
  ctx.fillText(left + " balls left", W / 2, H - 18);
  if (combo > 0) { ctx.font = "bold 22px system-ui,sans-serif"; ctx.fillStyle = "#ffe082"; ctx.fillText("Combo x" + (combo + 1) + "!", W / 2, H - 70); }
  ctx.font = "13px system-ui,sans-serif"; ctx.fillStyle = "rgba(255,255,255,.7)";
  ctx.textAlign = "left"; ctx.fillText("← → turn · ↑ shoot · ↓ switch", 24, H - 18);
  ctx.textAlign = "right"; ctx.fillText("mouse aim · click shoot · right click switch", W - 24, H - 18);
}

// ---------- loop ----------
let lastT = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - lastT) / 1000);
  lastT = now;
  if (state === "play") update(dt);
  draw();
  requestAnimationFrame(frame);
}

shooters = [newShooter(150, 320, 0, "#42a5f5", "P1"), newShooter(1130, 320, Math.PI, "#ef5350", "P2")];
chain = []; projectiles = []; bursts = []; headD = 0; spawned = 0; combo = 0; join = null; state = "menu"; time = 0;
document.getElementById("ov-btn").addEventListener("click", () => {
  if (state === "over") location.reload(); else start();
});
document.getElementById("btn-restart").addEventListener("click", () => location.reload());
requestAnimationFrame(frame);
