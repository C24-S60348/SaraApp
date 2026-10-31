// Kuiz Tanam: a planting quiz for two players.
// Local: both players share one screen, side by side (on an upright phone they sit facing each other).
// Online: each player uses their own device. You see your own question on the left and your friend's side on
// the right: their question, whether each answer was right or wrong (never which answer they picked), and their plant growing.
const $ = id => document.getElementById(id);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const QN = 8;                                   // questions per level
const STAGE_TEXT = ["Biji", "Anak pokok", "Membesar", "Hasil"];

let mode = null;        // "local" | "online"
let levelIdx = 0;
let quiz = [];          // [{ q, opts, ans }]
let sides = [];         // one per player
let playing = false;
let net = null;         // online state

// ---------- helpers ----------
function hashSeed(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619); return h >>> 0; }
function mulberry32(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function shuffle(a, rnd) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const fmt = ms => { const s = Math.floor(ms / 1000); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); };

// Same seed -> same question order and same option order for both players.
function buildQuiz(level, rnd) {
  const qs = KUIZ_LEVELS[level].qs.map(([q, ...opts]) => {
    const order = shuffle([0, 1, 2, 3], rnd);
    return { q, opts: order.map(i => opts[i]), ans: order.indexOf(0) };
  });
  return shuffle(qs, rnd);
}

// Correct answers make the plant grow: 0 = seed, 1-3 = sprout, 4-6 = growing, 7-8 = harvest.
const STEPS = [0, 1, 4, 7, 9];
function stageOf(c) { return c >= 7 ? 3 : c >= 4 ? 2 : c >= 1 ? 1 : 0; }
function scaleOf(c) { const st = stageOf(c), lo = STEPS[st], hi = STEPS[st + 1]; return 0.82 + 0.18 * Math.min(1, (c - lo + 1) / (hi - lo)); }

// ---------- pop-up ----------
function modal(title, html, buttons = [], nodes = [], picks = null) {
  $("ov-title").textContent = title;
  $("ov-text").innerHTML = html;
  const pk = $("ov-picks");
  pk.hidden = !picks; pk.replaceChildren(...(picks || []));
  $("ov-extra").replaceChildren(...nodes, ...buttons.map(({ label, fn, alt }) => {
    const b = document.createElement("button");
    b.type = "button"; b.className = "go" + (alt ? " alt" : ""); b.textContent = label;
    b.addEventListener("click", () => { SFX.play("click"); fn(); });
    return b;
  }));
  $("overlay").hidden = false;
}
const hideModal = () => { $("overlay").hidden = true; };
function card(art, title, sub, fn) {
  const b = document.createElement("button");
  b.type = "button"; b.className = "pick";
  b.innerHTML = `<div class="art">${art}</div><b>${esc(title)}</b><span>${esc(sub)}</span>`;
  b.addEventListener("click", () => { SFX.play("click"); fn(); });
  return b;
}
const plantArt = (kind, st, bg) => `<div style="background:${bg};width:100%;height:100%">${plantSVG(kind, st)}</div>`;

function chooseLevel(title, cb, back) {
  modal(title, "Setiap tahap ada " + QN + " soalan.", [{ label: "Kembali", alt: true, fn: back }], [],
    KUIZ_LEVELS.map((L, i) => { const P = PLANTS.find(p => p.kind === L.plant); return card(plantArt(P.kind, 3, P.color), "Tahap " + (i + 1), L.name, () => cb(i)); }));
}
function pickPlant(title, text, cb, back) {
  modal(title, text, back ? [{ label: "Kembali", alt: true, fn: back }] : [], [],
    PLANTS.map((P, i) => card(plantArt(P.kind, 3, P.color), P.name, P.under ? "di dalam tanah" : "di atas tanah", () => cb(i))));
}

// ---------- menus ----------
function showMenu() {
  playing = false;
  modal("Kuiz Tanam", "Dua pemain menjawab <b>" + QN + " soalan</b> tentang menanam. Setiap jawapan betul membuatkan pokok anda membesar.<br>Siapa paling banyak betul menang. Jika sama, yang lebih pantas menang!", [
    { label: "Main di peranti ini", fn: localStart },
    { label: "Main dalam talian", fn: onlineMenu },
    { label: "Kembali ke Tanam Tanam", alt: true, fn: () => { location.href = "index.html"; } }
  ]);
}

function localStart() {
  mode = "local";
  chooseLevel("Pilih tahap", i => {
    levelIdx = i;
    pickPlant("P1: pilih pokok", "Pemain kiri. Pokok ini membesar bila anda menjawab betul.", p0 =>
      pickPlant("P2: pilih pokok", "Pemain kanan. Boleh pilih pokok yang sama.", p1 => beginGame([p0, p1], Math.random), localStart), showMenu);
  }, showMenu);
}

// ---------- the game ----------
function newSide(plant, interactive) { return { plant, qi: 0, correct: 0, res: [], ms: 0, done: false, busy: false, interactive, qStart: 0, chain: Promise.resolve() }; }

async function beginGame(plants, rnd) {
  quiz = buildQuiz(levelIdx, rnd);
  sides = plants.map((p, i) => newSide(p, mode === "local" || i === net.seat));
  $("arena").classList.toggle("local", mode === "local");
  [0, 1].forEach(renderSide);
  hideModal();
  playing = false;
  if (net) (net.pendingOpp || []).splice(0).forEach(m => remoteAnswer(m)); // answers that arrived early
  SFX.play("intro");
  const cnt = $("count");
  cnt.hidden = false;
  for (const t of ["3", "2", "1", "Mula!"]) { cnt.innerHTML = `<span>${t}</span>`; SFX.play(t === "Mula!" ? "go" : "click"); await sleep(t === "Mula!" ? 600 : 800); }
  cnt.hidden = true;
  const now = performance.now();
  sides.forEach(s => { s.qStart = now; });
  playing = true;
}

function renderSide(i) {
  const s = sides[i], el = $("side-" + i), P = PLANTS[s.plant];
  el.className = "side p" + i;
  const tag = mode === "online" ? (i === net.seat ? "Anda" : "Rakan") + " · P" + (i + 1) : "P" + (i + 1);
  el.innerHTML = `<header><span class="tag">${tag}</span><span class="pname">${esc(P.name)}</span><span class="score" id="score-${i}"></span><span class="clock" id="clock-${i}"></span></header>
    <div class="plantrow"><div class="plantbox" id="pbox-${i}" style="background:${P.color}"><div class="plant" id="plant-${i}"></div><div class="mark" id="mark-${i}"></div></div>
      <div><div class="dots" id="dots-${i}">${"<i></i>".repeat(QN)}</div><div class="stagename" id="stage-${i}"></div></div></div>
    <div class="qcard"><small id="qn-${i}"></small><p id="q-${i}"></p></div>
    <div id="body-${i}"></div>`;
  updateSide(i);
}

function updateSide(i) {
  const s = sides[i], P = PLANTS[s.plant], st = stageOf(s.correct);
  const plant = $("plant-" + i);
  if (plant.dataset.st !== String(st)) { plant.innerHTML = plantSVG(P.kind, st); plant.dataset.st = st; }
  plant.style.transform = `scale(${scaleOf(s.correct)})`;
  $("stage-" + i).textContent = STAGE_TEXT[st] + " · " + s.correct + " betul";
  $("score-" + i).textContent = s.correct + " / " + QN;
  [...$("dots-" + i).children].forEach((d, k) => { d.className = k < s.res.length ? (s.res[k] ? "ok" : "no") : k === s.qi && !s.done ? "now" : ""; });
  const body = $("body-" + i);
  if (s.done) {
    $("qn-" + i).textContent = "Selesai";
    $("q-" + i).textContent = s.correct + " daripada " + QN + " betul";
    body.innerHTML = `<div class="donebox">Selesai!</div>`;
    return;
  }
  const Q = quiz[s.qi];
  $("qn-" + i).textContent = "Soalan " + (s.qi + 1) + " / " + QN;
  $("q-" + i).textContent = Q.q;
  if (!s.interactive) { body.innerHTML = `<div class="waitbox">Rakan sedang menjawab…</div>`; return; }
  const keys = mode === "local" ? (i === 0 ? ["1", "2", "3", "4"] : ["7", "8", "9", "0"]) : ["1", "2", "3", "4"];
  body.innerHTML = `<div class="opts">${Q.opts.map((o, k) => `<button class="opt" type="button" data-k="${k}"><kbd>${keys[k]}</kbd>${esc(o)}</button>`).join("")}</div>`;
  body.querySelectorAll(".opt").forEach(b => b.addEventListener("click", () => answer(i, +b.dataset.k)));
}

function answer(i, k) {
  const s = sides[i];
  if (!playing || !s || s.done || s.busy || !s.interactive) return;
  const ok = k === quiz[s.qi].ans, ms = Math.round(performance.now() - s.qStart), qi = s.qi;
  s.busy = true;
  $("body-" + i).querySelectorAll(".opt").forEach(b => { b.disabled = true; });
  if (mode === "online") sendAnswer(qi, ok, ms);
  s.chain = s.chain.then(() => showAnswer(i, ok, ms));
}

// Shows a result on one side: only right or wrong, never which option was picked.
async function showAnswer(i, ok, ms) {
  const s = sides[i];
  s.busy = true;
  s.res.push(ok); s.ms += ms;
  if (ok) s.correct++;
  const mark = $("mark-" + i), box = $("pbox-" + i);
  mark.className = "mark " + (ok ? "ok" : "no"); mark.textContent = ok ? "✓" : "✗";
  void mark.offsetWidth; mark.classList.add("show");
  box.classList.remove("grow", "wilt"); void box.offsetWidth; box.classList.add(ok ? "grow" : "wilt");
  const mine = s.interactive;
  SFX.play(ok ? (mine ? "combo" : "spark") : (mine ? "nope" : "click"), 1);
  updateSide(i);
  await sleep(900);
  s.qi++;
  if (s.qi >= QN) { s.done = true; if (mine && s.correct === QN) SFX.play("win"); }
  s.qStart = performance.now();
  s.busy = false;
  updateSide(i);
  checkEnd();
}

function checkEnd() {
  if (!sides.length || !sides.every(s => s.done) || !playing) return;
  playing = false;
  setTimeout(finishGame, 600);
}

function finishGame() {
  const [a, b] = sides;
  const winner = a.correct !== b.correct ? (a.correct > b.correct ? 0 : 1) : a.ms !== b.ms ? (a.ms < b.ms ? 0 : 1) : -1;
  const name = i => mode === "online" ? (i === net.seat ? "Anda" : "Rakan anda") : "P" + (i + 1);
  const title = winner < 0 ? "Seri!" : mode === "online" ? (winner === net.seat ? "Anda menang!" : "Rakan anda menang") : name(winner) + " menang!";
  SFX.play(winner < 0 || mode === "local" || winner === net.seat ? "win" : "lose");
  const res = sides.map((s, i) => { const P = PLANTS[s.plant]; return `<div class="res${i === winner ? " win" : ""}"><div class="art">${plantArt(P.kind, stageOf(s.correct), P.color)}</div><b>${name(i)}</b><br>${s.correct} / ${QN} betul<br><small>Masa: ${fmt(s.ms)}</small></div>`; }).join("");
  const review = `<details class="review"><summary>Lihat jawapan yang betul</summary><ol>${quiz.map(Q => `<li>${esc(Q.q)}<br><b>${esc(Q.opts[Q.ans])}</b></li>`).join("")}</ol></details>`;
  const why = winner >= 0 && a.correct === b.correct ? "<p>Sama banyak betul, jadi yang lebih pantas menang.</p>" : "";
  const next = levelIdx < KUIZ_LEVELS.length - 1;
  let buttons;
  if (mode === "local") buttons = [
    { label: "Main lagi", fn: () => beginGame([a.plant, b.plant], Math.random) },
    ...(next ? [{ label: "Tahap seterusnya", fn: () => { levelIdx++; beginGame([a.plant, b.plant], Math.random); } }] : []),
    { label: "Menu", alt: true, fn: showMenu }];
  else if (net.role === "host") buttons = [
    { label: "Main lagi", fn: () => hostNext(levelIdx) },
    ...(next ? [{ label: "Tahap seterusnya", fn: () => hostNext(levelIdx + 1) }] : []),
    { label: "Keluar", alt: true, fn: leaveOnline }];
  else buttons = [{ label: "Keluar", alt: true, fn: leaveOnline }];
  const wait = mode === "online" && net.role === "guest" ? "<p><i>Menunggu hos untuk main lagi…</i></p>" : "";
  modal(title, `<div class="results">${res}</div>${why}${wait}${review}`, buttons);
}

// clocks
(function tick() {
  sides.forEach((s, i) => {
    const el = $("clock-" + i);
    if (!el) return;
    if (!s.interactive) { el.textContent = s.done ? fmt(s.ms) : ""; return; }
    el.textContent = fmt(s.ms + (playing && !s.done && !s.busy ? performance.now() - s.qStart : 0));
  });
  requestAnimationFrame(tick);
})();

// keyboard: P1 uses 1 2 3 4, P2 uses 7 8 9 0 (online: 1 2 3 4 for you)
window.addEventListener("keydown", e => {
  if (!playing) return;
  const p1 = "1234".indexOf(e.key), p2 = "7890".indexOf(e.key);
  if (mode === "local") { if (p1 >= 0) answer(0, p1); else if (p2 >= 0) answer(1, p2); }
  else if (mode === "online" && p1 >= 0) answer(net.seat, p1);
});

// =====================================================================
// Online (Firebase Realtime Database). Rooms live under tanamRooms/<CODE>.
// =====================================================================
const ONLINE_URL = "https://saraapp-7afca-default-rtdb.asia-southeast1.firebasedatabase.app";
const ROOT = window.TANAM_ROOT || "tanamRooms";
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
let db = null, offs = [], roundOffs = [];

function dbInit() {
  if (db) return db;
  if (typeof firebase === "undefined") throw new Error("Tidak dapat memuatkan perkhidmatan dalam talian. Semak internet dan muat semula.");
  firebase.initializeApp({ databaseURL: ONLINE_URL });
  db = firebase.database();
  return db;
}
const makeCode = () => Array.from({ length: 4 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join("");
function listen(ref, ev, fn, bucket = offs) { ref.on(ev, fn); bucket.push(() => ref.off(ev, fn)); }
function toast(msg) { const t = $("toast"); t.textContent = msg; t.hidden = !msg; }
const errNode = msg => { const p = document.createElement("p"); p.className = "err"; p.textContent = msg; return p; };

function onlineMenu() {
  modal("Main dalam talian", "Seorang pemain <b>cipta bilik</b> dan memilih tahap. Rakan <b>sertai bilik</b> dengan kod 4 huruf. Setiap pemain guna telefon atau komputer sendiri.", [
    { label: "Cipta bilik", fn: () => chooseLevel("Pilih tahap", createRoom, onlineMenu) },
    { label: "Sertai bilik", fn: () => joinPrompt() },
    { label: "Kembali", alt: true, fn: showMenu }
  ]);
}

function joinPrompt(msg) {
  const input = document.createElement("input");
  input.className = "code-input"; input.maxLength = 4; input.placeholder = "KOD"; input.autocapitalize = "characters"; input.autocomplete = "off";
  const go = () => joinRoom(input.value.trim().toUpperCase());
  input.addEventListener("keydown", e => { if (e.key === "Enter") go(); });
  modal("Sertai bilik", "Taip kod 4 huruf yang rakan anda nampak.", [{ label: "Sertai", fn: go }, { label: "Kembali", alt: true, fn: onlineMenu }], [input, ...(msg ? [errNode(msg)] : [])]);
  input.focus();
}

async function createRoom(level) {
  try {
    dbInit();
    modal("Mencipta bilik…", "Sebentar.");
    for (let i = 0; i < 8; i++) {
      const code = makeCode();
      const res = await db.ref(ROOT + "/" + code).transaction(cur => cur === null ? { round: 0, level, created: firebase.database.ServerValue.TIMESTAMP, p1: { here: true } } : undefined);
      if (res.committed) return enter(code, 0, level);
    }
    throw new Error("Tidak dapat mencari kod bilik yang kosong. Cuba lagi.");
  } catch (e) { modal("Alamak", esc(e.message), [{ label: "Kembali", fn: onlineMenu }]); }
}

async function joinRoom(code) {
  if (!/^[A-Z0-9]{4}$/.test(code)) return joinPrompt("Kod mesti 4 huruf atau nombor.");
  try {
    dbInit();
    modal("Menyertai…", "Sebentar.");
    const ref = db.ref(ROOT + "/" + code), room = (await ref.once("value")).val();
    if (!room) return joinPrompt("Bilik " + code + " tidak dijumpai.");
    if (room.p2 && room.p2.here) return joinPrompt("Bilik itu sudah penuh.");
    await ref.child("p2").set({ here: true });
    enter(code, 1, room.level || 0);
  } catch (e) { modal("Alamak", esc(e.message), [{ label: "Kembali", fn: onlineMenu }]); }
}

function enter(code, seat, level) {
  const ref = db.ref(ROOT + "/" + code);
  net = { code, seat, role: seat === 0 ? "host" : "guest", ref, round: 0, level, friendHere: false, friendSeen: false, myPlant: null, pendingOpp: [] };
  mode = "online";
  const me = ref.child("p" + (seat + 1) + "/here");
  listen(db.ref(".info/connected"), "value", s => { if (s.val() === true) { me.onDisconnect().set(false); me.set(true); } });
  if (seat === 0) hostLobby(); else modal("Bilik " + code, "Anda sudah masuk. Menunggu hos memulakan permainan…", [{ label: "Keluar", alt: true, fn: leaveOnline }]);
  listen(ref.child("p" + (seat === 0 ? 2 : 1) + "/here"), "value", s => {
    const here = !!s.val();
    net.friendHere = here;
    if (here) net.friendSeen = true;
    toast(!here && net.friendSeen ? "Rakan anda terputus sambungan. Menunggu…" : "");
    if (seat === 0 && net.round === 0) hostLobby();
  });
  listen(ref.child("round"), "value", s => { const n = s.val(); if (n > 0 && n !== net.round) beginRound(n); });
}

function hostLobby() {
  const buttons = [{ label: "Batal", alt: true, fn: leaveOnline }];
  if (net.friendHere) buttons.unshift({ label: "Mula", fn: () => hostNext(net.level) });
  modal("Bilik " + net.code, 'Kongsi kod ini dengan rakan anda:<span class="code">' + net.code + "</span>" +
    (net.friendHere ? "<b>Rakan anda sudah masuk!</b> Tekan Mula bila sedia." : "Menunggu rakan anda masuk…") +
    "<br><small>Tahap " + (net.level + 1) + " · " + esc(KUIZ_LEVELS[net.level].name) + "</small>", buttons);
}

function hostNext(level) {
  const n = net.round + 1;
  net.ref.child("rounds/" + (n - 1)).remove();
  net.ref.update({ round: n, level });
}

function beginRound(n) {
  roundOffs.forEach(f => f()); roundOffs = [];
  net.round = n; net.started = false; net.pendingOpp = []; sides = [];
  const mine = "p" + (net.seat + 1), theirs = "p" + (net.seat === 0 ? 2 : 1);
  const base = net.base = net.ref.child("rounds/" + n);
  let oppPlant = null;
  const maybeStart = () => {
    if (net.started || net.round !== n || net.myPlant === null || oppPlant === null) return;
    net.started = true;
    const plants = net.seat === 0 ? [net.myPlant, oppPlant] : [oppPlant, net.myPlant];
    beginGame(plants, mulberry32(hashSeed(net.code + ":" + n)));
  };
  net.ref.child("level").once("value").then(s => {
    levelIdx = s.val() || 0;
    listen(base.child(theirs + "/plant"), "value", s2 => { if (s2.val() !== null) { oppPlant = s2.val(); maybeStart(); } }, roundOffs);
    listen(base.child(theirs + "/a"), "child_added", s2 => { const m = s2.val(); if (m) remoteAnswer(m); }, roundOffs);
    const chosen = i => { net.myPlant = i; base.child(mine + "/plant").set(i); if (oppPlant === null) modal("Menunggu rakan…", "Rakan anda sedang memilih pokok."); maybeStart(); };
    if (net.myPlant !== null) chosen(net.myPlant); // keep the same plant for the next round
    else pickPlant("Pilih pokok anda", "Tahap " + (levelIdx + 1) + " · " + esc(KUIZ_LEVELS[levelIdx].name) + ". Pokok anda membesar bila anda menjawab betul.", chosen);
  });
}

function remoteAnswer(m) {
  const opp = net.seat === 0 ? 1 : 0;
  if (!sides.length) { net.pendingOpp.push(m); return; }
  const s = sides[opp];
  s.chain = s.chain.then(() => showAnswer(opp, !!m.ok, m.ms || 0));
}

function sendAnswer(qi, ok, ms) {
  net.base.child("p" + (net.seat + 1) + "/a/" + qi).set({ ok: ok ? 1 : 0, ms });
}

function leaveOnline() {
  toast("");
  if (net) {
    try {
      net.ref.child("p" + (net.seat + 1) + "/here").onDisconnect().cancel();
      if (net.role === "host") net.ref.remove(); else net.ref.child("p2/here").set(false);
    } catch (e) { /* ignore */ }
  }
  offs.forEach(f => f()); offs = [];
  roundOffs.forEach(f => f()); roundOffs = [];
  net = null; mode = null; sides = []; playing = false;
  [0, 1].forEach(i => { $("side-" + i).innerHTML = ""; });
  showMenu();
}
document.addEventListener("visibilitychange", () => { if (!document.hidden && db) db.goOnline(); });

// ---------- start ----------
SFX.bindButton($("btn-sound"));
$("btn-menu").addEventListener("click", () => { SFX.play("click"); if (net) leaveOnline(); else showMenu(); });
showMenu();
