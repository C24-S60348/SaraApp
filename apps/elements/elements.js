// Elements: a glowing card carousel with a live effect behind the chosen card
// (fire, lotus bloom, sun rays and swirling wind), drawn on a canvas.
const $ = id => document.getElementById(id);
const TAU = Math.PI * 2;

const ELEMENTS = [
  { id: "ember", name: "Ember", sub: "Fire · Energy", desc: "Hot, bright and always moving.", c: [255, 90, 50],
    grad: "linear-gradient(180deg,#ff3f8e 0%,#ff6a3d 45%,#ffc23a 100%)",
    icon: '<path d="M12 3c-1 4-5 6-5 11a5 5 0 0 0 10 0c0-2-1-3-2-4 0 2-1 3-2 3 1-4-1-7-1-10z"/><path d="M5 21l14-2M19 21L5 19"/>' },
  { id: "bloom", name: "Bloom", sub: "Heart · Growth", desc: "Soft petals that open when you look at them.", c: [255, 70, 190],
    grad: "linear-gradient(180deg,#ff49b8 0%,#c13cd8 50%,#ff8fd0 100%)",
    icon: '<circle cx="12" cy="12" r="2.2"/><path d="M12 9.8C10 7 10 4 12 3c2 1 2 4 0 6.800zM14.200 12C17 10 20 10 21 12c-1 2-4 2-6.800 0zM12 14.200C14 17 14 20 12 21c-2-1-2-4 0-6.800zM9.800 12C7 14 4 14 3 12c1-2 4-2 6.800 0z"/>' },
  { id: "solar", name: "Solar", sub: "Sun · Vitality", desc: "A warm burst of light and life.", c: [255, 190, 40],
    grad: "linear-gradient(180deg,#ff9a3c 0%,#ffd45a 50%,#fff2c0 100%)",
    icon: '<circle cx="12" cy="12" r="3.6"/><path d="M12 2.500v3M12 18.500v3M2.500 12h3M18.500 12h3M5.300 5.300l2.100 2.100M16.600 16.600l2.100 2.100M18.700 5.300l-2.100 2.100M7.400 16.600l-2.100 2.100"/>' },
  { id: "breeze", name: "Breeze", sub: "Air · Clarity", desc: "Cool wind that clears your head.", c: [60, 230, 170],
    grad: "linear-gradient(180deg,#27c98f 0%,#7ff0c8 50%,#d8ffe9 100%)",
    icon: '<path d="M3 9h10.500a2.500 2.500 0 1 0-2.500-2.500M3 13h14a2.500 2.500 0 1 1-2.500 2.500M3 17h7"/>' }
];
const SOUND = { ember: "shoot", bloom: "combo", solar: "go", breeze: "whoosh" };
const N = ELEMENTS.length;

let idx = 0, userTouched = false, autoT = 0;
const track = $("track"), stage = $("stage"), canvas = $("fx"), ctx = canvas.getContext("2d");
let W = 0, H = 0, dpr = 1, ph = 210, pw = 110;

// ---------- cards ----------
const cards = ELEMENTS.map((e, i) => {
  const el = document.createElement("div");
  el.className = "card";
  el.style.setProperty("--c", e.c.join(","));
  el.innerHTML = `<div class="fill" style="background:${e.grad}"></div><span class="num">0${i + 1}</span><svg viewBox="0 0 24 24">${e.icon}</svg><b>${e.name}</b><small>${e.sub}</small>`;
  el.addEventListener("click", () => { if (didDrag) return; userTouched = true; if (i === idx) pulse(); else select(i); });
  track.append(el);
  return { el, lastO: null };
});

function offsetOf(i) { return ((i - idx + 2) % N + N) % N - 2; } // -2 .. 1

function layout() {
  cards.forEach((c, i) => {
    const o = offsetOf(i), abs = Math.abs(o);
    const scale = o === 0 ? 1.25 : abs === 1 ? 0.88 : 0.7;
    const gap = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--gap"));
    const opacity = o === 0 ? 1 : abs === 1 ? 0.95 : 0.3;
    const jump = c.lastO !== null && Math.abs(o - c.lastO) > 2; // wrapping around: jump without sliding
    if (jump) c.el.style.transition = "none";
    c.el.style.transform = `translateX(${o * gap}px) scale(${scale})`;
    c.el.style.opacity = opacity;
    c.el.style.zIndex = o === 0 ? 3 : 2 - abs;
    c.el.classList.toggle("on", o === 0);
    if (jump) { void c.el.offsetWidth; c.el.style.transition = ""; }
    c.lastO = o;
  });
  const e = ELEMENTS[idx];
  $("cap-name").textContent = e.name;
  $("cap-desc").textContent = e.desc;
  document.documentElement.style.setProperty("--glow", e.c.join(","));
  stage.style.setProperty("--glow", e.c.join(","));
  $("floor").style.setProperty("--glow", e.c.join(","));
}

function select(i) {
  if (i === idx) return;
  idx = (i + N) % N;
  layout();
  burst(); SFX.play(SOUND[ELEMENTS[idx].id]);
}
const step = d => select(idx + d);

function resize() {
  const r = stage.getBoundingClientRect();
  dpr = Math.min(window.devicePixelRatio || 1, 1.75);
  W = r.width; H = r.height;
  canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
  ph = Math.max(150, Math.min(250, H * 0.36)); pw = ph * 0.52;
  const root = document.documentElement.style;
  root.setProperty("--h", ph + "px"); root.setProperty("--w", pw + "px");
  root.setProperty("--gap", Math.min(pw * 2.35, W * 0.3) + "px");
  layout();
}
window.addEventListener("resize", resize);

// ---------- input ----------
let downX = null, didDrag = false;
stage.addEventListener("pointerdown", e => { downX = e.clientX; didDrag = false; });
window.addEventListener("pointerup", e => {
  if (downX === null) return;
  const dx = e.clientX - downX; downX = null;
  if (Math.abs(dx) > 45) { didDrag = true; userTouched = true; step(dx < 0 ? 1 : -1); setTimeout(() => { didDrag = false; }, 0); }
});
window.addEventListener("keydown", e => {
  if (e.key === "ArrowRight") { userTouched = true; step(1); }
  else if (e.key === "ArrowLeft") { userTouched = true; step(-1); }
  else if (e.key === " " || e.key === "Enter") { userTouched = true; pulse(); e.preventDefault(); }
});
let wheelLock = 0;
stage.addEventListener("wheel", e => {
  const now = performance.now();
  if (now < wheelLock || Math.abs(e.deltaX) + Math.abs(e.deltaY) < 20) return;
  wheelLock = now + 450; userTouched = true; step((e.deltaX || e.deltaY) > 0 ? 1 : -1);
}, { passive: true });

// ---------- effects ----------
const inten = { ember: 0, bloom: 0, solar: 0, breeze: 0 };
let parts = [], sparkles = [], wisps = [], rings = [], pulseT = 0, clock = 0;
const rnd = (a, b) => a + Math.random() * (b - a);

function center() { // centre of the chosen card in canvas pixels
  return [W / 2, H * 0.47];
}
function burst() { const [cx, cy] = center(); const c = ELEMENTS[idx].c; rings.push({ x: cx, y: cy, c, t: 0 }); for (let i = 0; i < 26; i++) sparkles.push(spark(cx + rnd(-pw / 2, pw / 2), cy + rnd(-ph / 2, ph / 2), c, 1.6)); }
function pulse() { pulseT = 1; burst(); SFX.play(SOUND[ELEMENTS[idx].id]); }
function spark(x, y, c, v = 1) { const a = rnd(0, TAU), s = rnd(30, 120) * v; return { x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 30, life: 0, max: rnd(0.7, 1.6), c, r: rnd(1, 2.6) }; }

function fire(dt, k) {
  const [cx, cy] = center(), s = ph / 210, w = pw * 1.25, h = ph * 1.25;
  if (k > 0.02) for (let i = 0, n = Math.round(260 * dt * k * (1 + pulseT)); i < n; i++) {
    parts.push({ x: cx + rnd(-w * 0.42, w * 0.42), y: cy - h * 0.42 + rnd(0, 26 * s), vx: rnd(-14, 14) * s, vy: -rnd(90, 250) * s, life: 0, max: rnd(0.8, 1.5), size: rnd(18, 46) * s, seed: Math.random() * 9 });
    if (Math.random() < 0.25) sparkles.push({ x: cx + rnd(-w * 0.4, w * 0.4), y: cy - h * 0.4, vx: rnd(-30, 30), vy: -rnd(90, 230) * s, life: 0, max: rnd(0.8, 1.8), c: [255, 170, 60], r: rnd(1, 2.4) });
  }
  parts.forEach(p => {
    p.life += dt; p.x += (p.vx + Math.sin(clock * 6 + p.seed) * 22 * s) * dt; p.y += p.vy * dt;
    const t = p.life / p.max; if (t >= 1) return;
    const col = t < 0.3 ? [255, 225, 110] : t < 0.65 ? [255, 120, 30] : [190, 30, 20];
    const a = (1 - t) * 0.5 * k, r = p.size * (1 - t * 0.55);
    const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
    g.addColorStop(0, `rgba(${col},${a})`); g.addColorStop(1, `rgba(${col},0)`);
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, TAU); ctx.fill();
  });
  parts = parts.filter(p => p.life < p.max);
  if (k > 0.02) { // heat glow on top of the card
    const g = ctx.createRadialGradient(cx, cy - h * 0.4, 5, cx, cy - h * 0.4, w * 1.1);
    g.addColorStop(0, `rgba(255,120,40,${0.35 * k})`); g.addColorStop(1, "rgba(255,60,20,0)");
    ctx.fillStyle = g; ctx.fillRect(cx - w * 1.4, cy - h, w * 2.8, h);
  }
}

function lotus(dt, k) {
  if (k < 0.02) return;
  const [cx, cy] = center(), w = pw * 1.25, h = ph * 1.25, bx = cx, by = cy + h * 0.12;
  ctx.save();
  for (let ring = 2; ring >= 0; ring--) {
    const n = 7 + ring * 2, base = h * (0.68 + ring * 0.17) * (0.4 + 0.6 * k);
    for (let i = 0; i < n; i++) {
      const ang = -Math.PI * 0.97 + ((i + 0.5) / n) * Math.PI * 0.94, L = base * (0.93 + 0.07 * Math.sin(clock * 1.6 + i + ring)), pwid = L * 0.36;
      ctx.save(); ctx.translate(bx, by); ctx.rotate(ang + Math.PI / 2);
      const g = ctx.createLinearGradient(0, 0, 0, -L);
      g.addColorStop(0, `rgba(255,50,170,${0.85 * k})`); g.addColorStop(0.65, `rgba(255,110,200,${0.8 * k})`); g.addColorStop(1, `rgba(255,225,245,${0.95 * k})`);
      ctx.shadowColor = "rgba(255,70,190,.9)"; ctx.shadowBlur = 22 * k;
      ctx.fillStyle = g; ctx.strokeStyle = `rgba(255,220,245,${0.8 * k})`; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(pwid, -L * 0.2, pwid * 0.9, -L * 0.8, 0, -L); ctx.bezierCurveTo(-pwid * 0.9, -L * 0.8, -pwid, -L * 0.2, 0, 0); ctx.fill(); ctx.stroke();
      ctx.restore();
    }
  }
  ctx.restore();
  if (Math.random() < 0.6 * k) sparkles.push({ x: cx + rnd(-w * 1.3, w * 1.3), y: cy + rnd(-h * 0.7, h * 0.3), vx: rnd(-8, 8), vy: -rnd(10, 40), life: 0, max: rnd(1.2, 2.4), c: [255, 190, 235], r: rnd(1, 2.8) });
}

function sun(dt, k) {
  if (k < 0.02) return;
  const [cx, cy] = center(), rx = pw * 0.625, ry = ph * 0.625;
  const halo = ctx.createRadialGradient(cx, cy, ph * 0.2, cx, cy, ph * 1.15);
  halo.addColorStop(0, `rgba(255,210,80,${0.55 * k})`); halo.addColorStop(1, "rgba(255,160,30,0)");
  ctx.fillStyle = halo; ctx.fillRect(cx - ph * 1.2, cy - ph * 1.2, ph * 2.4, ph * 2.4);
  const n = 36;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU + clock * 0.12, ca = Math.cos(a), sa = Math.sin(a);
    const edge = 1 / Math.hypot(ca / rx, sa / ry), len = ph * (0.3 + 0.2 * (0.5 + 0.5 * Math.sin(clock * 2.2 + i * 1.9))) * k * (1 + pulseT * 0.5);
    const x0 = cx + ca * edge * 0.98, y0 = cy + sa * edge * 0.98, x1 = x0 + ca * len, y1 = y0 + sa * len;
    const g = ctx.createLinearGradient(x0, y0, x1, y1);
    g.addColorStop(0, `rgba(255,235,150,${0.95 * k})`); g.addColorStop(1, "rgba(255,170,30,0)");
    ctx.strokeStyle = g; ctx.lineWidth = i % 2 ? 2 : 3.5; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
  }
  for (let i = 0; i < 22; i++) { // orbiting sparks
    const a = (i / 22) * TAU - clock * 0.5, r = 1.18 + 0.12 * Math.sin(clock * 2 + i * 3);
    ctx.fillStyle = `rgba(255,225,120,${(0.4 + 0.5 * Math.sin(clock * 3 + i)) * k})`;
    ctx.beginPath(); ctx.arc(cx + Math.cos(a) * rx * r, cy + Math.sin(a) * ry * r, 1.6 + (i % 3), 0, TAU); ctx.fill();
  }
}

function wind(dt, k) {
  if (k < 0.02) return;
  const [cx, cy] = center(), rx = pw * 0.625, h = ph * 1.25;
  const glow = ctx.createRadialGradient(cx, cy, 10, cx, cy, ph * 0.95);
  glow.addColorStop(0, `rgba(60,230,170,${0.25 * k})`); glow.addColorStop(1, "rgba(60,230,170,0)");
  ctx.fillStyle = glow; ctx.fillRect(cx - ph, cy - ph, ph * 2, ph * 2);
  ctx.lineCap = "round";
  for (let j = 0; j < 26; j++) {
    const phase = j * 0.83, rr = 1.12 + (j % 6) * 0.13, speed = 0.9 + (j % 4) * 0.25;
    ctx.beginPath();
    let started = false;
    for (let s = 0; s <= 1; s += 0.04) {
      const ang = phase + clock * speed + s * 2.8;
      const x = cx + (rx * rr + 12 * Math.sin(s * 6 + phase)) * Math.sin(ang), y = cy + h * (0.58 - s * 1.16);
      started ? ctx.lineTo(x, y) : ctx.moveTo(x, y); started = true;
    }
    ctx.strokeStyle = `rgba(150,255,220,${(0.16 + 0.22 * ((j % 5) / 5)) * k})`; ctx.lineWidth = 1 + (j % 3) * 0.6; ctx.stroke();
  }
  if (Math.random() < 0.5 * k) wisps.push({ x: cx + (Math.random() < 0.5 ? -1 : 1) * rnd(rx * 2.5, rx * 5), y: cy + rnd(-h * 0.5, h * 0.5), vx: 0, life: 0, max: rnd(0.8, 1.4), len: rnd(20, 60) });
  wisps.forEach(w => {
    w.life += dt; const dir = w.x < cx ? 1 : -1; w.x += dir * 220 * dt * (1 + pulseT);
    const a = Math.sin((w.life / w.max) * Math.PI) * 0.6 * k;
    const g = ctx.createLinearGradient(w.x, w.y, w.x - dir * w.len, w.y);
    g.addColorStop(0, `rgba(255,255,255,${a})`); g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.strokeStyle = g; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(w.x, w.y); ctx.lineTo(w.x - dir * w.len, w.y); ctx.stroke();
  });
  wisps = wisps.filter(w => w.life < w.max);
}

function extras(dt) {
  sparkles.forEach(p => { p.life += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy -= 10 * dt; });
  sparkles = sparkles.filter(p => p.life < p.max);
  sparkles.forEach(p => {
    const t = p.life / p.max, a = (t < 0.2 ? t / 0.2 : 1 - (t - 0.2) / 0.8) * (0.6 + 0.4 * Math.sin(p.life * 20));
    ctx.fillStyle = `rgba(${p.c},${Math.max(0, a)})`; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.fill();
  });
  rings.forEach(r => { r.t += dt; });
  rings = rings.filter(r => r.t < 0.9);
  rings.forEach(r => {
    const f = r.t / 0.9;
    ctx.strokeStyle = `rgba(${r.c},${(1 - f) * 0.8})`; ctx.lineWidth = 3 * (1 - f) + 1;
    ctx.beginPath(); ctx.ellipse(r.x, r.y, pw * 0.7 + f * pw * 1.6, ph * 0.7 + f * ph * 0.9, 0, 0, TAU); ctx.stroke();
  });
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now; clock += dt;
  pulseT = Math.max(0, pulseT - dt * 2);
  ELEMENTS.forEach((e, i) => { inten[e.id] += ((i === idx ? 1 : 0) - inten[e.id]) * Math.min(1, dt * 4.5); });
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, W, H);
  ctx.globalCompositeOperation = "lighter";
  fire(dt, inten.ember); lotus(dt, inten.bloom); sun(dt, inten.solar); wind(dt, inten.breeze); extras(dt);
  ctx.globalCompositeOperation = "source-over";
  if (!userTouched) { autoT += dt; if (autoT > 3.6) { autoT = 0; step(1); } }
  requestAnimationFrame(frame);
}

SFX.bindButton($("btn-sound"));
resize();
requestAnimationFrame(frame);
