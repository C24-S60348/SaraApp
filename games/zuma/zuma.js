const W = 1280, H = 640, R = 17, S = R * 2;
const COLORS = [
  ["#ff8a80", "#c62828"], ["#82b1ff", "#1565c0"], ["#a5e8a0", "#2e7d32"], ["#fff59d", "#f9a825"], ["#ce93d8", "#6a1b9a"]
];
let TOTAL_BALLS = 80, baseSpeed = 26;
const RUSH_SPEED = 190, CLOSE_SPEED = 560, BACK_SPEED = 900;

const canvas = document.getElementById("c");
const ctx = canvas.getContext("2d");

// ---------- level paths ----------
function catmull(way) {
  const out = [], P = [way[0], ...way, way[way.length - 1]];
  for (let i = 1; i < P.length - 2; i++) {
    const [p0, p1, p2, p3] = [P[i - 1], P[i], P[i + 1], P[i + 2]];
    for (let k = 0; k < 48; k++) {
      const t = k / 48, t2 = t * t, t3 = t2 * t;
      out.push([0, 1].map(j => 0.5 * ((2 * p1[j]) + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3)));
    }
  }
  out.push(way[way.length - 1]);
  return out;
}

function spiralWay() {
  const out = [[640, -50]], turns = 2.3, r0 = 265, r1 = 66, steps = Math.round(turns * 6.283 / 0.05);
  for (let i = 0; i <= steps; i++) {
    const f = i / steps, th = -Math.PI / 2 + f * turns * 6.283, r = r0 + (r1 - r0) * f;
    out.push([640 + r * Math.cos(th), 320 + r * Math.sin(th)]);
  }
  return out;
}
function switchbackWay() {
  const ys = [80, 200, 320, 440, 560], xL = 340, xR = 940, rr = 60, out = [];
  for (let x = -50; x <= xR; x += 20) out.push([x, ys[0]]);
  for (let i = 0; i < 4; i++) {
    const right = i % 2 === 0, cx = right ? xR : xL, cy = ys[i] + rr;
    for (let a = -90; a <= 90; a += 6) {
      const r = a * Math.PI / 180;
      out.push([cx + (right ? 1 : -1) * rr * Math.cos(r), cy + rr * Math.sin(r)]);
    }
    const to = i === 3 ? 700 : (right ? xL : xR), from = right ? xR : xL, dir = to > from ? 1 : -1;
    for (let x = from; dir > 0 ? x <= to : x >= to; x += 20 * dir) out.push([x, ys[i + 1]]);
  }
  return out;
}
function heartWay() {
  const s = 16, cx = 640, cy = 310, out = [[640, -50]];
  for (let t = 0; t <= 6.283 - 0.9; t += 0.03) {
    out.push([cx + s * 16 * Math.pow(Math.sin(t), 3), cy - s * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t))]);
  }
  return out;
}
function waveWay() {
  const out = [];
  for (let y = -50; y <= 560; y += 6) out.push([640 + 250 * Math.sin((y + 50) / 330 * 6.283), y]);
  return out;
}

const LEVELS = [
  {
    name: "Jungle Snake", desc: "A lazy S-curve. A good warm-up.", way: [[620, -50], [620, 70], [850, 105], [905, 250], [700, 318], [425, 268], [335, 395], [520, 495], [750, 478], [815, 365], [655, 385]],
    balls: 80, speed: 26,
    theme: { bg: ["#2f7d3a", "#1d5a2c", "#0d2d17"], blob: [40, 120, 60], leaf: "rgba(200,255,200,.14)", track: ["#3b2a20", "#6d4c41", "#a1887f", "#6b4a3d", "#4e342e"], pebble: ["#d7ccc8", "#efebe9"], plat: ["#6aa84f", "#3b7a37"] }
  },
  {
    name: "Desert Spiral", desc: "The chain spirals in to the skull. Long and tricky.", way: spiralWay(), dense: true,
    balls: 90, speed: 25,
    theme: { bg: ["#f5d68e", "#d9a85a", "#8a5a2a"], blob: [210, 160, 90], leaf: "rgba(255,240,200,.28)", track: ["#4a3320", "#7a5a3a", "#c9a779", "#8a6a45", "#5d432b"], pebble: ["#fff3d6", "#e8cfa0"], plat: ["#d8b777", "#a98242"] }
  },
  {
    name: "Ice Switchbacks", desc: "Five long sweeps from side to side.", way: switchbackWay(), dense: true,
    balls: 90, speed: 28,
    theme: { bg: ["#d8f1fe", "#8cc9ee", "#2d6fa3"], blob: [150, 205, 240], leaf: "rgba(255,255,255,.55)", track: ["#1f4b6e", "#4b86b4", "#dff2fc", "#8fc0e0", "#4a7fa8"], pebble: ["#ffffff", "#d4ecfa"], plat: ["#bfe3f7", "#7fb6d8"] }
  },
  {
    name: "Candy Heart", desc: "Follow the heart. Sharp turns at the bottom.", way: heartWay(), dense: true,
    balls: 70, speed: 28,
    theme: { bg: ["#ffd9ec", "#f59ac8", "#8f2d6a"], blob: [255, 160, 210], leaf: "rgba(255,230,245,.45)", track: ["#5a1f45", "#9c4a7b", "#f3b8d8", "#c97aa8", "#7a3560"], pebble: ["#fff0f8", "#ffd0e8"], plat: ["#f7b2d6", "#d4709f"] }
  },
  {
    name: "Ocean Waves", desc: "Big waves, and the balls come fast!", way: waveWay(), dense: true,
    balls: 70, speed: 33,
    theme: { bg: ["#27b5d4", "#0c6e9a", "#063a5e"], blob: [60, 190, 220], leaf: "rgba(200,245,255,.3)", track: ["#2d4a3a", "#8d7a52", "#e8d9a8", "#b9a56f", "#7a6a42"], pebble: ["#fff8e1", "#f0e0b0"], plat: ["#4fc3d8", "#1d8bb0"] }
  }
];
LEVELS.forEach(L => {
  const p = L.dense ? L.way : catmull(L.way), c = [0];
  for (let i = 1; i < p.length; i++) c.push(c[i - 1] + Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]));
  L.pts = p; L.cum = c; L.len = c[c.length - 1];
});

let LEVEL = LEVELS[0], pts = LEVEL.pts, cum = LEVEL.cum, PATH_LEN = LEVEL.len;

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
  // look a few points ahead so dense paths give a smooth direction
  const j = Math.min(i + 3, pts.length - 1), k = Math.max(i - 2, 0);
  const dx = pts[j][0] - pts[k][0], dy = pts[j][1] - pts[k][1], l = Math.hypot(dx, dy) || 1;
  return [dx / l, dy / l];
}

// ---------- pre-rendered background for the current level ----------
function makeLayer() { const c = document.createElement("canvas"); c.width = W; c.height = H; return [c, c.getContext("2d")]; }
const [bgCanvas, bg] = makeLayer();

function renderBackground(L) {
  const T = L.theme;
  bg.clearRect(0, 0, W, H);
  const g = bg.createRadialGradient(W / 2, H / 2, 80, W / 2, H / 2, 760);
  g.addColorStop(0, T.bg[0]); g.addColorStop(0.6, T.bg[1]); g.addColorStop(1, T.bg[2]);
  bg.fillStyle = g; bg.fillRect(0, 0, W, H);
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 70; i++) {
    bg.save(); bg.translate(rnd() * W, rnd() * H); bg.rotate(rnd() * 6.28);
    bg.fillStyle = `rgba(${T.blob[0] + rnd() * 30 | 0},${T.blob[1] + rnd() * 30 | 0},${T.blob[2] + rnd() * 30 | 0},.14)`;
    bg.beginPath(); bg.ellipse(0, 0, 40 + rnd() * 60, 14 + rnd() * 16, 0, 0, 6.28); bg.fill(); bg.restore();
  }
  const trace = () => { bg.beginPath(); pts.forEach(([x, y], i) => i ? bg.lineTo(x, y) : bg.moveTo(x, y)); };
  bg.lineCap = "round"; bg.lineJoin = "round";
  [[66, "rgba(0,0,0,.28)", 5], [58, T.track[0], 0], [52, T.track[1], 0], [44, T.track[2], 0], [37, T.track[3], 0], [31, T.track[4], 0]].forEach(([w, c, o]) => {
    bg.strokeStyle = c; bg.lineWidth = w; bg.save(); bg.translate(0, o); trace(); bg.stroke(); bg.restore();
  });
  let last = -999;
  for (let i = 1; i < pts.length; i++) {
    if (cum[i] - last < 15) continue;
    last = cum[i];
    const t = tangentAt(cum[i]), nx = -t[1], ny = t[0];
    [-1, 1].forEach(sd => {
      const off = sd * (28 + rnd() * 3);
      bg.fillStyle = rnd() > .5 ? T.pebble[0] : T.pebble[1];
      bg.beginPath(); bg.arc(pts[i][0] + nx * off, pts[i][1] + ny * off, 2.2 + rnd() * 1.6, 0, 6.28); bg.fill();
    });
  }
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
  [[150, 320, "#42a5f5"], [1130, 320, "#ef5350"]].forEach(([x, y, col]) => {
    const pg = bg.createRadialGradient(x, y, 20, x, y, 112);
    pg.addColorStop(0, T.plat[0]); pg.addColorStop(1, T.plat[1]);
    bg.fillStyle = pg; bg.beginPath(); bg.arc(x, y, 108, 0, 6.28); bg.fill();
    bg.strokeStyle = col; bg.lineWidth = 5; bg.setLineDash([10, 9]); bg.stroke(); bg.setLineDash([]);
  });
}

function setLevel(L) {
  LEVEL = L; pts = L.pts; cum = L.cum; PATH_LEN = L.len;
  TOTAL_BALLS = L.balls; baseSpeed = L.speed;
  renderBackground(L);
}
setLevel(LEVELS[0]);

const sprites = COLORS.map(([a, b]) => {
  // base sprite has a swirl so you can see the ball roll
  const c = document.createElement("canvas"); c.width = c.height = S + 6;
  const x = c.getContext("2d"), m = (S + 6) / 2;
  const g = x.createRadialGradient(m - 4, m - 5, 2, m, m, R);
  g.addColorStop(0, "#fff"); g.addColorStop(0.3, a); g.addColorStop(1, b);
  x.fillStyle = g; x.beginPath(); x.arc(m, m, R, 0, 6.28); x.fill();
  x.strokeStyle = "rgba(255,255,255,.38)"; x.lineWidth = 4; x.lineCap = "round";
  x.beginPath(); x.arc(m, m, R * 0.55, 0.3, 2.3); x.stroke();
  x.strokeStyle = "rgba(0,0,0,.22)"; x.beginPath(); x.arc(m, m, R * 0.55, 3.4, 5.4); x.stroke();
  return c;
});
const gloss = (() => {
  const c = document.createElement("canvas"); c.width = c.height = S + 6;
  const x = c.getContext("2d"), m = (S + 6) / 2;
  const g = x.createRadialGradient(m, m, R * 0.6, m, m, R);
  g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, "rgba(0,0,0,.35)");
  x.fillStyle = g; x.beginPath(); x.arc(m, m, R, 0, 6.28); x.fill();
  x.strokeStyle = "rgba(0,0,0,.4)"; x.lineWidth = 1.5; x.beginPath(); x.arc(m, m, R, 0, 6.28); x.stroke();
  x.fillStyle = "rgba(255,255,255,.7)"; x.beginPath(); x.ellipse(m - 5, m - 7, 5.5, 3.2, -0.6, 0, 6.28); x.fill();
  x.fillStyle = "rgba(255,255,255,.25)"; x.beginPath(); x.ellipse(m + 5, m + 7, 3, 1.6, -0.6, 0, 6.28); x.fill();
  return c;
})();
function drawBall(color, x, y, scale = 1, rot = 0, shadow = false) {
  const s = sprites[color], w = s.width * scale;
  if (shadow) { ctx.fillStyle = "rgba(0,0,0,.28)"; ctx.beginPath(); ctx.ellipse(x + 3, y + 5, R * scale * 0.95, R * scale * 0.8, 0, 0, 6.28); ctx.fill(); }
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  ctx.drawImage(s, -w / 2, -w / 2, w, w);
  ctx.restore();
  ctx.drawImage(gloss, x - w / 2, y - w / 2, w, w);
}

// ---------- game state ----------
// screens: menu -> mode -> intro -> play -> over
let chain, headD, spawned, projectiles, shooters, join, combo, state, bursts, time;
let mode = "keys";          // "keys" = keyboard + mouse, "touch" = touch + touch
let introT = 0, zoneT = 0, goT = 0, shake = 0, danger = 0, dangerBeep = 0, comboBanner = null;
let particles = [], texts = [], joinOwner = null;
const leaves = Array.from({ length: 26 }, () => ({ x: Math.random() * W, y: Math.random() * H, s: 4 + Math.random() * 7, v: 8 + Math.random() * 18, p: Math.random() * 6.28 }));
const keys = {};
const mouse = { x: 900, y: 320 };
const touches = new Map(); // pointerId -> shooter (touch mode)

const $ = id => document.getElementById(id);

function newShooter(x, y, ang, tint, name) {
  return { x, y, ang, tint, name, cur: 0, next: 0, cool: 0, score: 0, recoil: 0, flash: 0, hold: false, aiming: false };
}
function resetShooters() {
  shooters = [newShooter(150, 320, 0, "#42a5f5", "P1"), newShooter(1130, 320, Math.PI, "#ef5350", "P2")];
  shooters.forEach(s => { s.cur = Math.floor(Math.random() * COLORS.length); s.next = Math.floor(Math.random() * COLORS.length); });
}
function resetGame() {
  chain = []; headD = 0; spawned = 0; projectiles = []; join = null; combo = 0; bursts = []; time = 0;
  particles = []; texts = []; comboBanner = null; shake = 0; danger = 0; touches.clear();
  resetShooters();
}
function chainColors() {
  const set = [...new Set(chain.map(b => b.color))];
  return set.length ? set : COLORS.map((_, i) => i);
}
function pickColor() { const c = chainColors(); return c[Math.floor(Math.random() * c.length)]; }

function show(id) {
  ["ov-menu", "ov-level", "ov-mode", "ov-over"].forEach(o => { $(o).hidden = o !== id; });
}
function toMenu() { resetGame(); state = "menu"; show("ov-menu"); }
let levelIndex = 0;
function chooseLevel(i) { levelIndex = i; setLevel(LEVELS[i]); resetGame(); state = "mode"; show("ov-mode"); }
function startGame(m) {
  mode = m;
  resetGame();
  state = "intro"; introT = 0; goT = 0; zoneT = 0;
  show(null);
  SFX.play("intro");
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
  s.cur = s.next; s.next = pickColor(); s.cool = 0.26; s.recoil = 1; s.flash = 1;
  SFX.play("shoot");
}
function swapColors(s) { if (state === "play") { [s.cur, s.next] = [s.next, s.cur]; SFX.play("swapColor"); } }

window.addEventListener("keydown", e => {
  if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", " "].includes(e.key)) e.preventDefault();
  if (e.key === "ArrowDown" && !keys.ArrowDown && mode === "keys" && shooters) swapColors(shooters[0]);
  keys[e.key] = true;
});
window.addEventListener("keyup", e => { keys[e.key] = false; });
window.addEventListener("blur", () => Object.keys(keys).forEach(k => { keys[k] = false; }));

function toCanvas(e) {
  const r = canvas.getBoundingClientRect();
  return [(e.clientX - r.left) * W / r.width, (e.clientY - r.top) * H / r.height];
}
canvas.addEventListener("pointermove", e => {
  const [x, y] = toCanvas(e);
  if (mode === "keys") { mouse.x = x; mouse.y = y; return; }
  const s = touches.get(e.pointerId);
  if (s) s.ang = Math.atan2(y - s.y, x - s.x);
});
canvas.addEventListener("pointerdown", e => {
  if (state !== "play") return;
  const [x, y] = toCanvas(e);
  if (mode === "keys") {
    mouse.x = x; mouse.y = y;
    const s = shooters[1];
    if (e.button === 2 || Math.hypot(x - s.x, y - s.y) < 34) swapColors(s);
    else if (e.button === 0) { s.ang = Math.atan2(mouse.y - s.y, mouse.x - s.x); s.hold = true; shoot(s); }
    return;
  }
  // touch: hold to aim, release to shoot
  const s = shooters[x < W / 2 ? 0 : 1];
  if (Math.hypot(x - s.x, y - s.y) < 46) { swapColors(s); return; }
  if (s.aiming) return; // this player is already aiming with another finger
  canvas.setPointerCapture(e.pointerId);
  touches.set(e.pointerId, s);
  s.aiming = true;
  s.ang = Math.atan2(y - s.y, x - s.x);
  SFX.play("click");
});
const release = (e, fire) => {
  const s = touches.get(e.pointerId);
  if (s) {
    s.aiming = false; touches.delete(e.pointerId);
    if (fire) { const [x, y] = toCanvas(e); s.ang = Math.atan2(y - s.y, x - s.x); shoot(s); }
  }
  if (mode === "keys" && shooters) shooters[1].hold = false;
};
canvas.addEventListener("pointerup", e => release(e, true));
canvas.addEventListener("pointercancel", e => release(e, false));
canvas.addEventListener("contextmenu", e => e.preventDefault());

// ---------- chain logic ----------
function runAround(i) {
  const c = chain[i].color;
  let a = i, b = i;
  while (a > 0 && chain[a - 1].color === c) a--;
  while (b < chain.length - 1 && chain[b + 1].color === c) b++;
  return [a, b];
}

function sparks(x, y, color, n) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * 6.28, v = 80 + Math.random() * 240;
    particles.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 60, life: 0, max: 0.45 + Math.random() * 0.4, color, size: 2 + Math.random() * 3.5 });
  }
}

function removeRange(a, b, owner) {
  const count = b - a + 1;
  let cx = 0, cy = 0;
  for (let i = a; i <= b; i++) {
    const p = posAt(chain[i].d), x = p[0] + chain[i].ox, y = p[1] + chain[i].oy;
    bursts.push({ x, y, color: chain[i].color, t: 0 });
    sparks(x, y, COLORS[chain[i].color][0], 9);
    cx += x / count; cy += y / count;
  }
  const gained = count * 10 * (1 + combo);
  owner.score += gained;
  texts.push({ x: cx, y: cy - 10, text: "+" + gained, t: 0, color: owner.tint === "#42a5f5" ? "#bbdefb" : "#ffcdd2" });
  SFX.play("pop", combo + (count > 3 ? 2 : 0));
  if (count >= 4 || combo > 0) SFX.play("combo", combo);
  if (combo > 0) comboBanner = { text: "COMBO x" + (combo + 1) + "!", t: 0 };
  shake = Math.max(shake, 3 + count * 1.2 + combo * 4);
  chain.splice(a, count);
  if (a === 0) headD -= count * S;
  join = a > 0 && a < chain.length ? a : null;
  joinOwner = owner;
}

function insertShot(p, hitIdx) {
  const ball = chain[hitIdx], bp = posAt(ball.d), t = tangentAt(ball.d);
  const ahead = (p.x - (bp[0] + ball.ox)) * t[0] + (p.y - (bp[1] + ball.oy)) * t[1] > 0;
  const idx = ahead ? hitIdx : hitIdx + 1;
  const target = headD - idx * S, tp = posAt(target);
  chain.splice(idx, 0, { color: p.color, d: target, ox: p.x - tp[0], oy: p.y - tp[1] });
  join = null; combo = 0;
  SFX.play("thud");
  sparks(p.x, p.y, "#fff", 4);
  const [a, b] = runAround(idx);
  if (b - a + 1 >= 3) removeRange(a, b, p.owner);
}

function updateEffects(dt) {
  particles.forEach(p => { p.life += dt; p.vy += 420 * dt; p.x += p.vx * dt; p.y += p.vy * dt; });
  particles = particles.filter(p => p.life < p.max);
  texts.forEach(t => { t.t += dt; });
  texts = texts.filter(t => t.t < 1);
  bursts.forEach(b => { b.t += dt; });
  bursts = bursts.filter(b => b.t < 0.35);
  if (comboBanner) { comboBanner.t += dt; if (comboBanner.t > 1.1) comboBanner = null; }
  shake *= Math.exp(-7 * dt);
  leaves.forEach(l => { l.y += l.v * dt; l.x += Math.sin(time * 0.6 + l.p) * 12 * dt; l.p += dt; if (l.y > H + 20) { l.y = -20; l.x = Math.random() * W; } });
  shooters.forEach(s => { s.recoil = Math.max(0, s.recoil - dt * 6); s.flash = Math.max(0, s.flash - dt * 7); });
}

function moveChain(dt, speed) {
  headD += speed * dt;
  spawnBalls();
  chain.forEach((b, i) => {
    const target = headD - i * S;
    if (b.d < target) b.d = Math.min(target, b.d + CLOSE_SPEED * dt);
    else if (b.d > target) b.d = Math.max(target, b.d - BACK_SPEED * dt);
    const k = Math.exp(-14 * dt); b.ox *= k; b.oy *= k;
  });
}

function update(dt) {
  time += dt;
  const [p1, p2] = shooters;
  if (mode === "keys") {
    if (keys.ArrowLeft) p1.ang -= 2.7 * dt;
    if (keys.ArrowRight) p1.ang += 2.7 * dt;
    if (keys.ArrowUp) shoot(p1);
    p2.ang = Math.atan2(mouse.y - p2.y, mouse.x - p2.x);
  }
  shooters.forEach(s => { s.cool = Math.max(0, s.cool - dt); if (s.hold) shoot(s); });

  moveChain(dt, spawned < 14 ? RUSH_SPEED : baseSpeed);

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

  // danger glow near the skull
  danger = chain.length ? Math.max(0, Math.min(1, 1 - (PATH_LEN - chain[0].d) / 280)) : 0;
  dangerBeep -= dt;
  if (danger > 0.45 && dangerBeep <= 0) { SFX.play("danger"); dangerBeep = 0.65 - danger * 0.3; shake = Math.max(shake, 1.5); }

  if (chain.length && chain[0].d >= PATH_LEN - R) endGame(false);
  else if (spawned >= TOTAL_BALLS && !chain.length) endGame(true);
}

function endGame(win) {
  state = "over";
  shake = win ? 6 : 16;
  SFX.play(win ? "win" : "lose");
  for (let i = 0; i < 70; i++) sparks(W / 2 + (Math.random() - .5) * 600, H / 2 + (Math.random() - .5) * 300, win ? COLORS[i % 5][0] : "#ff8a80", 1);
  const [a, b] = shooters.map(s => s.score);
  $("btn-next").hidden = !(win && levelIndex < LEVELS.length - 1);
  $("over-title").textContent = win ? "You cleared the chain!" : "The chain reached the skull!";
  const lead = a === b ? "It is a tie." : (a > b ? "P1 scored more." : "P2 scored more.");
  $("over-text").innerHTML = `${win ? "Great teamwork!" : "Try again together."}<br><b style="color:#90caf9">P1: ${a}</b> &nbsp;·&nbsp; <b style="color:#ef9a9a">P2: ${b}</b><br>Team total: ${a + b}<br>${lead}`;
  setTimeout(() => { if (state === "over") show("ov-over"); }, 700);
}

// ---------- drawing ----------
function drawShooter(s) {
  ctx.save(); ctx.translate(s.x, s.y);
  const back = s.recoil * 8;
  ctx.save(); ctx.rotate(s.ang);
  ctx.strokeStyle = s.aiming ? "rgba(255,255,255,.9)" : "rgba(255,255,255,.3)"; ctx.lineWidth = s.aiming ? 5 : 3; ctx.setLineDash([2, s.aiming ? 10 : 12]); ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(66, 0); ctx.lineTo(s.aiming ? 700 : 420, 0); ctx.stroke(); ctx.setLineDash([]);
  if (s.aiming) { ctx.strokeStyle = s.tint; ctx.lineWidth = 3; ctx.setLineDash([]); ctx.beginPath(); ctx.arc(0, 0, 50, -0.35, 0.35); ctx.stroke(); }
  ctx.fillStyle = "#37474f"; ctx.fillRect(10 - back, -13, 46, 26);
  ctx.fillStyle = s.tint; ctx.fillRect(10 - back, -13, 46, 7);
  ctx.fillStyle = "#263238"; ctx.fillRect(54 - back, -16, 8, 32);
  if (s.flash > 0) {
    const g = ctx.createRadialGradient(70, 0, 2, 70, 0, 34);
    g.addColorStop(0, `rgba(255,255,255,${s.flash})`); g.addColorStop(0.4, `rgba(255,224,102,${s.flash * 0.7})`); g.addColorStop(1, "rgba(255,224,102,0)");
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(70, 0, 34, 0, 6.28); ctx.fill();
  }
  ctx.restore();
  // body
  const bg2 = ctx.createRadialGradient(-8, -10, 4, 0, 0, 40);
  bg2.addColorStop(0, "#fff"); bg2.addColorStop(0.25, s.tint); bg2.addColorStop(1, "#1b2a33");
  ctx.fillStyle = bg2; ctx.beginPath(); ctx.arc(0, 0, 38, 0, 6.28); ctx.fill();
  ctx.strokeStyle = "rgba(0,0,0,.45)"; ctx.lineWidth = 3; ctx.stroke();
  // frog eyes that follow the aim
  [-15, 15].forEach(ex => {
    ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(ex, -27, 8, 0, 6.28); ctx.fill();
    ctx.fillStyle = "#111"; ctx.beginPath(); ctx.arc(ex + Math.cos(s.ang) * 3, -27 + Math.sin(s.ang) * 3, 4, 0, 6.28); ctx.fill();
  });
  drawBall(s.cur, 0, 4, 1);
  const nx = -Math.cos(s.ang) * 54, ny = -Math.sin(s.ang) * 54;
  ctx.fillStyle = "rgba(0,0,0,.35)"; ctx.beginPath(); ctx.arc(nx, ny, 15, 0, 6.28); ctx.fill();
  drawBall(s.next, nx, ny, 0.7);
  ctx.restore();
}

function drawWorld() {
  ctx.drawImage(bgCanvas, 0, 0);
  // drifting leaves
  ctx.fillStyle = LEVEL.theme.leaf;
  leaves.forEach(l => { ctx.save(); ctx.translate(l.x, l.y); ctx.rotate(l.p); ctx.beginPath(); ctx.ellipse(0, 0, l.s, l.s * 0.45, 0, 0, 6.28); ctx.fill(); ctx.restore(); });

  // skull hole glow when the chain is close
  const [hx, hy] = pts[pts.length - 1];
  if (danger > 0) {
    const pulse = 0.5 + 0.5 * Math.sin(ptime * 9);
    const g = ctx.createRadialGradient(hx, hy, 20, hx, hy, 130);
    g.addColorStop(0, `rgba(255,40,40,${0.55 * danger * (0.6 + pulse * 0.4)})`); g.addColorStop(1, "rgba(255,40,40,0)");
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(hx, hy, 130, 0, 6.28); ctx.fill();
  }

  // chain: shadows first, then balls from tail to head
  chain.forEach(b => { const p = posAt(b.d); ctx.fillStyle = "rgba(0,0,0,.28)"; ctx.beginPath(); ctx.ellipse(p[0] + b.ox + 3, p[1] + b.oy + 5, R * 0.95, R * 0.8, 0, 0, 6.28); ctx.fill(); });
  for (let i = chain.length - 1; i >= 0; i--) {
    const b = chain[i], p = posAt(b.d);
    drawBall(b.color, p[0] + b.ox, p[1] + b.oy, 1, b.d / R);
  }
  projectiles.forEach(p => {
    ctx.strokeStyle = COLORS[p.color][0]; ctx.globalAlpha = 0.35; ctx.lineWidth = R * 1.2; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.vx * 0.035, p.y - p.vy * 0.035); ctx.stroke(); ctx.globalAlpha = 1;
    drawBall(p.color, p.x, p.y, 1, ptime * 10, true);
  });
  bursts.forEach(b => {
    const f = b.t / 0.35;
    ctx.strokeStyle = `rgba(255,255,255,${1 - f})`; ctx.lineWidth = 4 * (1 - f) + 1;
    ctx.beginPath(); ctx.arc(b.x, b.y, R + f * 26, 0, 6.28); ctx.stroke();
    drawBall(b.color, b.x, b.y, 1 - f);
  });
  shooters.forEach(drawShooter);
  particles.forEach(p => {
    const a = 1 - p.life / p.max;
    ctx.globalAlpha = a; ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (0.4 + a * 0.6), 0, 6.28); ctx.fill();
  });
  ctx.globalAlpha = 1;
  texts.forEach(t => {
    ctx.globalAlpha = 1 - t.t; ctx.font = "bold 24px system-ui,sans-serif"; ctx.textAlign = "center"; ctx.fillStyle = t.color;
    ctx.strokeStyle = "rgba(0,0,0,.6)"; ctx.lineWidth = 4; ctx.strokeText(t.text, t.x, t.y - t.t * 40); ctx.fillText(t.text, t.x, t.y - t.t * 40);
  });
  ctx.globalAlpha = 1;
}

function bigText(text, scale, alpha, color = "#fff") {
  ctx.save(); ctx.translate(W / 2, H / 2 - 10); ctx.scale(scale, scale); ctx.globalAlpha = alpha;
  ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.font = "900 88px system-ui,sans-serif";
  ctx.lineWidth = 12; ctx.strokeStyle = "rgba(0,0,0,.55)"; ctx.strokeText(text, 0, 0);
  ctx.fillStyle = color; ctx.fillText(text, 0, 0);
  ctx.restore();
}

function drawZones(alpha) {
  const dot = (x, w, col, label) => {
    ctx.fillStyle = col.replace("1)", ".16)"); ctx.fillRect(x, 0, w, H);
    ctx.strokeStyle = col; ctx.lineWidth = 5; ctx.setLineDash([14, 12]);
    ctx.strokeRect(x + 14, 14, w - 28, H - 28); ctx.setLineDash([]);
    ctx.fillStyle = "#fff"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.font = "800 34px system-ui,sans-serif"; ctx.fillText(label, x + w / 2, H * 0.2);
    ctx.font = "20px system-ui,sans-serif"; ctx.fillText("Hold to aim, release to shoot", x + w / 2, H * 0.2 + 40);
    ctx.fillText("Tap your frog to switch colour", x + w / 2, H * 0.2 + 68);
  };
  ctx.save(); ctx.globalAlpha = alpha;
  dot(0, W / 2, "rgba(66,165,245,1)", "P1 · LEFT SIDE");
  dot(W / 2, W / 2, "rgba(239,83,80,1)", "P2 · RIGHT SIDE");
  ctx.restore();
}

function drawHud() {
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
  ctx.font = "13px system-ui,sans-serif"; ctx.fillStyle = "rgba(255,255,255,.7)";
  ctx.textAlign = "left"; ctx.fillText(mode === "keys" ? "← → turn · ↑ shoot · ↓ switch" : "Hold to aim · release to shoot", 24, H - 18);
  ctx.textAlign = "right"; ctx.fillText(mode === "keys" ? "mouse aim · click shoot · right click switch" : "Hold to aim · release to shoot", W - 24, H - 18);
  ctx.font = "bold 15px system-ui,sans-serif"; ctx.textAlign = "center"; ctx.fillStyle = "rgba(255,255,255,.85)";
  ctx.fillText(mode === "keys" ? "P1 · KEYBOARD" : "P1 · TOUCH", 150, 468);
  ctx.fillText(mode === "keys" ? "P2 · MOUSE" : "P2 · TOUCH", 1130, 468);
  if (comboBanner) {
    const t = comboBanner.t, sc = t < 0.2 ? 0.6 + t * 2 : 1;
    ctx.save(); ctx.translate(W / 2, 100); ctx.scale(sc, sc); ctx.globalAlpha = Math.min(1, (1.1 - t) * 3);
    ctx.font = "900 44px system-ui,sans-serif"; ctx.textAlign = "center"; ctx.lineWidth = 8; ctx.strokeStyle = "rgba(0,0,0,.5)";
    ctx.strokeText(comboBanner.text, 0, 0); ctx.fillStyle = "#ffe082"; ctx.fillText(comboBanner.text, 0, 0); ctx.restore();
  }
}

function draw() {
  ctx.clearRect(0, 0, W, H);
  let zoom = 1;
  if (state === "intro") { const f = Math.min(1, introT / 1.5); zoom = 1 + 0.4 * Math.pow(1 - f, 3); }
  ctx.save();
  const sx = (Math.random() - 0.5) * shake, sy = (Math.random() - 0.5) * shake;
  ctx.translate(W / 2 + sx, H / 2 + sy); ctx.scale(zoom, zoom); ctx.translate(-W / 2, -H / 2);
  drawWorld();
  ctx.restore();

  if (state === "play" || state === "intro" || state === "over") drawHud();
  if (state === "intro") {
    if (introT < 1.1) bigText("READY?", 0.7 + Math.min(1, introT * 3) * 0.3, Math.min(1, (1.1 - introT) * 4));
    else bigText("GO!", 1 + (introT - 1.1) * 0.5, Math.min(1, (1.7 - introT) * 3), "#ffe066");
  } else if (state === "play" && goT < 0.5) bigText("GO!", 1.3 + goT * 0.5, 1 - goT * 2, "#ffe066");
  if (mode === "touch" && (state === "intro" || state === "play") && zoneT < 3.4) drawZones(Math.min(1, (3.4 - zoneT) * 1.2, zoneT * 3 + 0.2));
}

// ---------- loop ----------
let lastT = performance.now(), ptime = 0;
function frame(now) {
  const dt = Math.min(0.05, (now - lastT) / 1000);
  lastT = now; ptime += dt;
  if (state === "intro") {
    introT += dt; zoneT += dt;
    updateEffects(dt);
    if (introT >= 1.7) { state = "play"; goT = 0.0001; shake = 9; SFX.play("go"); }
  } else if (state === "play") {
    zoneT += dt; if (goT) goT += dt;
    update(dt); updateEffects(dt);
  } else if (state === "over") {
    updateEffects(dt);
  } else { // menu / mode: a calm decorative chain
    time += dt;
    if (!chain.length || chain[0].d > PATH_LEN * 0.6) { chain = []; headD = 0; spawned = 0; }
    moveChain(dt, 70);
    updateEffects(dt);
  }
  draw();
  requestAnimationFrame(frame);
}

resetGame();
state = "menu";
function buildLevelCards() {
  const box = $("levels");
  LEVELS.forEach((L, i) => {
    const card = document.createElement("button");
    card.type = "button"; card.className = "level";
    const c = document.createElement("canvas"); c.width = 256; c.height = 128;
    const x = c.getContext("2d"), k = 256 / W;
    const g = x.createLinearGradient(0, 0, 0, 128);
    g.addColorStop(0, L.theme.bg[0]); g.addColorStop(1, L.theme.bg[2]);
    x.fillStyle = g; x.fillRect(0, 0, 256, 128);
    x.lineCap = x.lineJoin = "round";
    [[11, L.theme.track[1]], [8, L.theme.track[2]], [5, L.theme.track[4]]].forEach(([w, col]) => {
      x.strokeStyle = col; x.lineWidth = w; x.beginPath();
      L.pts.forEach(([px, py], j) => j ? x.lineTo(px * k, py * k) : x.moveTo(px * k, py * k)); x.stroke();
    });
    const [hx, hy] = L.pts[L.pts.length - 1];
    x.fillStyle = "#111"; x.strokeStyle = "#ffca28"; x.lineWidth = 2; x.beginPath(); x.arc(hx * k, hy * k, 8, 0, 6.28); x.fill(); x.stroke();
    [[150, "#42a5f5"], [1130, "#ef5350"]].forEach(([px, col]) => { x.fillStyle = col; x.beginPath(); x.arc(px * k, 320 * k, 8, 0, 6.28); x.fill(); });
    card.append(c);
    const t = document.createElement("b"); t.textContent = (i + 1) + ". " + L.name;
    const d = document.createElement("span"); d.textContent = L.desc;
    card.append(t, d);
    card.addEventListener("click", () => { SFX.play("click"); chooseLevel(i); });
    box.append(card);
  });
}
buildLevelCards();

$("btn-play").addEventListener("click", () => { SFX.play("click"); state = "level"; show("ov-level"); });
$("mode-keys").addEventListener("click", () => startGame("keys"));
$("mode-touch").addEventListener("click", () => startGame("touch"));
$("btn-again").addEventListener("click", () => startGame(mode));
$("btn-next").addEventListener("click", () => { chooseLevel(levelIndex + 1); startGame(mode); });
$("btn-levels").addEventListener("click", () => { SFX.play("click"); resetGame(); state = "level"; show("ov-level"); });
$("btn-menu").addEventListener("click", () => { SFX.play("click"); toMenu(); });
SFX.bindButton($("btn-sound"));
requestAnimationFrame(frame);
