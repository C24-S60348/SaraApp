// My Ikhtiar Plan: one card per flagged result, with lab trend, checklist, warning signs.
let planFilter = "active";
let planDraft = null;
const openCards = new Set();
const STATUS_CLASS = s => { const t = String(s || "").toLowerCase(); return t.includes("not immune") ? "info" : t.includes("high") || t.includes("positive") ? "bad" : t.includes("low") || t.includes("border") ? "warn" : "info"; };
const FREQ_LABEL = { daily: "Daily", weekly: "Weekly", once: "One-time" };

Views.plan = args => {
  if (args[0] === "edit" || args[0] === "new") return planEditor(args[0] === "new" ? null : args[1]);
  if (args[0] && args[0] !== "f") { openCards.add(args[0]); planFilter = "active"; }
  if (args[0] === "f" && args[1]) planFilter = args[1];
  const all = D().plan;
  const groups = { active: all.filter(c => !c.archived && !c.resolved), resolved: all.filter(c => !c.archived && c.resolved), archived: all.filter(c => c.archived) };
  const list = groups[planFilter].slice().sort((a, b) => cardPriority(b) - cardPriority(a));
  return `
  <header class="hello"><div><p class="eyebrow">My Ikhtiar Plan</p><h1>Doing my part</h1></div><span id="savestate" class="savestate" aria-live="polite"></span></header>
  <p class="muted">One card for each result to work on. Tap a card to open it.</p>
  <div class="row between wrap">
    <div class="seg filters" role="tablist">${["active", "resolved", "archived"].map(f => `<a role="tab" href="#plan/f/${f}" class="${planFilter === f ? "on" : ""}" aria-selected="${planFilter === f}">${f[0].toUpperCase() + f.slice(1)} <small>${groups[f].length}</small></a>`).join("")}</div>
    <a class="btn primary small" href="#plan/new">+ Add card</a>
  </div>
  ${list.length ? list.map(planCard).join("") : `<div class="card"><p class="muted">${planFilter === "active" ? "No active cards. Alhamdulillah!" : "Nothing here yet."}</p></div>`}`;
};

After.plan = args => {
  if (args[0] && !["f", "edit", "new"].includes(args[0])) {
    const el = document.getElementById("card-" + args[0]);
    if (el) setTimeout(() => el.scrollIntoView({ block: "start", behavior: "smooth" }), 30);
  }
};

function cardLabValues(c) {
  const blocks = [];
  c.tests.forEach(name => {
    const key = Labs.canon(name), s = Labs.series(key);
    if (!s.length) return;
    const last = s[s.length - 1], ref = Labs.parseRef(last.ref);
    const nums = s.filter(r => r.num !== null && r.num !== undefined);
    blocks.push(`<div class="labval">
      <div class="row between"><span><b>${esc(last.name)}</b> <span class="muted small">${esc(fmtDate(last.date))}</span></span>
        <span><b>${esc(Labs.valueText(last))}</b> ${esc(last.unit || "")} ${flagBadge(last.flag)}</span></div>
      ${last.ref ? `<p class="muted small">Range: ${esc(last.ref)}</p>` : ""}
      ${nums.length > 1 ? Chart.line(nums.map(r => ({ d: r.date, v: r.num, flag: r.flag })), { lo: ref.lo, hi: ref.hi, unit: last.unit, height: 120, label: last.name + " trend" }) : ""}
    </div>`);
  });
  return blocks;
}
const flagBadge = f => f ? `<span class="flag f-${f}">${Labs.FLAG_LABEL[f]}</span>` : "";

function planCard(c) {
  const k = today();
  const daily = c.actions.filter(a => a.freq === "daily");
  const doneN = daily.filter(a => actionDone(a, k)).length;
  const warnOn = Object.keys(c.warnOn || {});
  const fus = D().followups.filter(f => f.cards.includes(c.id));
  const overdue = fus.some(fuOverdue);
  const labs = cardLabValues(c);
  const latestFlags = c.tests.map(n => Labs.latest(Labs.canon(n))).filter(Boolean);
  const allNormal = latestFlags.length && latestFlags.every(r => r.flag === "N");
  const groups = ["daily", "weekly", "once"].map(fr => { const acts = c.actions.filter(a => a.freq === fr); return acts.length ? `<p class="label">${FREQ_LABEL[fr]}</p><div class="checks">${acts.map(a => checkRow(a, k, a.prep ? ["before the test"] : [])).join("")}</div>` : ""; }).join("");
  return `<details class="card plan-card" id="card-${esc(c.id)}"${openCards.has(c.id) ? " open" : ""} data-card="${esc(c.id)}">
    <summary>
      <div class="pc-head">
        <h2>${esc(c.title)}</h2>
        <div class="badges">
          ${c.resolved ? `<span class="status good">Resolved</span>` : `<span class="status ${STATUS_CLASS(c.status)}">${esc(c.status)}</span>`}
          ${warnOn.length ? `<span class="status bad">See a doctor</span>` : ""}
          ${overdue ? `<span class="status bad">Follow-up overdue</span>` : ""}
          ${!c.resolved && daily.length ? `<span class="status plain">${doneN}/${daily.length} today</span>` : ""}
        </div>
      </div>
    </summary>
    <div class="pc-body">
      ${c.resolved ? `<p class="banner good">Resolved, alhamdulillah (${esc(fmtDate(c.resolved))}).</p>` : ""}
      ${labs.length ? labs.join("") : `<p class="muted small">No lab result for ${esc(c.tests.join(", ") || "this card")} yet. <a href="#labs/add">Import a report →</a></p>`}
      ${allNormal && !c.resolved ? `<p class="banner good">Your latest result is in the normal range. Alhamdulillah. <button class="btn small primary" data-act="resolve" data-c="${esc(c.id)}">Mark resolved</button></p>` : ""}
      <h3 class="h-small">What it may mean</h3>
      <p>${esc(c.meaning)}</p>
      <h3 class="h-small">My ikhtiar</h3>
      ${groups || `<p class="muted small">No actions yet. Tap Edit to add some.</p>`}
      ${c.warnings.length ? `<h3 class="h-small">See a doctor sooner if</h3>
        <p class="muted small">Tap a sign if you notice it. It will show at the top of Today.</p>
        <div class="checks">${c.warnings.map((w, i) => { const on = c.warnOn[i]; return `<button type="button" class="check red${on ? " done" : ""}" data-act="warnToggle" data-c="${esc(c.id)}" data-i="${i}" aria-pressed="${!!on}"><span class="box" aria-hidden="true"></span><span class="ct"><span>${esc(w)}</span>${on ? `<small>Noticed ${esc(fmtDate(on))}. Please see a doctor.</small>` : ""}</span></button>`; }).join("")}</div>` : ""}
      ${c.extra === "vaccines" ? vaccinesHtml() : ""}
      ${c.extra === "symptoms" ? symptomLogHtml() : ""}
      <h3 class="h-small">Follow-ups</h3>
      ${fus.length ? `<ul class="fu-mini">${fus.map(f => `<li class="${fuOverdue(f) ? "overdue" : ""}"><span class="fu-st st-${f.status}">${FU_STATUS[f.status]}</span> ${esc(f.title)}${f.due ? ` <small class="muted">· ${esc(fmtDate(f.due))}</small>` : ""}</li>`).join("")}</ul>` : ""}
      <a class="link small" href="#followups/new/card/${esc(c.id)}">+ Add a follow-up for this card</a>
      <p class="trust">I do my part, and the result is in Allah's hands.</p>
      <div class="row wrap end">
        <a class="btn ghost small" href="#plan/edit/${esc(c.id)}">Edit</a>
        ${c.resolved ? `<button class="btn ghost small" data-act="unresolve" data-c="${esc(c.id)}">Reopen</button>` : `<button class="btn ghost small" data-act="resolve" data-c="${esc(c.id)}">Resolved, alhamdulillah</button>`}
        <button class="btn ghost small" data-act="archive" data-c="${esc(c.id)}">${c.archived ? "Restore" : "Archive"}</button>
      </div>
    </div>
  </details>`;
}

const VACCINES = ["Hepatitis B", "Hepatitis A", "Hepatitis A + B (combined)"];
function vaccinesHtml() {
  const v = D().vaccines.slice().sort((a, b) => a.date.localeCompare(b.date));
  return `<h3 class="h-small">Vaccine doses</h3>
    ${v.length ? `<ul class="vax">${v.map(x => `<li><b>${esc(x.vaccine)}</b> · dose ${esc(x.dose)} <span class="muted small">${esc(fmtDate(x.date))}</span>${x.notes ? ` <span class="muted small">· ${esc(x.notes)}</span>` : ""} <button class="rbtn sm" data-act="vaxDel" data-id="${esc(x.id)}" aria-label="Remove dose">×</button></li>`).join("")}</ul>` : `<p class="muted small">No doses logged yet.</p>`}
    <div class="vax-form">
      <label class="field"><span>Vaccine</span><select id="vax-name">${VACCINES.map(n => `<option>${n}</option>`).join("")}</select></label>
      <label class="field"><span>Dose</span><select id="vax-dose">${["1", "2", "3", "Booster"].map(n => `<option>${n}</option>`).join("")}</select></label>
      <label class="field"><span>Date</span><input type="date" id="vax-date" value="${today()}"></label>
      <label class="field"><span>Notes</span><input id="vax-notes" placeholder="Clinic, next dose…"></label>
    </div>
    <button class="btn small primary" data-act="vaxAdd">Add dose</button>
    <p class="muted small">Your doctor will confirm how many doses you need and when.</p>`;
}

function symptomLogHtml() {
  const rows = [];
  for (let i = 0; i < 14; i++) {
    const k = addDays(today(), -i), u = dayOf(k).urinary;
    if (Array.isArray(u)) rows.push(`<li><span class="muted small">${esc(fmtDay(k))}</span> ${u.length ? u.map(x => `<span class="chip${RED_URINARY.includes(x) ? " red" : ""}">${esc(URINARY_LABELS[x])}</span>`).join(" ") : `<span class="chip good">None</span>`}</li>`);
  }
  return `<h3 class="h-small">Urinary symptoms (last 14 days)</h3>
    ${rows.length ? `<ul class="symlog">${rows.join("")}</ul>` : `<p class="muted small">Nothing logged yet.</p>`}
    <a class="btn small ghost" href="#checkin">Log today's symptoms</a>`;
}

// ---- editor ----
function planEditor(id) {
  const c = id ? D().plan.find(x => x.id === id) : null;
  if (id && !c) return `<div class="card"><p>Card not found.</p><a href="#plan">Back</a></div>`;
  if (!planDraft || planDraft.id !== (c ? c.id : "__new")) {
    planDraft = c ? { id: c.id, title: c.title, status: c.status, tests: c.tests.join(", "), meaning: c.meaning, actions: c.actions.map(a => Object.assign({}, a)), warnings: c.warnings.join("\n") }
      : { id: "__new", title: "", status: "High", tests: "", meaning: "", actions: [{ key: uid("a"), text: "", freq: "daily" }], warnings: "" };
  }
  const p = planDraft;
  return `<header class="hello"><div><p class="eyebrow">My Ikhtiar Plan</p><h1>${c ? "Edit card" : "New card"}</h1></div></header>
  <section class="card form">
    <label class="field"><span>Title</span><input data-inp="pd" data-f="title" value="${esc(p.title)}" placeholder="e.g. Fasting glucose"></label>
    <label class="field"><span>Status</span><input data-inp="pd" data-f="status" list="status-list" value="${esc(p.status)}"></label>
    <datalist id="status-list">${["High", "Slightly high", "Borderline", "Low", "Slightly low", "Positive", "Not immune", "Watch"].map(s => `<option value="${s}">`).join("")}</datalist>
    <label class="field"><span>Lab tests to show (comma separated, as written on your report)</span><input data-inp="pd" data-f="tests" value="${esc(p.tests)}" placeholder="e.g. Glucose, HbA1c"></label>
    <label class="field"><span>What it may mean</span><textarea rows="2" data-inp="pd" data-f="meaning">${esc(p.meaning)}</textarea></label>
    <p class="label">My ikhtiar (actions)</p>
    ${p.actions.map((a, i) => `<div class="act-row">
      <input data-inp="pdAct" data-i="${i}" value="${esc(a.text)}" placeholder="Action" aria-label="Action ${i + 1}">
      <select data-chg="pdFreq" data-i="${i}" aria-label="How often">${["daily", "weekly", "once"].map(f => `<option value="${f}"${a.freq === f ? " selected" : ""}>${FREQ_LABEL[f]}</option>`).join("")}</select>
      <button class="rbtn" data-act="pdDel" data-i="${i}" aria-label="Remove action">×</button></div>`).join("")}
    <button class="btn ghost small" data-act="pdAdd">+ Add action</button>
    <label class="field"><span>See a doctor sooner if (one sign per line)</span><textarea rows="3" data-inp="pd" data-f="warnings">${esc(p.warnings)}</textarea></label>
    <div class="row between wrap">
      ${c ? `<button class="btn danger small" data-act="pdDelete">Delete card</button>` : "<span></span>"}
      <div class="row"><button class="btn ghost" data-act="pdCancel">Cancel</button><button class="btn primary" data-act="pdSave">Save</button></div>
    </div>
  </section>`;
}
Chg.pd = el => { planDraft[el.dataset.f] = el.value; return false; };
Chg.pdAct = el => { planDraft.actions[Number(el.dataset.i)].text = el.value; return false; };
Chg.pdFreq = el => { planDraft.actions[Number(el.dataset.i)].freq = el.value; return false; };
Act.pdAdd = () => { planDraft.actions.push({ key: uid("a"), text: "", freq: "daily" }); Sound.play("tap"); };
Act.pdDel = el => { planDraft.actions.splice(Number(el.dataset.i), 1); Sound.play("undo"); };
Act.pdCancel = () => { const id = planDraft && planDraft.id; planDraft = null; location.hash = id && id !== "__new" ? "#plan/" + id : "#plan"; return false; };
Act.pdSave = () => {
  const p = planDraft;
  if (!p.title.trim()) { toast("Please give the card a title.", "bad"); return false; }
  const fields = {
    title: p.title.trim(), status: p.status.trim() || "Watch",
    tests: p.tests.split(",").map(s => s.trim()).filter(Boolean),
    meaning: p.meaning.trim(),
    actions: p.actions.filter(a => a.text.trim()).map(a => Object.assign(a, { text: a.text.trim() })),
    warnings: p.warnings.split("\n").map(s => s.trim()).filter(Boolean)
  };
  let id = p.id;
  if (id === "__new") { id = uid("card"); D().plan.push(Object.assign({ id, archived: false, resolved: null, warnOn: {} }, fields)); }
  else { const c = D().plan.find(x => x.id === id); Object.assign(c, fields); Object.keys(c.warnOn).forEach(i => { if (!c.warnings[i]) delete c.warnOn[i]; }); }
  planDraft = null;
  commit("check");
  toast("Card saved.", "good");
  openCards.add(id);
  location.hash = "#plan/" + id;
  return false;
};
Act.pdDelete = async () => {
  const c = D().plan.find(x => x.id === planDraft.id);
  if (!(await ask({ title: "Delete this card?", body: `<p>“${esc(c.title)}” will be removed. Archiving keeps it instead.</p>`, ok: "Delete", danger: true }))) return;
  D().plan = D().plan.filter(x => x !== c);
  D().followups.forEach(f => { f.cards = f.cards.filter(x => x !== c.id); });
  planDraft = null;
  commit("undo");
  location.hash = "#plan";
};

// ---- card actions ----
const cardOf = el => D().plan.find(x => x.id === el.dataset.c);
document.addEventListener("toggle", e => {
  const d = e.target;
  if (d.dataset && d.dataset.card) { if (d.open) openCards.add(d.dataset.card); else openCards.delete(d.dataset.card); }
}, true);
Act.warnToggle = el => {
  const c = cardOf(el), i = el.dataset.i;
  if (c.warnOn[i]) { delete c.warnOn[i]; commit("uncheck"); }
  else { c.warnOn[i] = today(); commit("warn"); toast("Noted. Please see a doctor soon about this. It is shown at the top of Today.", "bad", 5000); }
};
Act.resolve = async el => {
  const c = cardOf(el);
  if (!(await ask({ title: "Resolved, alhamdulillah?", body: `<p>Mark “${esc(c.title)}” as resolved? Its daily actions leave your checklist. You can reopen it any time.</p>`, ok: "Mark resolved" }))) return;
  c.resolved = today();
  commit("goal");
  toast("Alhamdulillah. Marked as resolved.", "good");
  render();
};
Act.unresolve = el => { cardOf(el).resolved = null; commit("tap"); };
Act.archive = el => { const c = cardOf(el); c.archived = !c.archived; commit("tap"); toast(c.archived ? "Card archived." : "Card restored."); };
Act.vaxAdd = () => {
  const date = $("#vax-date").value;
  if (!date) { toast("Please choose the date.", "bad"); return false; }
  D().vaccines.push({ id: uid("vx"), vaccine: $("#vax-name").value, dose: $("#vax-dose").value, date, notes: $("#vax-notes").value.trim() });
  commit("check");
  toast("Dose saved.", "good");
};
Act.vaxDel = async el => {
  if (!(await ask({ title: "Remove this dose?", ok: "Remove", danger: true }))) return;
  D().vaccines = D().vaccines.filter(v => v.id !== el.dataset.id);
  commit("undo");
  render();
};
