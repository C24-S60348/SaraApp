// Online play for Zuma Duo using Firebase Realtime Database as the messenger.
// The ROOM CREATOR is the host: their device runs the whole game (P1, left).
// The friend (P2, right) only sends their aim / shoot / switch, and receives snapshots to draw.
// Data lives under zumaRooms/<CODE>.
const ONLINE_URL = "https://saraapp-7afca-default-rtdb.asia-southeast1.firebasedatabase.app";
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const SAVE_KEY = "saraapp-zuma-room";
let db = null, offs = [], roundOffs = [], evRef = null, inRef = null, aimRef = null, evN = 0, inN = 0, snapAcc = 0, lastAim = 0, evReady = false;

function dbInit() {
  if (db) return db;
  if (typeof firebase === "undefined") throw new Error("Could not load the online service. Check your internet and reload.");
  firebase.initializeApp({ databaseURL: ONLINE_URL });
  db = firebase.database();
  return db;
}
const makeCode = () => Array.from({ length: 4 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join("");
function listen(ref, ev, fn, bucket = offs) { ref.on(ev, fn); bucket.push(() => ref.off(ev, fn)); }
function savedRoom() { try { return JSON.parse(sessionStorage.getItem(SAVE_KEY)); } catch (e) { return null; } }
function saveRoom(v) { try { v ? sessionStorage.setItem(SAVE_KEY, JSON.stringify(v)) : sessionStorage.removeItem(SAVE_KEY); } catch (e) { /* ignore */ } }
function toast(msg) { const t = $("toast"); t.textContent = msg; t.hidden = !msg; }

function netModal(title, html, buttons = [], nodes = []) {
  $("net-title").textContent = title;
  $("net-text").innerHTML = html;
  $("net-nodes").replaceChildren(...nodes);
  $("net-btns").replaceChildren(...buttons.map(({ label, fn, alt }) => {
    const b = document.createElement("button");
    b.type = "button"; b.className = "go" + (alt ? " alt" : ""); b.textContent = label;
    b.addEventListener("click", () => { SFX.play("click"); fn(); });
    return b;
  }));
  show("ov-net");
}
const errNode = msg => { const p = document.createElement("p"); p.className = "err"; p.textContent = msg; return p; };

// ---------- menus ----------
function onlineMenu() {
  pickingOnline = false;
  if (state === "play" || state === "intro") return;
  state = "menu";
  const saved = savedRoom();
  netModal("Play online", "One player creates a room (that player is the <b>host</b>: P1 on the left, and picks the level). The friend joins with the 4-letter code and is P2 on the right. Each of you uses your own device.", [
    ...(saved ? [{ label: "Rejoin room " + saved.code, fn: () => rejoinRoom(saved) }] : []),
    { label: "Create room", fn: () => { pickingOnline = true; state = "level"; show("ov-level"); } },
    { label: "Join room", alt: true, fn: () => joinPrompt() },
    { label: "Back", alt: true, fn: toMenu }
  ]);
}

function joinPrompt(msg) {
  const input = document.createElement("input");
  input.className = "code-input"; input.maxLength = 4; input.placeholder = "CODE"; input.autocapitalize = "characters"; input.autocomplete = "off";
  const go = () => joinRoom(input.value.trim().toUpperCase());
  input.addEventListener("keydown", e => { if (e.key === "Enter") go(); });
  netModal("Join a room", "Type the 4-letter code your friend sees.", [{ label: "Join", fn: go }, { label: "Back", alt: true, fn: onlineMenu }], [input, ...(msg ? [errNode(msg)] : [])]);
  input.focus();
}

async function onlineCreate(levelIdx) {
  pickingOnline = false;
  try {
    dbInit();
    netModal("Creating room…", "One moment.");
    for (let i = 0; i < 8; i++) {
      const code = makeCode();
      const res = await db.ref("zumaRooms/" + code).transaction(cur => cur === null ? { round: 0, level: levelIdx, created: firebase.database.ServerValue.TIMESTAMP, p1: { here: true } } : undefined);
      if (res.committed) return enter(code, "host", levelIdx);
    }
    throw new Error("Could not make a free room code. Try again.");
  } catch (e) {
    netModal("Oops", e.message, [{ label: "Back", fn: onlineMenu }]);
  }
}

async function joinRoom(code) {
  if (!/^[A-Z0-9]{4}$/.test(code)) return joinPrompt("The code has 4 letters or numbers.");
  try {
    dbInit();
    netModal("Joining…", "One moment.");
    const ref = db.ref("zumaRooms/" + code), room = (await ref.once("value")).val();
    if (!room) return joinPrompt("Room " + code + " was not found.");
    if (room.p2 && room.p2.here) return joinPrompt("That room is already full.");
    await ref.child("p2").set({ here: true });
    enter(code, "guest", room.level || 0);
  } catch (e) {
    netModal("Oops", e.message, [{ label: "Back", fn: onlineMenu }]);
  }
}

async function rejoinRoom(saved) {
  try {
    dbInit();
    netModal("Rejoining…", "One moment.");
    const room = (await db.ref("zumaRooms/" + saved.code).once("value")).val();
    if (!room) { saveRoom(null); return netModal("Room not found", "That room no longer exists.", [{ label: "Back", fn: onlineMenu }]); }
    enter(saved.code, "guest", room.level || 0, true);
  } catch (e) {
    netModal("Oops", e.message, [{ label: "Back", fn: onlineMenu }]);
  }
}

// ---------- entering a room ----------
function enter(code, role, levelIdx, rejoin = false) {
  const ref = db.ref("zumaRooms/" + code), seat = role === "host" ? 0 : 1;
  online = { code, role, seat, ref, round: 0, level: levelIdx, friendHere: false, friendSeen: false, p2ang: undefined };
  mode = "online";
  setLevel(LEVELS[levelIdx]); // so the lobby shows the chosen level
  if (role === "guest") saveRoom({ code }); // only the friend can rejoin; the host's game lives on the host's device

  const me = ref.child("p" + (seat + 1) + "/here");
  listen(db.ref(".info/connected"), "value", s => { if (s.val() === true) { me.onDisconnect().set(false); me.set(true); } });

  if (role === "host") hostLobby();
  else netModal(rejoin ? "Rejoined " + code : "Joined " + code, "Waiting for the host to start the game…", [{ label: "Leave", alt: true, fn: leaveOnline }]);

  listen(ref.child("p" + (seat === 0 ? 2 : 1) + "/here"), "value", s => {
    const here = !!s.val();
    online.friendHere = here;
    if (here) online.friendSeen = true;
    toast(!here && online.friendSeen ? (role === "host" ? "Your friend lost connection. Waiting for them…" : "The host lost connection. Waiting…") : "");
    if (role === "host" && online.round === 0) hostLobby();
  });

  if (role === "guest") {
    listen(ref.child("round"), "value", s => { const n = s.val(); if (n > 0 && n !== online.round) guestBegin(n); });
    listen(ref.child("snap"), "value", s => { const v = s.val(); if (v && v.r === online.round) applySnap(v); });
    onInput = m => inRef && inRef.child(inN++).set(m);
    onAim = ang => { const t = performance.now(); if (aimRef && t - lastAim > 60) { lastAim = t; aimRef.set({ a: +ang.toFixed(3) }); } };
  } else {
    onEmit = ev => { if (ev.k === "end") online.win = ev.win; evRef && evRef.child(evN++).set(ev); };
    onHostTick = hostTick;
  }
}

function hostLobby() {
  const buttons = [{ label: "Cancel", alt: true, fn: leaveOnline }];
  if (online.friendHere) buttons.unshift({ label: "Start game", fn: hostBegin });
  netModal("Room " + online.code, 'Share this code with your friend:<span class="code">' + online.code + "</span>" +
    (online.friendHere ? "<b>Your friend joined!</b> Press Start when you are both ready." : "Waiting for them to join…") +
    "<br><small>Level: " + LEVELS[online.level].name + "</small>", buttons);
}

// ---------- host ----------
function hostBegin() {
  const n = online.round + 1;
  online.round = n; online.p2ang = undefined; online.win = undefined;
  levelIndex = online.level;
  setLevel(LEVELS[levelIndex]);
  hookHostRound(n);
  startGame("online");
  online.ref.child("rounds/" + (n - 1)).remove();
  online.ref.update({ round: n, level: online.level });
}
function onlineAgain() { hostBegin(); }

function hookHostRound(n) {
  roundOffs.forEach(f => f()); roundOffs = [];
  const base = online.ref.child("rounds/" + n);
  evRef = base.child("events"); evN = 0;
  listen(base.child("inputs"), "child_added", s => {
    const m = s.val(), p2 = shooters[1];
    if (!m || state !== "play") return;
    if (m.k === "shoot") { p2.ang = m.a; online.p2ang = m.a; shoot(p2); }
    else if (m.k === "swap") swapColors(p2);
  }, roundOffs);
  listen(base.child("aim"), "value", s => { const v = s.val(); if (v) online.p2ang = v.a; }, roundOffs);
}

function buildSnap() {
  return {
    r: online.round, st: state, w: online.win === undefined ? null : online.win,
    h: +headD.toFixed(1), sp: spawned, cb: combo, sk: streak, dg: Math.round(danger * 100),
    i: chain.map(b => b.id).join(","), c: chain.map(b => b.color).join(""),
    pr: projectiles.map(p => [Math.round(p.x), Math.round(p.y), Math.round(p.vx), Math.round(p.vy), p.color, shooters.indexOf(p.owner)]),
    s: shooters.map(s => [+s.ang.toFixed(3), s.cur, s.next, s.score])
  };
}
function hostTick(dt) {
  if (!evRef) return;
  snapAcc += dt;
  const every = state === "play" || state === "intro" ? 0.05 : 0.5; // ~20 per second while playing
  if (snapAcc >= every) { snapAcc = 0; online.ref.child("snap").set(buildSnap()); }
}

// ---------- guest ----------
function guestBegin(n) {
  roundOffs.forEach(f => f()); roundOffs = [];
  online.round = n;
  online.ref.child("level").once("value").then(s => {
    online.level = s.val() || 0;
    levelIndex = online.level;
    setLevel(LEVELS[levelIndex]);
    mode = "online";
    resetGame();
    state = "intro"; introT = 0; goT = 0; zoneT = 0;
    show(null);
    SFX.play("intro");
    const base = online.ref.child("rounds/" + n);
    inRef = base.child("inputs"); inN = 0; aimRef = base.child("aim");
    evReady = false;
    listen(base.child("events"), "child_added", s2 => { if (evReady) applyEvent(s2.val()); }, roundOffs);
    base.child("events").once("value").then(() => { evReady = true; }); // skip events that happened before we joined
  });
}

function applyEvent(ev) {
  if (!ev) return;
  switch (ev.k) {
    case "pop": popEffects(ev); break;
    case "time": timeEffects(ev); break;
    case "thud": SFX.play("thud"); sparks(ev.x, ev.y, "#fff", 4); break;
    case "shoot": if (ev.by !== online.seat && shooters[ev.by]) { const s = shooters[ev.by]; s.recoil = 1; s.flash = 1; SFX.play("shoot"); } break;
    case "end": if (state !== "over") showEnd(!!ev.win, ev.a, ev.b); break;
  }
}

function applySnap(s) {
  // state
  if (s.st === "intro" && state !== "intro" && state !== "over") { state = "intro"; introT = 0; goT = 0; }
  else if (s.st === "play" && state !== "play") {
    if (state === "intro") { goT = 0.0001; shake = 9; SFX.play("go"); }
    if (state !== "over") state = "play";
  } else if (s.st === "over" && state !== "over") {
    showEnd(!!s.w, s.s[0][3], s.s[1][3]);
  }
  headD = s.h; spawned = s.sp || 0; combo = s.cb || 0; streak = s.sk || 0; danger = (s.dg || 0) / 100;

  // chain: keep the same ball objects (matched by id) so they slide smoothly
  const ids = s.i ? String(s.i).split(",").map(Number) : [], cols = s.c ? String(s.c) : "";
  const old = new Map(chain.map(b => [b.id, b]));
  const prevProj = projectiles;
  chain = ids.map((id, k) => {
    const color = +cols[k], target = headD - k * S;
    let b = old.get(id);
    if (b) { b.color = color; return b; }
    b = { id, color, d: target, ox: 0, oy: 0 };
    if (k < ids.length - 1) { // a shot ball slid in: start it where the projectile was
      const tp = posAt(target);
      let best = 130 * 130;
      prevProj.forEach(p => { const d2 = (p.x - tp[0]) ** 2 + (p.y - tp[1]) ** 2; if (p.color === color && d2 < best) { best = d2; b.ox = p.x - tp[0]; b.oy = p.y - tp[1]; } });
    }
    return b;
  });

  projectiles = (s.pr || []).map(([x, y, vx, vy, color, by]) => ({ x, y, vx, vy, color, owner: shooters[by] }));
  s.s.forEach(([ang, cur, next, score], i) => {
    const sh = shooters[i];
    sh.score = score;
    if (i !== online.seat) sh.ang = ang;
    if (!(sh.lock && performance.now() < sh.lock)) { sh.cur = cur; sh.next = next; }
  });
}

function guestFrame(dt) {
  time += dt;
  if (state === "intro") introT += dt;
  else if (state === "play" && goT) goT += dt;
  onlineControls(dt);
  shooters.forEach(s => { s.cool = Math.max(0, s.cool - dt); });
  chain.forEach((b, i) => {
    const target = headD - i * S;
    if (b.d < target) b.d = Math.min(target, b.d + CLOSE_SPEED * dt);
    else if (b.d > target) b.d = Math.max(target, b.d - BACK_SPEED * dt);
    const k = Math.exp(-14 * dt); b.ox *= k; b.oy *= k;
  });
  projectiles.forEach(p => { p.x += p.vx * dt; p.y += p.vy * dt; });
  dangerBeep -= dt;
  if (state === "play" && danger > 0.45 && dangerBeep <= 0) { SFX.play("danger"); dangerBeep = 0.65 - danger * 0.3; shake = Math.max(shake, 1.5); }
  updateEffects(dt);
}

// ---------- leaving ----------
function leaveOnline() {
  toast("");
  saveRoom(null);
  if (online) {
    try {
      online.ref.child("p" + (online.seat + 1) + "/here").onDisconnect().cancel();
      if (online.role === "host") online.ref.remove(); // the host's game is over, so remove the room
      else online.ref.child("p2/here").set(false);
    } catch (e) { /* ignore */ }
  }
  offs.forEach(f => f()); offs = [];
  roundOffs.forEach(f => f()); roundOffs = [];
  online = null; mode = "keys"; onEmit = onInput = onAim = onHostTick = null; evRef = inRef = aimRef = null;
  toMenu();
}

// phones freeze the page when you switch apps; wake the connection when you come back
document.addEventListener("visibilitychange", () => { if (!document.hidden && db) db.goOnline(); });
