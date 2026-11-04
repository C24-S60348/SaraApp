// Follow-ups, Goals, About (Tawakkal) and Settings.
const FU_STATUS = { todo: "To do", booked: "Booked", done: "Done" };
let fuDraft = null;

// ================= Follow-ups =================
Views.followups = args => {
  if (args[0] === "new" || args[0] === "edit") return fuEditor(args);
  fuDraft = null;
  const all = D().followups;
  const open = all.filter(f => f.status !== "done").sort((a, b) => (fuOverdue(b) - fuOverdue(a)) || (a.due || "9999").localeCompare(b.due || "9999"));
  const done = all.filter(f => f.status === "done");
  return `<header class="hello"><div><p class="eyebrow">Follow-ups</p><h1>Doctor visits and tests</h1></div><span id="savestate" class="savestate" aria-live="polite"></span></header>
  <div class="row between wrap"><div class="chips">
    <span class="chip${all.some(fuOverdue) ? " red" : ""}">${all.filter(fuOverdue).length} overdue</span>
    <span class="chip">${all.filter(f => f.status === "todo").length} to do</span>
    <span class="chip">${all.filter(f => f.status === "booked").length} booked</span>
    <span class="chip good">${done.length} done</span></div>
    <a class="btn primary small" href="#followups/new">+ Add</a></div>
  ${open.map(fuItem).join("") || `<div class="card"><p class="muted">Nothing waiting. Alhamdulillah.</p></div>`}
  ${done.length ? `<details class="card"><summary><h2 class="h-small">Done (${done.length})</h2></summary>${done.map(fuItem).join("")}</details>` : ""}
  <p class="muted small">Tip: in Lab Results, any flagged value has a “+ Follow-up” button.</p>`;
};

function fuItem(f) {
  const od = fuOverdue(f);
  const cards = f.cards.map(id => D().plan.find(c => c.id === id)).filter(Boolean);
  return `<section class="card fu${od ? " overdue" : ""}${f.status === "done" ? " isdone" : ""}">
    <div class="row between top"><h2 class="fu-title">${esc(f.title)}</h2><a class="link small" href="#followups/edit/${esc(f.id)}">Edit</a></div>
    <p class="small ${od ? "bad-t" : "muted"}">${f.due ? `${od ? "Overdue · was due" : "Due"} ${esc(fmtDate(f.due))} (${esc(relDays(f.due))})` : `No date yet. <a href="#followups/edit/${esc(f.id)}">Set a date</a>`}</p>
    <div class="seg three" role="group" aria-label="Status">${Object.entries(FU_STATUS).map(([v, l]) => `<button type="button" class="${f.status === v ? "on st-" + v : ""}" data-act="fuStatus" data-id="${esc(f.id)}" data-v="${v}" aria-pressed="${f.status === v}">${l}</button>`).join("")}</div>
    <label class="field"><span>Notes</span><textarea rows="2" data-inp="fuNotes" data-id="${esc(f.id)}" placeholder="Clinic, time, questions to ask…">${esc(f.notes || "")}</textarea></label>
    ${cards.length ? `<div class="chips">${cards.map(c => `<a class="chip" href="#plan/${esc(c.id)}">${esc(c.title)}</a>`).join("")}</div>` : ""}
  </section>`;
}

function fuEditor(args) {
  const editing = args[0] === "edit" ? D().followups.find(f => f.id === args[1]) : null;
  const sig = args.join("/");
  if (!fuDraft || fuDraft.sig !== sig) {
    if (editing) fuDraft = { sig, id: editing.id, title: editing.title, due: editing.due || "", status: editing.status, notes: editing.notes || "", cards: editing.cards.slice() };
    else {
      fuDraft = { sig, id: null, title: "", due: "", status: "todo", notes: "", cards: [] };
      if (args[1] === "card") { const c = D().plan.find(x => x.id === args[2]); if (c) { fuDraft.cards = [c.id]; fuDraft.title = "Follow-up: " + c.title; } }
      if (args[1] === "lab") {
        const rep = D().labs.find(r => r.id === args[2]), r = rep && rep.results[Number(args[3])];
        if (r) {
          fuDraft.title = `Discuss ${r.name} result with the doctor`;
          fuDraft.notes = `${r.name}: ${Labs.valueText(r)} ${r.unit || ""} (${Labs.FLAG_LABEL[r.flag]}${r.ref ? ", range " + r.ref : ""}) on ${fmtDate(rep.date)}.`;
          fuDraft.cards = D().plan.filter(c => c.tests.some(t => Labs.canon(t) === r.key)).map(c => c.id);
        }
      }
    }
  }
  const F = fuDraft;
  return `<header class="hello"><div><p class="eyebrow">Follow-ups</p><h1>${editing ? "Edit follow-up" : "New follow-up"}</h1></div></header>
  <section class="card form">
    <label class="field"><span>Title</span><input data-inp="fd" data-f="title" value="${esc(F.title)}" placeholder="e.g. Doctor review at the clinic"></label>
    <div class="grid2 tight">
      <label class="field"><span>Due date</span><input type="date" data-inp="fd" data-f="due" value="${esc(F.due)}"></label>
      <label class="field"><span>Status</span><select data-inp="fd" data-f="status">${Object.entries(FU_STATUS).map(([v, l]) => `<option value="${v}"${F.status === v ? " selected" : ""}>${l}</option>`).join("")}</select></label>
    </div>
    <label class="field"><span>Notes</span><textarea rows="3" data-inp="fd" data-f="notes">${esc(F.notes)}</textarea></label>
    <p class="label">Linked plan cards</p>
    <div class="checks">${D().plan.filter(c => !c.archived).map(c => `<button type="button" class="check${F.cards.includes(c.id) ? " done" : ""}" data-act="fdCard" data-c="${esc(c.id)}"><span class="box" aria-hidden="true"></span><span class="ct">${esc(c.title)}</span></button>`).join("")}</div>
    <div class="row between wrap">
      ${editing ? `<button class="btn danger small" data-act="fdDelete">Delete</button>` : "<span></span>"}
      <div class="row"><a class="btn ghost" href="#followups">Cancel</a><button class="btn primary" data-act="fdSave">Save</button></div>
    </div>
  </section>`;
}
Chg.fd = el => { fuDraft[el.dataset.f] = el.value; return false; };
Act.fdCard = el => { const c = el.dataset.c, i = fuDraft.cards.indexOf(c); if (i >= 0) fuDraft.cards.splice(i, 1); else fuDraft.cards.push(c); Sound.play("tap"); };
Act.fdSave = () => {
  const F = fuDraft;
  if (!F.title.trim()) { toast("Please add a title.", "bad"); return false; }
  const fields = { title: F.title.trim(), due: F.due || null, status: F.status, notes: F.notes, cards: F.cards };
  if (F.id) Object.assign(D().followups.find(f => f.id === F.id), fields);
  else D().followups.push(Object.assign({ id: uid("fu"), createdAt: new Date().toISOString() }, fields));
  fuDraft = null;
  commit("check");
  toast("Follow-up saved.", "good");
  location.hash = "#followups";
  return false;
};
Act.fdDelete = async () => {
  if (!(await ask({ title: "Delete this follow-up?", ok: "Delete", danger: true }))) return;
  const id = fuDraft.id;
  D().followups = D().followups.filter(f => f.id !== id);
  D().plan.forEach(c => c.actions.forEach(a => { if (a.fu === id) delete a.fu; }));
  fuDraft = null;
  commit("undo");
  location.hash = "#followups";
};
Act.fuStatus = el => {
  const f = D().followups.find(x => x.id === el.dataset.id);
  f.status = el.dataset.v;
  commit(f.status === "done" ? "goal" : "tap");
  if (f.status === "done") toast("Done. Alhamdulillah.", "good");
};
let fuNotesT = 0;
Chg.fuNotes = el => { clearTimeout(fuNotesT); fuNotesT = setTimeout(() => { const f = D().followups.find(x => x.id === el.dataset.id); if (f) { f.notes = el.value; commit(); } }, 400); return false; };

// ================= Goals =================
Views.goals = () => {
  const g = D().goals, k = today();
  const days = []; for (let i = 0; i < 7; i++) days.push(addDays(k, -i));
  const sleeps = days.map(x => dayOf(x).sleepH).filter(Boolean);
  const avgSleep = sleeps.length ? round(sleeps.reduce((a, b) => a + b, 0) / sleeps.length) : null;
  const steps = dayOf(k).steps || 0;
  const w = latestValue("weight"), c = latestValue("waist");
  const firstW = Object.keys(D().days).sort().find(x => D().days[x].weight);
  const firstC = Object.keys(D().days).sort().find(x => D().days[x].waist);
  const toward = (start, now, target) => { if (start === null || now === null || target === null || start === target) return now === target ? 1 : 0; return Math.max(0, Math.min(1, (start - now) / (start - target))); };
  const b = bmi();
  const nb = g.nextBloodTest;
  const prog = (label, v, goal, txt, cls) => `<div class="goalrow"><div class="row between"><span>${label}</span><b>${txt}</b></div>${Chart.bar(v, goal, cls)}</div>`;
  return `<header class="hello"><div><p class="eyebrow">Goals</p><h1>Small, steady steps</h1></div><span id="savestate" class="savestate" aria-live="polite"></span></header>
  <section class="card"><h2>Progress</h2>
    ${prog("Water today", waterTotal(k), waterGoal(k), `${litres(waterTotal(k))} / ${litres(waterGoal(k))}`, "blue")}
    ${prog("Exercise this week", weekEx(k), g.exerciseMinWeek, `${weekEx(k)} / ${g.exerciseMinWeek} min`, "green")}
    ${prog("Sleep (7-night average)", avgSleep || 0, g.sleepHours, avgSleep ? `${avgSleep} / ${g.sleepHours} h` : "—")}
    ${g.stepsDay ? prog("Steps today", steps, g.stepsDay, `${steps} / ${g.stepsDay}`, "green") : ""}
    ${g.targetWeightKg && w ? prog("Weight", toward(D().days[firstW].weight, w.v, g.targetWeightKg), 1, `${wShow(w.v)} → ${wShow(g.targetWeightKg)} ${wUnit()}`) : ""}
    ${g.targetWaistCm && c ? prog("Waist", toward(D().days[firstC].waist, c.v, g.targetWaistCm), 1, `${lShow(c.v)} → ${lShow(g.targetWaistCm)} ${lUnit()}`) : ""}
    ${b ? `<p class="small">BMI ${b.v} · ${b.cat} <span class="muted">(Malaysian cut-offs: healthy 18.5–22.9)</span></p>` : D().settings.heightCm ? "" : `<p class="muted small">Add your height in <a href="#settings">Settings</a> to see your BMI.</p>`}
  </section>
  <section class="card form"><h2>My goals</h2>
    <div class="grid2 tight">
      <label class="field"><span>Water per day (ml)</span><input type="number" inputmode="numeric" step="250" min="500" data-chg="goal" data-f="waterMl" value="${g.waterMl}"></label>
      <label class="field"><span>Exercise per week (min)</span><input type="number" inputmode="numeric" step="10" min="0" data-chg="goal" data-f="exerciseMinWeek" value="${g.exerciseMinWeek}"></label>
      <label class="field"><span>Sleep per night (hours)</span><input type="number" inputmode="decimal" step="0.5" min="0" data-chg="goal" data-f="sleepHours" value="${g.sleepHours}"></label>
      <label class="field"><span>Steps per day</span><input type="number" inputmode="numeric" step="500" min="0" data-chg="goal" data-f="stepsDay" value="${g.stepsDay || ""}"></label>
      <label class="field"><span>Target weight (${wUnit()})</span><input type="number" inputmode="decimal" step="0.5" min="0" data-chg="goal" data-f="targetWeightKg" data-t="w" value="${esc(wShow(g.targetWeightKg))}"></label>
      <label class="field"><span>Target waist (${lUnit()})</span><input type="number" inputmode="decimal" step="0.5" min="0" data-chg="goal" data-f="targetWaistCm" data-t="l" value="${esc(lShow(g.targetWaistCm))}"></label>
    </div>
  </section>
  <section class="card form"><h2>Next blood test</h2>
    <label class="field"><span>Date</span><input type="date" data-chg="goal" data-f="nextBloodTest" data-t="date" value="${esc(nb || "")}"></label>
    ${nb && nb >= k ? `<p>${daysBetween(k, nb) === 0 ? "Today, in shaa Allah." : `${daysBetween(k, nb)} days to go, in shaa Allah.`} The pre-test steps from your plan appear on Today 3 days before.</p>` : `<p class="muted small">The countdown shows on Today.</p>`}
  </section>`;
};
Chg.goal = el => {
  const g = D().goals, f = el.dataset.f, t = el.dataset.t;
  g[f] = t === "date" ? (el.value || null) : t === "w" ? wSave(el.value) : t === "l" ? lSave(el.value) : numOrNull(el.value);
  if (f === "waterMl" && !g.waterMl) g.waterMl = 2500;
  if (f === "exerciseMinWeek" && g.exerciseMinWeek === null) g.exerciseMinWeek = 150;
  if (f === "sleepHours" && !g.sleepHours) g.sleepHours = 7.5;
  commit("save");
  return true;
};

// ================= About (Tawakkal) =================
Views.about = () => `
  <header class="hello"><div><p class="eyebrow">About</p><h1>Tawakkal</h1></div></header>
  <section class="card prose">
    <p class="lead">This tracker is my <b>ikhtiar</b>, my effort. The outcome belongs to Allah. That is <b>tawakkal</b>: doing my part, then trusting Allah fully.</p>
    <h2>Tie your camel</h2>
    <p>A man asked the Prophet ﷺ whether he should leave his camel untied and trust in Allah, or tie it and trust in Allah. He ﷺ answered:</p>
    <blockquote><p class="ar" lang="ar" dir="rtl">اعْقِلْهَا وَتَوَكَّلْ</p><p>“Tie it, and put your trust in Allah.”</p><cite>Sunan at-Tirmidhi</cite></blockquote>
    <p>Trust is not leaving things undone. It is doing what is in my hands with care, and leaving what is not in my hands to Allah. Drinking water, moving my body, eating well, going for the retest and asking the doctor are me tying my camel.</p>
    <h2>He is enough</h2>
    <blockquote><p class="ar" lang="ar" dir="rtl">وَمَن يَتَوَكَّلْ عَلَى ٱللَّهِ فَهُوَ حَسْبُهُۥٓ</p><p>“And whoever puts their trust in Allah, He is sufficient for them.”</p><cite>Surah At-Talaq 65:3</cite></blockquote>
    <p>Numbers on a lab report can make the heart heavy. When worry comes, I remind myself that Allah is enough for me. I keep doing my part, and I let Him carry what I cannot.</p>
    <h2>My body is an amanah</h2>
    <p>My body is a trust from Allah, not something I own. Looking after it is a way of saying thank you for it. The Prophet ﷺ also said, “Your body has a right over you” (Sahih al-Bukhari).</p>
    <p>So I track gently. A missed day is not a failure. A high number is not a verdict. Each glass of water and each walk is a small act of gratitude, and Allah sees the effort even when the results take time.</p>
    <h2>How I use this tracker</h2>
    <ul>
      <li><b>Ikhtiar:</b> I do the small daily steps on my plan.</li>
      <li><b>Follow-up:</b> I see the doctor and repeat the tests.</li>
      <li><b>Tawakkal:</b> I make du'a and leave the result to Allah.</li>
      <li><b>Shukr:</b> when a result improves, I say alhamdulillah.</li>
    </ul>
    <p class="trust">I do my part, and the result is in Allah's hands.</p>
  </section>
  <section class="card prose small-p">
    <h2>About this app</h2>
    <p>A personal tracker that keeps everything on this device, in this browser. Nothing is sent to any server. Other people who open this link see an empty tracker, not your data.</p>
    <p>It is not medical advice. Always follow up with a doctor.</p>
  </section>`;

// ================= Settings =================
Views.settings = args => {
  const s = D().settings, kb = Store.sizeKb();
  const items = D().items;
  const lb = s.lastBackup;
  return `<header class="hello"><div><p class="eyebrow">Settings</p><h1>Settings</h1></div><span id="savestate" class="savestate" aria-live="polite"></span></header>
  <section class="card form"><h2>Me</h2>
    <label class="field"><span>Name <small>optional, only shown on this device</small></span><input data-chg="set" data-f="name" value="${esc(s.name)}" autocomplete="off"></label>
    <label class="field"><span>Height (${lUnit()}) <small>for BMI</small></span><input type="number" inputmode="decimal" step="0.5" min="0" data-chg="set" data-f="heightCm" data-t="l" value="${esc(lShow(s.heightCm))}"></label>
    <label class="field"><span>Daily water goal (ml)</span><input type="number" inputmode="numeric" step="250" min="500" data-chg="goal" data-f="waterMl" value="${D().goals.waterMl}"></label>
  </section>
  <section class="card form"><h2>Units and display</h2>
    <p class="label">Weight</p><div class="seg two">${["kg", "lb"].map(u => `<button type="button" class="${s.weightUnit === u ? "on" : ""}" data-act="setOpt" data-f="weightUnit" data-v="${u}">${u}</button>`).join("")}</div>
    <p class="label">Waist and height</p><div class="seg two">${["cm", "in"].map(u => `<button type="button" class="${s.lengthUnit === u ? "on" : ""}" data-act="setOpt" data-f="lengthUnit" data-v="${u}">${u}</button>`).join("")}</div>
    <p class="label">Theme</p><div class="seg three">${[["auto", "Auto"], ["light", "Light"], ["dark", "Dark"]].map(([v, l]) => `<button type="button" class="${s.theme === v ? "on" : ""}" data-act="setOpt" data-f="theme" data-v="${v}">${l}</button>`).join("")}</div>
    <button type="button" class="toggle${s.sound ? " on" : ""}" data-act="setFlag" data-f="sound" aria-pressed="${s.sound}"><span class="sw" aria-hidden="true"></span>Sound effects</button>
    <button type="button" class="toggle${s.waterReminder ? " on" : ""}" data-act="setFlag" data-f="waterReminder" aria-pressed="${s.waterReminder}"><span class="sw" aria-hidden="true"></span>Water reminder every 2 hours (while open)</button>
  </section>
  <section class="card form" id="items"><h2>My supplements and medicines</h2>
    ${items.map(i => `<div class="item-row${i.archived ? " archived" : ""}">
      <input data-chg="itemName" data-id="${esc(i.id)}" value="${esc(i.name)}" aria-label="Name">
      <select data-chg="itemKind" data-id="${esc(i.id)}" aria-label="Type">${[["supplement", "Supplement"], ["medicine", "Medicine"], ["painkiller", "Painkiller"]].map(([v, l]) => `<option value="${v}"${i.kind === v ? " selected" : ""}>${l}</option>`).join("")}</select>
      <button class="btn ghost small" data-act="itemArchive" data-id="${esc(i.id)}">${i.archived ? "Show" : "Hide"}</button></div>`).join("")}
    <div class="row addrow"><input id="new-item" placeholder="e.g. Fish oil, vitamin D"><button class="btn primary small" data-act="itemAdd">Add</button></div>
    <p class="muted small">“Painkiller” items count against the liver and kidney score, as a gentle reminder to check with your doctor.</p>
  </section>
  <section class="card form" id="backup"><h2>Backup and restore</h2>
    <div class="banner warn"><b>Your data lives only in this browser.</b> Clearing browser data, “clear site data”, uninstalling the browser or changing phones deletes everything. Export a backup now and then, and keep the file somewhere safe (Google Drive, email to yourself).</div>
    <p class="small">${lb ? `Last backup: <b>${esc(fmtDate(lb.slice(0, 10)))}</b> (${esc(relDays(lb.slice(0, 10)))})` : "No backup yet."}${kb !== null ? ` · Data size: ${kb} KB` : ""}</p>
    <div class="row wrap"><button class="btn primary" data-act="exportData">Export backup (.json)</button><label class="btn ghost filebtn">Import backup<input type="file" accept="application/json,.json" data-chg="importFile" hidden></label></div>
    <p class="muted small">Importing replaces everything on this device with the backup.</p>
  </section>
  <section class="card form"><h2>Reset</h2>
    <p class="small">Delete all your data on this device and start fresh.</p>
    <button class="btn danger" data-act="resetAll">Reset all data…</button>
  </section>
  <p class="muted small center">Saved as “${Store.KEY}”, schema version ${Store.SCHEMA}.</p>`;
};
After.settings = args => { if (args[0]) { const el = document.getElementById(args[0]); if (el) setTimeout(() => el.scrollIntoView({ block: "start" }), 30); } };

Chg.set = el => {
  const s = D().settings, f = el.dataset.f;
  s[f] = el.dataset.t === "l" ? lSave(el.value) : el.value.trim();
  commit("save");
  return false;
};
Act.setOpt = el => { D().settings[el.dataset.f] = el.dataset.v; commit("tap"); applyTheme(); };
Act.setFlag = el => { const s = D().settings; s[el.dataset.f] = !s[el.dataset.f]; commit("tap"); };
Chg.itemName = el => { const i = D().items.find(x => x.id === el.dataset.id); if (el.value.trim()) i.name = el.value.trim(); commit("save"); return false; };
Chg.itemKind = el => { D().items.find(x => x.id === el.dataset.id).kind = el.value; commit("save"); return false; };
Act.itemArchive = el => { const i = D().items.find(x => x.id === el.dataset.id); i.archived = !i.archived; commit("tap"); };
Act.itemAdd = () => {
  const inp = $("#new-item"), name = inp.value.trim();
  if (!name) { inp.focus(); return false; }
  D().items.push({ id: uid("it"), name, kind: "supplement", archived: false });
  commit("check");
};

Act.exportData = () => {
  D().settings.lastBackup = new Date().toISOString();
  Store.save();
  const blob = new Blob([Store.exportJson()], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `health-tracker-backup-${today()}.json`;
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  Sound.play("check");
  toast("Backup file downloaded. Keep it somewhere safe.", "good");
};
Chg.importFile = el => {
  const file = el.files && el.files[0];
  if (!file) return false;
  const reader = new FileReader();
  reader.onload = async () => {
    el.value = "";
    let d;
    try { d = Store.parseBackup(String(reader.result)); }
    catch (e) { Sound.play("warn"); toast(esc(e.message), "bad", 5000); return; }
    const ok = await ask({
      title: "Replace everything with this backup?",
      body: `<p>The backup has <b>${Object.keys(d.days).length}</b> days of check-ins, <b>${d.labs.length}</b> lab reports and <b>${d.followups.length}</b> follow-ups${d.updatedAt ? `, last changed ${esc(fmtDate(d.updatedAt.slice(0, 10)))}` : ""}.</p><p>Everything currently on this device will be replaced.</p>`,
      ok: "Replace", danger: true
    });
    if (!ok) return;
    if (Store.replaceAll(d)) { applyTheme(); Sound.play("goal"); toast("Backup restored.", "good"); }
    render();
  };
  reader.onerror = () => toast("Could not read that file.", "bad");
  reader.readAsText(file);
  return false;
};
Act.resetAll = async () => {
  const ok = await ask({ title: "Reset all data?", body: "<p>This deletes every check-in, lab report, follow-up and setting on this device. It cannot be undone. Export a backup first if you might want it back.</p>", ok: "Delete everything", danger: true, typed: "RESET" });
  if (!ok) return;
  Store.reset();
  applyTheme();
  Sound.play("undo");
  toast("All data deleted. Starting fresh.");
  location.hash = "#home";
  render();
};
