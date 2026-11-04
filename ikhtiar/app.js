// App shell: navigation, page switching, pop-ups, theme, water reminder, offline support.
const Views = {};   // page name -> function(args) returning HTML
const Act = {};     // data-act="name"   -> function(el, event)   (clicks)
const Chg = {};     // data-chg="name"   -> function(el, event)   (changes / typing)
const After = {};   // page name -> function() run after the page is drawn

const NAV = [
  { id: "home", label: "Today", icon: "M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" },
  { id: "plan", label: "Plan", icon: "M9 5h10M9 12h10M9 19h10M4 5l1 1 2-2M4 12l1 1 2-2M4 19l1 1 2-2" },
  { id: "labs", label: "Labs", icon: "M9 3h6M10 3v6L5 19a1.500 1.500 0 0 0 1.300 2h11.400A1.500 1.500 0 0 0 19 19l-5-10V3M7.500 15h9" },
  { id: "followups", label: "Follow-ups", icon: "M8 3v3M16 3v3M4 8h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zM9 14l2 2 4-4" },
  { id: "goals", label: "Goals", icon: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 12h.01" },
  { id: "checkin", label: "Check-in", icon: "M12 20h9M16.500 3.500a2.100 2.100 0 0 1 3 3L7 19l-4 1 1-4z" },
  { id: "about", label: "Tawakkal", icon: "M12 21s-7-4.500-7-11a4 4 0 0 1 7-2.600A4 4 0 0 1 19 10c0 6.500-7 11-7 11z" },
  { id: "settings", label: "Settings", icon: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.400 15a1.700 1.700 0 0 0 .3 1.800l.1.1a2 2 0 1 1-2.800 2.800l-.1-.1a1.700 1.700 0 0 0-1.800-.3 1.700 1.700 0 0 0-1 1.500V21a2 2 0 1 1-4 0v-.1a1.700 1.700 0 0 0-1.100-1.500 1.700 1.700 0 0 0-1.800.3l-.1.1a2 2 0 1 1-2.800-2.800l.1-.1a1.700 1.700 0 0 0 .3-1.800 1.700 1.700 0 0 0-1.500-1H3a2 2 0 1 1 0-4h.1a1.700 1.700 0 0 0 1.500-1.100 1.700 1.700 0 0 0-.3-1.800l-.1-.1a2 2 0 1 1 2.800-2.800l.1.1a1.700 1.700 0 0 0 1.800.3H9a1.700 1.700 0 0 0 1-1.500V3a2 2 0 1 1 4 0v.1a1.700 1.700 0 0 0 1 1.500 1.700 1.700 0 0 0 1.800-.3l.1-.1a2 2 0 1 1 2.800 2.800l-.1.1a1.700 1.700 0 0 0-.3 1.800V9a1.700 1.700 0 0 0 1.500 1H21a2 2 0 1 1 0 4h-.1a1.700 1.700 0 0 0-1.500 1z" }
];
const MAIN_TABS = ["home", "plan", "labs", "followups"];
const icon = (d, cls = "ic") => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true"><path d="${d}"/></svg>`;

let route = { page: "home", args: [] };
const view = () => $("#view");

function parseHash() {
  const h = decodeURIComponent(location.hash.replace(/^#\/?/, ""));
  const [page, ...args] = h.split("/");
  return { page: Views[page] ? page : "home", args };
}

function drawNav() {
  const cur = route.page;
  const more = !MAIN_TABS.includes(cur);
  $("#tabs").innerHTML = MAIN_TABS.map(id => { const n = NAV.find(x => x.id === id); return `<a href="#${id}" class="tab${cur === id ? " on" : ""}"${cur === id ? ' aria-current="page"' : ""}>${icon(n.icon)}<span>${n.label}</span></a>`; }).join("") +
    `<button type="button" class="tab${more ? " on" : ""}" data-act="moreMenu" aria-haspopup="dialog">${icon("M5 12h.01M12 12h.01M19 12h.01", "ic dots")}<span>More</span></button>`;
  $("#side").innerHTML = `<div class="side-brand">My Ikhtiar</div>` + NAV.map(n => `<a href="#${n.id}" class="side-link${cur === n.id ? " on" : ""}"${cur === n.id ? ' aria-current="page"' : ""}>${icon(n.icon)}<span>${n.label}</span></a>`).join("");
}

function render(keepScroll = true) {
  const y = window.scrollY;
  route = parseHash();
  drawNav();
  let html;
  try { html = Views[route.page](route.args); }
  catch (e) { console.error(e); html = `<div class="card"><h2>Something went wrong</h2><p>${esc(e.message)}</p></div>`; }
  view().innerHTML = storageBanner() + html;
  if (After[route.page]) After[route.page](route.args);
  if (keepScroll) window.scrollTo(0, y);
}

function go(hash) {
  if (location.hash === hash) render(false);
  else location.hash = hash;
}

window.addEventListener("hashchange", () => { closeSheet(); render(false); window.scrollTo(0, 0); view().focus({ preventScroll: true }); });

// ---- event delegation (one listener for the whole page) ----
document.addEventListener("click", e => {
  const el = e.target.closest("[data-act]");
  if (!el || !Act[el.dataset.act]) return;
  e.preventDefault();
  const r = Act[el.dataset.act](el, e);
  if (r !== false) render();
});
["change", "input"].forEach(type => document.addEventListener(type, e => {
  const el = e.target.closest(type === "change" ? "[data-chg]" : "[data-inp]");
  if (!el) return;
  const fn = Chg[type === "change" ? el.dataset.chg : el.dataset.inp];
  if (!fn) return;
  const r = fn(el, e);
  if (r === true) render();
}));

// ---- saving ----
function commit(sound) {
  const ok = Store.save();
  if (ok && sound) Sound.play(sound);
  return ok;
}
let saveFlashT = 0;
Store.onSave(ok => {
  const s = $("#savestate");
  if (!s) return;
  s.textContent = ok ? "Saved" : "Not saved";
  s.className = "savestate " + (ok ? "ok" : "bad");
  clearTimeout(saveFlashT);
  saveFlashT = setTimeout(() => { s.className = "savestate"; }, 1400);
  if (!ok) toast("Could not save. Your browser storage may be full or blocked. Export a backup from Settings.", "bad", 6000);
});
function storageBanner() {
  const e = Store.error;
  if (!e) return "";
  const msg = {
    unavailable: "This browser is not letting the tracker save (private mode or blocked storage). What you enter will be lost when you close the page.",
    read: "Could not read your saved data. Please reload the page.",
    corrupt: "Your saved data could not be read, so a fresh tracker was started. A copy of the old data was kept. Import a backup from Settings if you have one.",
    write: "Your last change could not be saved. Storage may be full. Please export a backup from Settings."
  }[e];
  return `<div class="banner bad" role="alert">${esc(msg)}</div>`;
}

// ---- small pop-ups ----
function toast(msg, kind = "", ms = 2600) {
  const t = document.createElement("div");
  t.className = "toast " + kind;
  t.setAttribute("role", "status");
  t.innerHTML = msg;
  $("#toasts").append(t);
  requestAnimationFrame(() => t.classList.add("in"));
  setTimeout(() => { t.classList.remove("in"); setTimeout(() => t.remove(), 300); }, ms);
}

// ask({ title, body, ok, danger, typed }) -> Promise<boolean>
function ask({ title, body = "", ok = "OK", cancel = "Cancel", danger = false, typed = null }) {
  return new Promise(resolve => {
    const dlg = $("#dialog");
    dlg.innerHTML = `<form method="dialog" class="dlg">
      <h2>${esc(title)}</h2><div class="dlg-body">${body}</div>
      ${typed ? `<label class="field"><span>Type <b>${esc(typed)}</b> to confirm</span><input id="dlg-typed" autocomplete="off" autocapitalize="characters"></label>` : ""}
      <div class="row end"><button value="no" class="btn ghost">${esc(cancel)}</button><button value="yes" class="btn ${danger ? "danger" : "primary"}" id="dlg-ok"${typed ? " disabled" : ""}>${esc(ok)}</button></div></form>`;
    if (typed) $("#dlg-typed").addEventListener("input", e => { $("#dlg-ok").disabled = e.target.value.trim().toUpperCase() !== typed; });
    dlg.onclose = () => resolve(dlg.returnValue === "yes");
    dlg.returnValue = "";
    dlg.showModal();
  });
}

function moreSheet() {
  const s = $("#sheet");
  s.innerHTML = `<div class="sheet-card" role="dialog" aria-label="More pages">` +
    NAV.filter(n => !MAIN_TABS.includes(n.id)).map(n => `<a href="#${n.id}" class="sheet-link">${icon(n.icon)}<span>${n.label}</span></a>`).join("") +
    `</div>`;
  s.hidden = false;
}
function closeSheet() { const s = $("#sheet"); if (s) s.hidden = true; }
Act.moreMenu = () => { Sound.play("tap"); if ($("#sheet").hidden) moreSheet(); else closeSheet(); return false; };
document.addEventListener("click", e => { if (e.target.id === "sheet") closeSheet(); });
document.addEventListener("keydown", e => { if (e.key === "Escape") closeSheet(); });

// ---- theme ----
function applyTheme() {
  const t = D().settings.theme;
  if (t === "light" || t === "dark") document.documentElement.dataset.theme = t;
  else delete document.documentElement.dataset.theme;
  const dark = t === "dark" || (t !== "light" && matchMedia("(prefers-color-scheme: dark)").matches);
  $('meta[name="theme-color"]').content = dark ? "#121a18" : "#f4f2ec";
}

// ---- gentle water reminder (only while the page is open) ----
const openedAt = Date.now();
let lastNudge = 0;
function waterCheck() {
  if (!D().settings.waterReminder) return;
  const h = new Date().getHours();
  if (h < 7 || h >= 23) return;
  const k = today(), w = dayOf(k).water || [];
  if (waterTotal(k) >= waterGoal(k)) return;
  const last = Math.max(w.length ? w[w.length - 1].t : 0, openedAt);
  const TWO_H = 2 * 3600e3;
  if (Date.now() - last >= TWO_H && Date.now() - lastNudge >= TWO_H) {
    lastNudge = Date.now();
    Sound.play("remind");
    toast(`<b>Time for some water?</b> It has been 2 hours since your last drink. <button class="btn small primary" data-act="water" data-ml="250">+250 ml</button>`, "info", 12000);
  }
}
setInterval(waterCheck, 60e3);
// when the day changes while the page is open, redraw
let shownDay = today();
setInterval(() => { if (today() !== shownDay) { shownDay = today(); render(); } }, 60e3);

// ---- start ----
function start() {
  Store.load();
  applyTheme();
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", applyTheme);
  render(false);
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
  if ("serviceWorker" in navigator && location.protocol !== "file:") navigator.serviceWorker.register("sw.js").catch(() => {});
}
