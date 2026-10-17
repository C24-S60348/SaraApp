// Online play for Pet Puzzle Battle, using Firebase Realtime Database as the messenger.
// Both phones run the same game. They share a random seed, so the board is identical,
// and only the moves ("swap tile A with tile B") are sent. Data lives under petRooms/<CODE>.
const ONLINE_URL = "https://saraapp-7afca-default-rtdb.asia-southeast1.firebasedatabase.app";
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I to avoid mix-ups
let db = null, roundRef = null, moveCount = 0, pending = {}, pumping = false, offs = [], roundOffs = [];

function dbInit() {
  if (db) return db;
  if (typeof firebase === "undefined") throw new Error("Could not load the online service. Check your internet and reload.");
  firebase.initializeApp({ databaseURL: ONLINE_URL });
  db = firebase.database();
  return db;
}
const makeCode = () => Array.from({ length: 4 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join("");
function hashSeed(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619); return h >>> 0; }
function mulberry32(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

function errNode(msg) { const p = document.createElement("p"); p.className = "err"; p.textContent = msg; return p; }

function onlineMenu() {
  modal("Play online", "Create a room and share the 4-letter code with your friend, or join your friend's room. You each use your own phone or computer.", [
    { label: "Create room", fn: createRoom },
    { label: "Join room", alt: true, fn: () => joinPrompt() },
    { label: "Back", alt: true, fn: showMenu }
  ]);
}

function joinPrompt(msg) {
  const input = document.createElement("input");
  input.className = "code-input"; input.maxLength = 4; input.placeholder = "CODE"; input.autocapitalize = "characters"; input.autocomplete = "off";
  const go = () => joinRoom(input.value.trim().toUpperCase());
  input.addEventListener("keydown", e => { if (e.key === "Enter") go(); });
  modal("Join a room", "Type the 4-letter code your friend sees.", [
    { label: "Join", fn: go }, { label: "Back", alt: true, fn: onlineMenu }
  ], [input, ...(msg ? [errNode(msg)] : [])]);
  input.focus();
}

async function createRoom() {
  try {
    dbInit();
    modal("Creating room…", "One moment.");
    for (let i = 0; i < 8; i++) {
      const code = makeCode();
      const res = await db.ref("petRooms/" + code).transaction(cur => cur === null ? { round: 0, created: firebase.database.ServerValue.TIMESTAMP, p1: { here: true } } : undefined);
      if (res.committed) return enter(code, 0);
    }
    throw new Error("Could not make a free room code. Try again.");
  } catch (e) {
    modal("Oops", e.message, [{ label: "Back", fn: onlineMenu }]);
  }
}

async function joinRoom(code) {
  if (!/^[A-Z0-9]{4}$/.test(code)) return joinPrompt("The code has 4 letters or numbers.");
  try {
    dbInit();
    modal("Joining…", "One moment.");
    const ref = db.ref("petRooms/" + code), snap = await ref.once("value"), room = snap.val();
    if (!room) return joinPrompt("Room " + code + " was not found.");
    if (room.p2 && room.p2.here) return joinPrompt("That room is already full.");
    await ref.child("p2").set({ here: true });
    enter(code, 1);
  } catch (e) {
    modal("Oops", e.message, [{ label: "Back", fn: onlineMenu }]);
  }
}

function listen(ref, event, fn) { ref.on(event, fn); offs.push(() => ref.off(event, fn)); }
function detach() { offs.forEach(f => f()); offs = []; }

const SAVE_KEY = "saraapp-pet-room";
function savedRoom() { try { return JSON.parse(sessionStorage.getItem(SAVE_KEY)); } catch (e) { return null; } }
function saveRoom(v) { try { v ? sessionStorage.setItem(SAVE_KEY, JSON.stringify(v)) : sessionStorage.removeItem(SAVE_KEY); } catch (e) { /* ignore */ } }
function toast(msg) { const t = $("toast"); t.textContent = msg; t.hidden = !msg; }

// Come back to a room after a reload (the game is replayed from the saved moves).
async function rejoinRoom(saved) {
  try {
    dbInit();
    modal("Rejoining…", "One moment.");
    const room = (await db.ref("petRooms/" + saved.code).once("value")).val();
    if (!room) { saveRoom(null); return modal("Room not found", "That room no longer exists.", [{ label: "Back", fn: showMenu }]); }
    enter(saved.code, saved.seat, true);
  } catch (e) {
    modal("Oops", e.message, [{ label: "Back", fn: showMenu }]);
  }
}

function enter(code, seat, rejoin = false) {
  const ref = db.ref("petRooms/" + code);
  online = { code, seat, ref, round: -1, started: false, oppSeen: false, replay: rejoin };
  saveRoom({ code, seat });

  // "here" must be set again every time the phone reconnects (e.g. after switching apps to share the code)
  const meRef = ref.child("p" + (seat + 1) + "/here");
  listen(db.ref(".info/connected"), "value", s => {
    if (s.val() === true) { meRef.onDisconnect().set(false); meRef.set(true); }
  });

  if (rejoin) modal("Rejoined " + code, "Getting back into the game…");
  else if (seat === 0) modal("Room " + code, 'Share this code with your friend:<span class="code">' + code + '</span>Waiting for them to join…', [{ label: "Cancel", alt: true, fn: leaveOnline }]);
  else modal("Joined " + code, "Waiting for the game to start…");

  const ready = () => online.seat === 1 || online.oppSeen; // the guest never has to wait for the host's presence
  listen(ref.child("p" + (seat === 0 ? 2 : 1) + "/here"), "value", s => {
    const here = !!s.val();
    if (here) online.oppSeen = true;
    toast(!here && online.oppSeen ? "Your friend lost connection. Waiting for them…" : "");
    if (online.round >= 0 && ready()) beginRound(online.round);
  });
  listen(ref.child("round"), "value", s => {
    const n = s.val();
    if (n === null || n === online.round) return;
    online.round = n;
    online.started = false;
    if (ready()) beginRound(n);
  });
}

function beginRound(n) {
  if (!online || online.pickRound === n) return;
  online.pickRound = n;
  roundOffs.forEach(f => f()); roundOffs = [];
  roundRef = online.ref.child("rounds/" + n);
  const on = (ref, ev, fn) => { ref.on(ev, fn); roundOffs.push(() => ref.off(ev, fn)); };
  moveCount = 0; pending = {}; pumping = false;
  const seat = online.seat;
  let p1 = null, p2 = null;
  const refresh = () => {
    if (!online || online.round !== n) return;
    if (p1 !== null && p2 !== null) {
      if (online.started) return;
      online.started = true;
      chosen = [PET_LIST[p1], PET_LIST[p2]];
      rng = mulberry32(hashSeed(online.code + ":" + n));
      onMoveHook = sendMove;
      start();
    } else if (p1 === null) {
      if (seat === 0) picker(0, "Pick your pet. Its colour is the block colour you must match.", null, i => roundRef.child("p1pet").set(i));
      else modal("P1 is choosing…", "Your friend is picking a pet first.");
    } else if (seat === 1) {
      picker(1, "P1 picked <b>" + PET_LIST[p1].name + "</b>. Now pick a different pet.", PET_LIST[p1], i => roundRef.child("p2pet").set(i));
    } else modal("P2 is choosing…", "Your friend is picking a pet.");
  };
  on(roundRef.child("p1pet"), "value", s => { p1 = s.val(); refresh(); });
  on(roundRef.child("p2pet"), "value", s => { p2 = s.val(); refresh(); });
  on(roundRef.child("moves"), "child_added", s => {
    const m = s.val();
    if (!m || m.n < moveCount) return; // already applied (e.g. my own move)
    pending[m.n] = m;
    pump();
  });
  refresh();
}

function sendMove(ar, ac, br, bc) {
  const n = moveCount++;
  roundRef.child("moves/" + n).set({ n, by: online.seat, a: [ar, ac], b: [br, bc] });
}

// apply the friend's moves in order, one at a time, after any animation has finished
async function pump() {
  if (pumping) return;
  pumping = true;
  while (online && pending[moveCount]) {
    const m = pending[moveCount];
    while (online && (busy || (gameOver && !online.started))) await sleep(60);
    if (!online || gameOver) break;
    delete pending[moveCount];
    moveCount++;
    SLEEP_SCALE = Object.keys(pending).length > 0 ? 0.12 : 1; // catching up after a reload: run fast
    const a = grid[m.a[0]][m.a[1]], b = grid[m.b[0]][m.b[1]];
    if (a && b) await trySwap(a, b, true);
  }
  SLEEP_SCALE = 1;
  pumping = false;
}

function onlineFinish(winner) {
  const won = winner === online.seat;
  modal(won ? "You win!" : "You lose", chosen[winner].name + " (P" + (winner + 1) + ") is the champion.", [
    { label: "Rematch", fn: rematch }, { label: "Leave", alt: true, fn: leaveOnline }
  ]);
  if (!won) SFX.play("lose");
}

function rematch() {
  modal("Rematch!", "Starting a new round…");
  const cur = online.round;
  online.ref.child("round").transaction(v => v === cur ? cur + 1 : undefined);
}

function leaveOnline() {
  saveRoom(null);
  toast("");
  SLEEP_SCALE = 1;
  if (online) {
    try { online.ref.child("p" + (online.seat + 1) + "/here").set(false); } catch (e) { /* ignore */ }
  }
  detach();
  roundOffs.forEach(f => f()); roundOffs = []; roundRef = null;
  online = null; onMoveHook = null; pending = {};
  showMenu();
}

// phones freeze the page when you switch apps; wake the connection when you come back
document.addEventListener("visibilitychange", () => { if (!document.hidden && db) db.goOnline(); });

showMenu();
