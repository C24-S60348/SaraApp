// Home (today): tawakkal note, alerts, checklist, focus trackers, countdown, streak, weekly summary.
const URINE = [
  { c: "#f6f1c4", t: "Pale", hint: "Well hydrated. Alhamdulillah." },
  { c: "#f1e57f", t: "Light", hint: "Good. Keep sipping through the day." },
  { c: "#e6cc3f", t: "Yellow", hint: "Drink a glass of water soon." },
  { c: "#cf9b25", t: "Dark", hint: "Drink water now, and a bit more over the next hours." },
  { c: "#a8681a", t: "Very dark", hint: "Drink water now. If it is tea- or cola-coloured and stays that way, see a doctor." }
];
const FOODS = [
  { f: "fried", t: "Fried or oily", bad: true },
  { f: "santan", t: "Santan dishes", bad: true },
  { f: "sweet", t: "Sweet drinks", sub: "teh tarik, sodas…", bad: true },
  { f: "fast", t: "Fast food", bad: true },
  { f: "fibre", t: "Fibre servings", sub: "veg, fruit, oats, beans, wholegrain", bad: false }
];

let reminderTimer = 0, reminderIdx = Math.floor(Math.random() * REMINDERS.length);

Views.home = () => {
  const k = today(), d = dayOf(k), name = D().settings.name;
  return `
  <header class="hello">
    <div><p class="eyebrow">${esc(fmtDay(k))}</p><h1>Assalamualaikum${name ? ", " + esc(name) : ""}</h1></div>
    <span id="savestate" class="savestate" aria-live="polite"></span>
  </header>
  ${alertsHtml()}
  <section class="card why">
    <h2 class="h-small">Why I track</h2>
    <p>This tracker is my <b>ikhtiar</b>, my effort. The outcome belongs to Allah. I tie my camel, then I put my trust in Him.</p>
    <p class="reminder" id="reminder" aria-live="polite">${esc(REMINDERS[reminderIdx])}</p>
    <a href="#about" class="link">Read about tawakkal →</a>
  </section>
  <div class="grid2">${countdownHtml()}${streakHtml()}</div>
  ${checklistHtml(k)}
  ${checkinSummary(k, d)}
  <h2 class="section-title">My Focus</h2>
  ${hydrationHtml(k, d)}
  ${heartHtml(k)}
  ${liverHtml(k, d)}
  ${weekSummaryHtml(k)}
  ${backupNudge()}`;
};

After.home = () => {
  clearInterval(reminderTimer);
  reminderTimer = setInterval(() => {
    const r = $("#reminder");
    if (!r) { clearInterval(reminderTimer); return; }
    r.classList.add("fade");
    setTimeout(() => { reminderIdx = (reminderIdx + 1) % REMINDERS.length; r.textContent = REMINDERS[reminderIdx]; r.classList.remove("fade"); }, 400);
  }, 9000);
};

function alertsHtml() {
  const a = alerts();
  if (!a.length) return "";
  const icons = { doctor: "!", overdue: "!", soon: "i" };
  return `<section class="alerts" aria-label="Needs attention">${a.map(x => `<a class="alert ${x.kind}" href="${x.href}"><span class="alert-ic" aria-hidden="true">${icons[x.kind]}</span><span>${x.text}</span></a>`).join("")}</section>`;
}

function countdownHtml() {
  const t = D().goals.nextBloodTest;
  if (!t || t < today()) {
    return `<section class="card mini"><h2 class="h-small">Next blood test</h2><p class="muted">${t ? "The date has passed. " : ""}Set the date to see a countdown.</p><a class="btn small ghost" href="#goals">Set date</a></section>`;
  }
  const n = daysBetween(today(), t);
  const prep = n <= 3 ? combinedActions().filter(x => x.a.prep) : [];
  return `<section class="card mini"><h2 class="h-small">Next blood test</h2>
    <p class="big">${n === 0 ? "Today" : n}<small>${n === 0 ? "" : n === 1 ? " day" : " days"}</small></p>
    <p class="muted small">${esc(fmtDate(t))}</p>
    ${prep.length ? `<div class="prep"><b>Before the test</b>${prep.map(x => checkRow(x.a, today(), [])).join("")}</div>` : ""}
  </section>`;
}

function streakHtml() {
  const s = streak(), wk = [], ws = weekStart();
  for (let i = 0; i < 7; i++) { const k = addDays(ws, i); wk.push(`<span class="wd${hasLog(k) ? " on" : ""}${k === today() ? " now" : ""}" title="${esc(fmtDay(k))}">${"MTWTFSS"[i]}</span>`); }
  return `<section class="card mini"><h2 class="h-small">Streak</h2>
    <p class="big">${s}<small> ${s === 1 ? "day" : "days"}</small></p>
    <div class="weekdots" aria-label="Days logged this week">${wk.join("")}</div></section>`;
}

function checkRow(a, k, cards) {
  const done = actionDone(a, k), auto = a.auto && autoDone(a.auto, k);
  return `<button type="button" class="check${done ? " done" : ""}" data-act="tick" data-key="${esc(a.key)}" aria-pressed="${done}">
    <span class="box" aria-hidden="true"></span>
    <span class="ct"><span>${esc(a.text)}</span>${cards.length ? `<small>${esc(cards.join(" · "))}</small>` : ""}</span>
    ${auto ? `<span class="tag">auto</span>` : a.auto ? `<span class="tag soft">auto</span>` : ""}
  </button>`;
}

function checklistHtml(k) {
  const all = combinedActions();
  const daily = all.filter(x => x.a.freq === "daily"), weekly = all.filter(x => x.a.freq === "weekly");
  const once = all.filter(x => x.a.freq === "once" && !actionDone(x.a, k));
  const doneN = daily.filter(x => actionDone(x.a, k)).length;
  if (!all.length) return `<section class="card"><h2>Today's ikhtiar</h2><p class="muted">No active plan cards. Add one in <a href="#plan">My Ikhtiar Plan</a>.</p></section>`;
  return `<section class="card">
    <div class="row between"><h2>Today's ikhtiar</h2><span class="count">${doneN}/${daily.length}</span></div>
    ${Chart.bar(doneN, daily.length)}
    <div class="checks">${daily.map(x => checkRow(x.a, k, x.cards)).join("")}</div>
    ${weekly.length ? `<h3 class="h-small">This week</h3><div class="checks">${weekly.map(x => checkRow(x.a, k, x.cards)).join("")}</div>` : ""}
    ${once.length ? `<details class="once"><summary>One-time steps <span class="count">${once.length} left</span></summary><div class="checks">${once.map(x => checkRow(x.a, k, x.cards)).join("")}</div></details>` : ""}
    <p class="trust">I do my part, and the result is in Allah's hands.</p>
  </section>`;
}

function checkinSummary(k, d) {
  const chips = [];
  if (d.weight) chips.push(`${wShow(d.weight)} ${wUnit()}`);
  if (d.sleepH) chips.push(`Sleep ${d.sleepH} h`);
  if (exMin(k)) chips.push(`${exMin(k)} min exercise`);
  if (d.steps) chips.push(`${d.steps} steps`);
  if (d.mood) chips.push(`Mood ${d.mood}/5`);
  if (d.energy) chips.push(`Energy ${d.energy}/5`);
  if (d.meals && d.meals.length) chips.push(`${d.meals.length} meal${d.meals.length > 1 ? "s" : ""}`);
  const pr = Object.values(d.prayers || {}).filter(Boolean).length;
  if (pr) chips.push(`Prayers ${pr}/5`);
  return `<section class="card">
    <div class="row between"><h2>Daily check-in</h2>${chips.length ? `<span class="tag good">started</span>` : ""}</div>
    ${chips.length ? `<div class="chips">${chips.map(c => `<span class="chip">${esc(c)}</span>`).join("")}</div>` : `<p class="muted">Weight, sleep, exercise, meals, mood and more. Takes about a minute.</p>`}
    <a class="btn primary block" href="#checkin">${chips.length ? "Continue check-in" : "Start today's check-in"}</a>
  </section>`;
}

function hydrationHtml(k, d) {
  const tot = waterTotal(k), goal = waterGoal(k), sc = hydrationScore(k);
  const w = d.water || [];
  const last = w.length ? w[w.length - 1].t : null;
  const ago = last ? Math.round((Date.now() - last) / 60000) : null;
  const agoTxt = ago === null ? "No water logged yet today." : ago < 60 ? `Last drink ${ago} min ago.` : `Last drink ${Math.floor(ago / 60)} h ${ago % 60} min ago.`;
  const u = d.urine;
  return `<section class="card focus water">
    <div class="row between"><h2>Hydration <span class="pri">top priority</span></h2><span class="score" title="Days you reached your goal this week">${sc.met}/${sc.of} days</span></div>
    <p class="big">${litres(tot)}<small> of ${litres(goal)}</small></p>
    ${Chart.bar(tot, goal, "blue")}
    <p class="muted small">${esc(agoTxt)}${D().settings.waterReminder ? " I'll remind you gently after 2 hours while this page is open." : ""}</p>
    <div class="row wrap">
      <button class="btn water-btn" data-act="water" data-ml="250">+ 250 ml <small>glass</small></button>
      <button class="btn water-btn" data-act="water" data-ml="500">+ 500 ml <small>bottle</small></button>
      ${w.length ? `<button class="btn ghost small" data-act="waterUndo">Undo</button>` : ""}
    </div>
    <button type="button" class="toggle${d.hotDay ? " on" : ""}" data-act="hotDay" aria-pressed="${!!d.hotDay}"><span class="sw" aria-hidden="true"></span>Hot day or exercise day</button>
    ${d.hotDay ? `<p class="hint">Hot or active day: your goal today is 500 ml higher. Sip a little extra before and after exercise.</p>` : ""}
    <h3 class="h-small">Urine colour</h3>
    <div class="urine" role="group" aria-label="Urine colour, 1 pale to 5 dark">
      ${URINE.map((x, i) => `<button type="button" class="uc${u === i + 1 ? " on" : ""}" data-act="urine" data-v="${i + 1}" aria-pressed="${u === i + 1}" style="--uc:${x.c}"><span class="sw"></span><b>${i + 1}</b><small>${x.t}</small></button>`).join("")}
    </div>
    ${u ? `<p class="hint${u >= 4 ? " warn" : ""}">${esc(URINE[u - 1].hint)}</p>` : `<p class="muted small">Aim for 1–2. Tap the colour closest to yours.</p>`}
  </section>`;
}

function heartHtml(k) {
  const f = food(k), hs = heartScore(k), ex = weekEx(k), exGoal = D().goals.exerciseMinWeek || 150;
  return `<section class="card focus heart">
    <div class="row between"><h2>Heart-healthy eating</h2>${hs ? `<span class="score" title="Weekly heart-healthy score">${hs.score}/100</span>` : ""}</div>
    <div class="counters">
      ${FOODS.map(x => `<div class="counter${x.bad ? "" : " good"}"><span class="cl">${esc(x.t)}${x.sub ? `<small>${esc(x.sub)}</small>` : ""}</span>
        <span class="cc"><button class="rbtn" data-act="food" data-f="${x.f}" data-d="-1" aria-label="Less ${esc(x.t)}">−</button><b>${f[x.f] || 0}</b><button class="rbtn" data-act="food" data-f="${x.f}" data-d="1" aria-label="More ${esc(x.t)}">+</button></span></div>`).join("")}
    </div>
    <h3 class="h-small">Exercise this week</h3>
    <p class="big sm">${ex}<small> / ${exGoal} min</small></p>
    ${Chart.bar(ex, exGoal, "green")}
    <div class="row wrap"><button class="btn small ghost" data-act="exAdd" data-min="15">+ 15 min</button><button class="btn small ghost" data-act="exAdd" data-min="30">+ 30 min</button><a class="btn small ghost" href="#checkin">Add type…</a></div>
    ${hs ? `<p class="hint">${esc(scoreWord(hs.score))}. Food ${hs.food}/100 (${hs.foodDays} day${hs.foodDays === 1 ? "" : "s"} logged) and exercise ${hs.ex}% of goal.</p>` : `<p class="muted small">Tap + and − through the day. Your weekly heart-healthy score appears here.</p>`}
  </section>`;
}

function liverHtml(k, d) {
  const items = D().items.filter(i => !i.archived), lk = liverKidneyScore(k);
  const counts = d.items || {};
  const since = addDays(k, -90);
  const wPts = Object.keys(D().days).filter(x => x >= since && D().days[x].weight).sort().map(x => ({ d: x, v: wShow(D().days[x].weight) }));
  const cPts = Object.keys(D().days).filter(x => x >= since && D().days[x].waist).sort().map(x => ({ d: x, v: lShow(D().days[x].waist) }));
  const lastW = latestValue("weight"), lastC = latestValue("waist");
  const tw = D().goals.targetWeightKg, tc = D().goals.targetWaistCm;
  return `<section class="card focus liver">
    <div class="row between"><h2>Liver and kidney care</h2><span class="score" title="Weekly liver and kidney score">${lk.score}/100</span></div>
    <h3 class="h-small">Supplements and medicines today</h3>
    <div class="counters">
      ${items.map(i => `<div class="counter"><span class="cl">${esc(i.name)}${i.kind === "painkiller" ? `<small class="warn-t">Ask your doctor before taking regularly</small>` : i.pause ? `<small>Pause before your retest</small>` : ""}</span>
        <span class="cc"><button class="rbtn" data-act="item" data-id="${esc(i.id)}" data-d="-1" aria-label="Less ${esc(i.name)}">−</button><b>${counts[i.id] || 0}</b><button class="rbtn" data-act="item" data-id="${esc(i.id)}" data-d="1" aria-label="More ${esc(i.name)}">+</button></span></div>`).join("") || `<p class="muted small">No items yet.</p>`}
    </div>
    <a class="link small" href="#settings/items">Add or edit my items →</a>
    <h3 class="h-small">Weekly weight and waist</h3>
    <div class="grid2 tight">
      <label class="field"><span>Weight today (${wUnit()})</span><input type="number" inputmode="decimal" step="0.1" min="0" data-chg="measure" data-f="weight" value="${esc(wShow(d.weight))}" placeholder="${lastW ? esc(wShow(lastW.v)) : ""}"></label>
      <label class="field"><span>Waist today (${lUnit()})</span><input type="number" inputmode="decimal" step="0.5" min="0" data-chg="measure" data-f="waist" value="${esc(lShow(d.waist))}" placeholder="${lastC ? esc(lShow(lastC.v)) : ""}"></label>
    </div>
    <div class="grid2 tight">
      <div><p class="chart-t">Weight (${wUnit()})</p>${wPts.length ? Chart.line(wPts, { unit: wUnit(), height: 130, goal: tw ? wShow(tw) : null, label: "Weight trend" }) : `<p class="muted small">Log your weight once a week.</p>`}</div>
      <div><p class="chart-t">Waist (${lUnit()})</p>${cPts.length ? Chart.line(cPts, { unit: lUnit(), height: 130, goal: tc ? lShow(tc) : null, label: "Waist trend" }) : `<p class="muted small">Measure at the belly button, once a week.</p>`}</div>
    </div>
    <p class="hint">Score: water goal ${Math.round(lk.hyd * 100)}% of days · no painkillers ${Math.round(lk.noPain * 100)}% · 7h+ sleep ${Math.round(lk.sleep * 100)}% · measured ${lk.measured === 1 ? "yes" : lk.measured ? "half" : "not yet"}.</p>
  </section>`;
}

function weekSummaryHtml(k) {
  const days = weekKeys(k), logged = days.filter(hasLog).length;
  const avg = arr => arr.length ? round(arr.reduce((a, b) => a + b, 0) / arr.length) : null;
  const sleep = avg(days.map(x => dayOf(x).sleepH).filter(Boolean));
  const water = avg(days.map(waterTotal).filter(Boolean));
  const mood = avg(days.map(x => dayOf(x).mood).filter(Boolean));
  const energy = avg(days.map(x => dayOf(x).energy).filter(Boolean));
  const ws = days.map(x => dayOf(x).weight).filter(Boolean);
  const wChange = ws.length > 1 ? round(wShow(ws[ws.length - 1]) - wShow(ws[0])) : null;
  const b = bmi();
  const cell = (label, v) => `<div class="stat"><span>${label}</span><b>${v === null || v === undefined ? "—" : v}</b></div>`;
  return `<section class="card">
    <h2>This week <small class="muted">since Monday</small></h2>
    <div class="stats">
      ${cell("Days logged", `${logged}/${days.length}`)}
      ${cell("Exercise", `${weekEx(k)} min`)}
      ${cell("Avg sleep", sleep ? sleep + " h" : null)}
      ${cell("Avg water", water ? litres(water) : null)}
      ${cell("Avg mood", mood ? mood + "/5" : null)}
      ${cell("Avg energy", energy ? energy + "/5" : null)}
      ${cell("Weight change", wChange === null ? null : (wChange > 0 ? "+" : "") + wChange + " " + wUnit())}
      ${cell("BMI", b ? `${b.v} <small>${b.cat}</small>` : null)}
    </div>
  </section>`;
}

function backupNudge() {
  const s = D().settings, hasData = D().labs.length || Object.keys(D().days).length > 3;
  if (!hasData) return "";
  const n = s.lastBackup ? daysBetween(s.lastBackup.slice(0, 10), today()) : null;
  if (n !== null && n < 14) return "";
  return `<a class="banner soft" href="#settings">${n === null ? "You haven't backed up yet." : `Last backup ${n} days ago.`} Clearing browser data deletes everything. Tap to export a backup.</a>`;
}

// ---- actions ----
Act.tick = el => {
  const a = findAction(el.dataset.key);
  if (!a) return;
  const nowDone = toggleAction(a);
  const daily = combinedActions().filter(x => x.a.freq === "daily");
  const all = daily.length && daily.every(x => actionDone(x.a));
  commit(nowDone ? (all && a.freq === "daily" ? "goal" : "check") : "uncheck");
  if (nowDone && all && a.freq === "daily") toast("All of today's ikhtiar done. Alhamdulillah.", "good");
};
Act.water = el => {
  const k = today(), before = waterTotal(k), d = dayMut(k);
  (d.water = d.water || []).push({ t: Date.now(), ml: Number(el.dataset.ml) });
  const reached = before < waterGoal(k) && waterTotal(k) >= waterGoal(k);
  commit(reached ? "goal" : "drop");
  if (reached) toast("Water goal reached. Alhamdulillah!", "good");
  document.querySelectorAll(".toast.info").forEach(t => t.remove());
};
Act.waterUndo = () => { const d = dayMut(today()); if (d.water && d.water.length) { d.water.pop(); commit("undo"); } };
Act.hotDay = () => { const d = dayMut(today()); d.hotDay = !d.hotDay; commit("tap"); };
Act.urine = el => { const d = dayMut(today()), v = Number(el.dataset.v); d.urine = d.urine === v ? null : v; commit(v >= 4 ? "warn" : "tap"); };
Act.food = el => {
  const d = dayMut(el.dataset.k || today()); d.food = d.food || {};
  d.food[el.dataset.f] = Math.max(0, (d.food[el.dataset.f] || 0) + Number(el.dataset.d));
  commit(Number(el.dataset.d) > 0 ? "tap" : "undo");
};
Act.exAdd = el => {
  const k = today(), before = weekEx(k), d = dayMut(k), goal = D().goals.exerciseMinWeek || 150;
  (d.exercise = d.exercise || []).push({ type: "Exercise", min: Number(el.dataset.min) });
  const reached = before < goal && weekEx(k) >= goal;
  commit(reached ? "goal" : "check");
  if (reached) toast(`${goal} minutes this week. Alhamdulillah!`, "good");
};
Act.item = el => {
  const d = dayMut(today()); d.items = d.items || {};
  d.items[el.dataset.id] = Math.max(0, (d.items[el.dataset.id] || 0) + Number(el.dataset.d));
  if (!d.items[el.dataset.id]) delete d.items[el.dataset.id];
  commit(Number(el.dataset.d) > 0 ? "tap" : "undo");
};
Chg.measure = el => {
  const d = dayMut(today());
  d[el.dataset.f] = el.dataset.f === "weight" ? wSave(el.value) : lSave(el.value);
  if (d[el.dataset.f] === null) delete d[el.dataset.f];
  commit("save");
  return true;
};
