// Daily check-in: one form per day. Everything saves as you type.
const MOOD = ["Very low", "Low", "Okay", "Good", "Great"];
const ENERGY = ["Drained", "Tired", "Okay", "Good", "Full"];
const SLEEPQ = ["Very poor", "Poor", "Okay", "Good", "Very good"];
const PRAYERS = ["Subuh", "Zohor", "Asar", "Maghrib", "Isyak"];
const EX_TYPES = ["Walk", "Brisk walk", "Jog", "Cycling", "Gym", "Swimming", "Badminton", "Futsal", "Yoga", "Stretching", "Hiking", "Exercise"];

function seg(k, field, labels, cur) {
  return `<div class="seg" role="group">${labels.map((l, i) => `<button type="button" class="${cur === i + 1 ? "on" : ""}" data-act="ciSet" data-k="${k}" data-f="${field}" data-v="${i + 1}" aria-pressed="${cur === i + 1}"><b>${i + 1}</b><small>${esc(l)}</small></button>`).join("")}</div>`;
}
const fld = (k, f, label, val, attrs = "") => `<label class="field"><span>${label}</span><input ${attrs} data-chg="ci" data-k="${k}" data-f="${f}" value="${esc(val ?? "")}"></label>`;

Views.checkin = args => {
  let k = args[0] && /^\d{4}-\d{2}-\d{2}$/.test(args[0]) ? args[0] : today();
  if (k > today()) k = today();
  const d = dayOf(k), f = food(k);
  const isToday = k === today();
  const ex = d.exercise || [], meals = d.meals || [], pr = d.prayers || {};
  const uri = d.urinary;
  return `
  <header class="hello"><div><p class="eyebrow">Daily check-in</p><h1>${isToday ? "Today" : esc(fmtDay(k))}</h1></div><span id="savestate" class="savestate" aria-live="polite"></span></header>
  <div class="datebar">
    <a class="btn ghost small" href="#checkin/${addDays(k, -1)}" aria-label="Previous day">←</a>
    <input type="date" value="${k}" max="${today()}" data-chg="ciDate" aria-label="Choose a day">
    ${isToday ? `<span class="btn ghost small disabled" aria-hidden="true">→</span>` : `<a class="btn ghost small" href="#checkin/${addDays(k, 1)}" aria-label="Next day">→</a>`}
  </div>

  <section class="card"><h2>Body</h2>
    <div class="grid2 tight">
      ${fld(k, "weight", `Weight (${wUnit()})`, wShow(d.weight), 'type="number" inputmode="decimal" step="0.1" min="0" data-t="w"')}
      ${fld(k, "waist", `Waist (${lUnit()}) <small>weekly</small>`, lShow(d.waist), 'type="number" inputmode="decimal" step="0.5" min="0" data-t="l"')}
    </div>
  </section>

  <section class="card"><h2>Sleep</h2>
    ${fld(k, "sleepH", "Hours slept", d.sleepH, 'type="number" inputmode="decimal" step="0.5" min="0" max="24" data-t="n"')}
    <p class="label">Sleep quality</p>${seg(k, "sleepQ", SLEEPQ, d.sleepQ)}
  </section>

  <section class="card"><h2>Movement</h2>
    <datalist id="ex-types">${EX_TYPES.map(t => `<option value="${t}">`).join("")}</datalist>
    ${ex.map((e, i) => `<div class="exrow">
      <label class="field"><span>Type</span><input list="ex-types" data-chg="exField" data-k="${k}" data-i="${i}" data-f="type" value="${esc(e.type)}"></label>
      <label class="field small-f"><span>Minutes</span><input type="number" inputmode="numeric" min="0" data-chg="exField" data-k="${k}" data-i="${i}" data-f="min" value="${esc(e.min)}"></label>
      <button class="rbtn" data-act="exDel" data-k="${k}" data-i="${i}" aria-label="Remove">×</button></div>`).join("")}
    <button class="btn ghost small" data-act="exRow" data-k="${k}">+ Add exercise</button>
    ${fld(k, "steps", "Steps", d.steps, 'type="number" inputmode="numeric" min="0" step="100" data-t="n"')}
    <p class="muted small">This week: ${weekEx(k)} of ${D().goals.exerciseMinWeek} minutes.</p>
  </section>

  <section class="card"><h2>Meals and notes</h2>
    ${meals.map((m, i) => `<div class="meal"><span>${esc(m.text)}</span>
      <div class="seg tags">${["healthy", "okay", "heavy"].map(t => `<button type="button" class="${m.tag === t ? "on " + t : ""}" data-act="mealTag" data-k="${k}" data-i="${i}" data-v="${t}">${t}</button>`).join("")}</div>
      <button class="rbtn" data-act="mealDel" data-k="${k}" data-i="${i}" aria-label="Remove meal">×</button></div>`).join("")}
    <div class="row addrow"><input id="meal-text" placeholder="e.g. Nasi lemak, teh o kosong" aria-label="Meal"><button class="btn primary small" data-act="mealAdd" data-k="${k}">Add</button></div>
    <p class="label">Food counts</p>
    <div class="counters">${FOODS.map(x => `<div class="counter${x.bad ? "" : " good"}"><span class="cl">${esc(x.t)}</span><span class="cc"><button class="rbtn" data-act="food" data-k="${k}" data-f="${x.f}" data-d="-1" aria-label="Less">−</button><b>${f[x.f] || 0}</b><button class="rbtn" data-act="food" data-k="${k}" data-f="${x.f}" data-d="1" aria-label="More">+</button></span></div>`).join("")}</div>
    <label class="field"><span>Notes</span><textarea rows="2" data-inp="ciText" data-k="${k}" data-f="notes">${esc(d.notes || "")}</textarea></label>
  </section>

  <section class="card"><h2>Mood and energy</h2>
    <p class="label">Mood</p>${seg(k, "mood", MOOD, d.mood)}
    <p class="label">Energy</p>${seg(k, "energy", ENERGY, d.energy)}
  </section>

  <details class="card"${d.bpSys || d.rhr ? " open" : ""}><summary><h2>Blood pressure and heart rate <small class="muted">optional</small></h2></summary>
    <div class="grid3">
      ${fld(k, "bpSys", "Systolic", d.bpSys, 'type="number" inputmode="numeric" min="40" max="260" data-t="n"')}
      ${fld(k, "bpDia", "Diastolic", d.bpDia, 'type="number" inputmode="numeric" min="30" max="160" data-t="n"')}
      ${fld(k, "rhr", "Resting HR", d.rhr, 'type="number" inputmode="numeric" min="30" max="200" data-t="n"')}
    </div>
    ${d.bpSys && d.bpDia ? `<p class="hint${d.bpSys >= 140 || d.bpDia >= 90 ? " warn" : ""}">${d.bpSys >= 180 || d.bpDia >= 120 ? "Very high reading. Sit quietly for 5 minutes and measure again. If it stays this high, get medical help today." : d.bpSys >= 140 || d.bpDia >= 90 ? "Higher than ideal. Re-check at rest on other days and mention it to your doctor." : "In a comfortable range."}</p>` : ""}
  </details>

  <details class="card"${uri ? " open" : ""}><summary><h2>Urinary symptoms <small class="muted">for the PSA card</small></h2></summary>
    <div class="checks">${Object.entries(URINARY_LABELS).map(([id, t]) => { const on = (uri || []).includes(id); return `<button type="button" class="check${on ? " done" : ""}${RED_URINARY.includes(id) ? " red" : ""}" data-act="uriToggle" data-k="${k}" data-v="${id}" aria-pressed="${on}"><span class="box" aria-hidden="true"></span><span class="ct">${esc(t)}</span></button>`; }).join("")}</div>
    <button class="btn ghost small" data-act="uriNone" data-k="${k}">${Array.isArray(uri) && !uri.length ? "✓ None today" : "None today"}</button>
  </details>

  <section class="card"><h2>Prayers and reflection <small class="muted">optional</small></h2>
    <div class="prayers">${PRAYERS.map(p => `<button type="button" class="pray${pr[p] ? " on" : ""}" data-act="pray" data-k="${k}" data-v="${p}" aria-pressed="${!!pr[p]}">${p}</button>`).join("")}</div>
    <label class="field"><span>Reflection or du'a</span><textarea rows="3" data-inp="ciText" data-k="${k}" data-f="reflection" placeholder="A short note, a du'a, something I'm grateful for…">${esc(d.reflection || "")}</textarea></label>
  </section>

  <a class="btn primary block" href="#home" data-act="ciDone">Done</a>`;
};

// ---- check-in actions ----
const kOf = el => el.dataset.k || today();
Chg.ciDate = el => { if (el.value) location.hash = "#checkin/" + el.value; return false; };
Chg.ci = el => {
  const d = dayMut(kOf(el)), t = el.dataset.t, f = el.dataset.f;
  let v = t === "w" ? wSave(el.value) : t === "l" ? lSave(el.value) : numOrNull(el.value);
  if (v === null) delete d[f]; else d[f] = v;
  commit("save");
  return f === "bpSys" || f === "bpDia";
};
let textTimer = 0;
Chg.ciText = el => {
  clearTimeout(textTimer);
  textTimer = setTimeout(() => { const d = dayMut(kOf(el)); d[el.dataset.f] = el.value; if (!el.value) delete d[el.dataset.f]; commit(); }, 400);
  return false;
};
Act.ciSet = el => { const d = dayMut(kOf(el)), v = Number(el.dataset.v); d[el.dataset.f] = d[el.dataset.f] === v ? null : v; commit("tap"); };
Act.exRow = el => { const d = dayMut(kOf(el)); (d.exercise = d.exercise || []).push({ type: "Walk", min: 30 }); commit("check"); };
Act.exDel = el => { const d = dayMut(kOf(el)); d.exercise.splice(Number(el.dataset.i), 1); commit("undo"); };
Chg.exField = el => {
  const e = dayMut(kOf(el)).exercise[Number(el.dataset.i)];
  e[el.dataset.f] = el.dataset.f === "min" ? (numOrNull(el.value) || 0) : el.value;
  commit("save");
  return false;
};
Act.mealAdd = el => {
  const inp = $("#meal-text"), text = inp.value.trim();
  if (!text) { inp.focus(); return false; }
  const d = dayMut(kOf(el)); (d.meals = d.meals || []).push({ text, tag: null });
  commit("check");
};
Act.mealTag = el => { const m = dayMut(kOf(el)).meals[Number(el.dataset.i)]; m.tag = m.tag === el.dataset.v ? null : el.dataset.v; commit("tap"); };
Act.mealDel = el => { dayMut(kOf(el)).meals.splice(Number(el.dataset.i), 1); commit("undo"); };
Act.pray = el => { const d = dayMut(kOf(el)); d.prayers = d.prayers || {}; d.prayers[el.dataset.v] = !d.prayers[el.dataset.v]; commit(d.prayers[el.dataset.v] ? "check" : "uncheck"); };
Act.uriToggle = el => {
  const d = dayMut(kOf(el)); d.urinary = d.urinary || [];
  const i = d.urinary.indexOf(el.dataset.v);
  if (i >= 0) d.urinary.splice(i, 1); else d.urinary.push(el.dataset.v);
  commit(RED_URINARY.includes(el.dataset.v) && i < 0 ? "warn" : "tap");
  if (RED_URINARY.includes(el.dataset.v) && i < 0) toast("Please see a doctor soon about this.", "bad", 5000);
};
Act.uriNone = el => { const d = dayMut(kOf(el)); d.urinary = []; commit("check"); };
Act.ciDone = () => { Sound.play("goal"); toast("Check-in saved. May Allah put barakah in your effort.", "good"); location.hash = "#home"; return false; };
