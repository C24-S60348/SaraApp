// Lab Results: reports, import by pasting text, manual entry, trends, latest vs previous.
let labCat = "all", labAbn = false, labDraft = null;
const LAB_TABS = [["", "Results"], ["trends", "Trends"], ["compare", "Compare"], ["add", "+ Add"]];
const EXAMPLE = "Haemoglobin: 14.0 g/dL (13.0–17.0)\nGlucose: 5.0 mmol/L (3.9–6.0) [FLAG]\nHDL-C: 1.2 mmol/L (>1.0)\nUrine protein: Negative (Negative)";

Views.labs = args => {
  const tab = args[0] || "";
  const head = `<header class="hello"><div><p class="eyebrow">Lab Results</p><h1>My reports</h1></div><span id="savestate" class="savestate" aria-live="polite"></span></header>
    <nav class="seg tabs4" aria-label="Lab pages">${LAB_TABS.map(([t, l]) => `<a href="#labs${t ? "/" + t : ""}" class="${(tab === t || (t === "" && tab === "r") || (t === "add" && tab === "edit")) ? "on" : ""}">${l}</a>`).join("")}</nav>`;
  if (tab === "add" || tab === "edit") return head + labEditor(tab === "edit" ? args[1] : null);
  if (!D().labs.length) return head + `<section class="card"><h2>No reports yet</h2><p>Add your first lab report. You can paste the results as text, one test per line:</p><pre class="example">${esc(EXAMPLE)}</pre><a class="btn primary" href="#labs/add">Add a report</a></section>`;
  if (tab === "trends") return head + trendsView(args[1]);
  if (tab === "compare") return head + compareView();
  return head + reportView(tab === "r" ? args[1] : null);
};

function reportView(id) {
  const reps = Labs.sortedReports();
  const rep = reps.find(r => r.id === id) || reps[reps.length - 1];
  const idx = rep.results.map((r, i) => Object.assign({ i }, r));
  const cats = CATEGORIES.filter(c => idx.some(r => r.cat === c));
  const shown = idx.filter(r => (labCat === "all" || r.cat === labCat) && (!labAbn || (r.flag && r.flag !== "N")));
  const abnN = idx.filter(r => r.flag && r.flag !== "N").length;
  return `<section class="card">
    <label class="field"><span>Report</span><select data-chg="labPick">${reps.slice().reverse().map(r => `<option value="${esc(r.id)}"${r === rep ? " selected" : ""}>${esc(fmtDate(r.date))}${r.lab ? " · " + esc(r.lab) : ""} (${r.results.length})</option>`).join("")}</select></label>
    <p class="muted small">${rep.results.length} tests · ${abnN} outside range</p>
    <label class="field"><span>Lab notes</span><textarea rows="2" data-inp="labNotes" data-id="${esc(rep.id)}" placeholder="e.g. sample hemolysed">${esc(rep.notes || "")}</textarea></label>
    <div class="row wrap"><a class="btn ghost small" href="#labs/edit/${esc(rep.id)}">Edit report</a><button class="btn ghost small" data-act="labDelete" data-id="${esc(rep.id)}">Delete report</button></div>
  </section>
  <div class="filterbar">
    <div class="chips scroll">${["all", ...cats].map(c => `<button type="button" class="chip btnchip${labCat === c ? " on" : ""}" data-act="labCat" data-v="${esc(c)}">${c === "all" ? "All" : esc(c)}</button>`).join("")}</div>
    <button type="button" class="toggle${labAbn ? " on" : ""}" data-act="labAbn" aria-pressed="${labAbn}"><span class="sw" aria-hidden="true"></span>Abnormal only</button>
  </div>
  ${CATEGORIES.map(cat => {
    const rows = shown.filter(r => r.cat === cat);
    if (!rows.length) return "";
    return `<section class="card"><h2 class="h-small">${esc(cat)}</h2><div class="labrows">${rows.map(r => `<div class="labrow${r.flag && r.flag !== "N" ? " abn" : ""}">
      <div class="lr-name"><b>${esc(r.name)}</b>${r.ref ? `<small>Range ${esc(r.ref)}</small>` : ""}</div>
      <div class="lr-val"><b>${esc(Labs.valueText(r))}</b> <small>${esc(r.unit || "")}</small></div>
      <div class="lr-flag">${flagBadge(r.flag)}</div>
      <div class="lr-act"><a class="link small" href="#labs/trends/${encodeURIComponent(r.key)}">Trend</a>${r.flag && r.flag !== "N" ? ` <a class="link small" href="#followups/new/lab/${esc(rep.id)}/${r.i}">+ Follow-up</a>` : ""}</div>
    </div>`).join("")}</div></section>`;
  }).join("") || `<div class="card"><p class="muted">No results match this filter.</p></div>`}`;
}

function allTests() {
  const map = new Map();
  Labs.sortedReports().forEach(rep => rep.results.forEach(r => {
    const m = map.get(r.key) || { key: r.key, name: r.name, cat: r.cat, n: 0, last: null };
    m.n++; m.name = r.name; m.cat = r.cat; m.last = Object.assign({ date: rep.date }, r);
    map.set(r.key, m);
  }));
  return [...map.values()];
}

function trendsView(key) {
  if (key) {
    const s = Labs.series(key);
    if (!s.length) return `<div class="card"><p>No results for this test.</p></div>`;
    const last = s[s.length - 1], ref = Labs.parseRef(last.ref);
    const nums = s.filter(r => r.num !== null && r.num !== undefined);
    const cards = D().plan.filter(c => c.tests.some(t => Labs.canon(t) === key));
    return `<a class="link" href="#labs/trends">← All tests</a>
    <section class="card"><h2>${esc(last.name)}</h2><p class="muted small">${esc(last.cat)}${last.ref ? " · range " + esc(last.ref) + " " + esc(last.unit || "") : ""}</p>
      ${nums.length ? Chart.line(nums.map(r => ({ d: r.date, v: r.num, flag: r.flag })), { lo: ref.lo, hi: ref.hi, unit: last.unit, height: 190, label: last.name + " trend" }) : `<p class="muted">Text results only, so there is no chart.</p>`}
      ${ref.lo !== null || ref.hi !== null ? `<p class="muted small"><span class="legend-band"></span> shaded area = reference range</p>` : ""}
      <table class="tbl"><thead><tr><th>Date</th><th>Result</th><th>Flag</th></tr></thead><tbody>
      ${s.slice().reverse().map(r => `<tr><td>${esc(fmtDate(r.date))}</td><td>${esc(Labs.valueText(r))} ${esc(r.unit || "")}</td><td>${flagBadge(r.flag)}</td></tr>`).join("")}</tbody></table>
      ${cards.length ? `<p class="small">On your plan: ${cards.map(c => `<a href="#plan/${esc(c.id)}">${esc(c.title)}</a>`).join(", ")}</p>` : ""}
    </section>`;
  }
  const tests = allTests();
  return `<label class="field"><span>Find a test</span><input type="search" data-inp="trendSearch" placeholder="e.g. LDL"></label>
  ${CATEGORIES.map(cat => {
    const rows = tests.filter(t => t.cat === cat);
    if (!rows.length) return "";
    return `<section class="card trendcat"><h2 class="h-small">${esc(cat)}</h2>${rows.map(t => `<a class="trendlink" data-name="${esc(t.name.toLowerCase())}" href="#labs/trends/${encodeURIComponent(t.key)}"><span>${esc(t.name)}</span><span class="muted small">${t.n} result${t.n > 1 ? "s" : ""}</span>${flagBadge(t.last.flag)}</a>`).join("")}</section>`;
  }).join("")}`;
}
Chg.trendSearch = el => {
  const q = el.value.trim().toLowerCase();
  $$(".trendlink").forEach(a => { a.hidden = q && !a.dataset.name.includes(q); });
  $$(".trendcat").forEach(s => { s.hidden = !s.querySelector(".trendlink:not([hidden])"); });
  return false;
};

function compareView() {
  const reps = Labs.sortedReports();
  if (reps.length < 2) return `<div class="card"><p>You need at least two reports to compare. Add your next report after your retest.</p></div>`;
  const cur = reps[reps.length - 1], prev = reps[reps.length - 2];
  const keys = [...new Set([...prev.results.map(r => r.key), ...cur.results.map(r => r.key)])];
  const find = (rep, k) => rep.results.find(r => r.key === k);
  const verdict = (a, b) => {
    if (!a || !b) return "";
    const da = Labs.distance(a), db = Labs.distance(b);
    if (db < da - 1e-9) return db === 0 ? "now normal" : "better";
    if (db > da + 1e-9) return "worse";
    return "same";
  };
  const rows = keys.map(k => { const a = find(prev, k), b = find(cur, k); return { k, a, b, v: verdict(a, b), name: (b || a).name, cat: (b || a).cat }; })
    .sort((x, y) => CATEGORIES.indexOf(x.cat) - CATEGORIES.indexOf(y.cat));
  const cardRes = D().plan.filter(c => !c.archived).map(c => {
    const vs = c.tests.map(t => rows.find(r => r.k === Labs.canon(t))).filter(r => r && r.v);
    if (!vs.length) return null;
    const worse = vs.some(r => r.v === "worse"), allNorm = vs.every(r => Labs.distance(r.b) === 0);
    const better = vs.some(r => r.v === "better" || r.v === "now normal");
    return { c, label: allNorm ? "In range now" : worse ? "Needs attention" : better ? "Improved" : "No change", cls: allNorm ? "good" : worse ? "bad" : better ? "good" : "plain" };
  }).filter(Boolean);
  const change = (a, b) => {
    if (!a || !b || a.num === null || b.num === null || a.num === undefined || b.num === undefined) return "";
    const d = b.num - a.num, pct = a.num ? Math.round(d / Math.abs(a.num) * 100) : null;
    return `${d > 0 ? "▲" : d < 0 ? "▼" : "="} ${Labs.fmtNum(Math.abs(d))}${pct !== null && d ? ` (${pct > 0 ? "+" : ""}${pct}%)` : ""}`;
  };
  return `<section class="card"><h2>Plan cards</h2><p class="muted small">${esc(fmtDate(prev.date))} → ${esc(fmtDate(cur.date))}</p>
    ${cardRes.length ? `<div class="cmp-cards">${cardRes.map(x => `<a href="#plan/${esc(x.c.id)}" class="cmp-card"><span>${esc(x.c.title)}</span><span class="status ${x.cls}">${x.label}</span></a>`).join("")}</div>` : `<p class="muted">No plan card tests appear in both reports.</p>`}
  </section>
  <section class="card"><h2>All tests</h2>
    <div class="tbl-wrap"><table class="tbl cmp"><thead><tr><th>Test</th><th>${esc(fmtDate(prev.date))}</th><th>${esc(fmtDate(cur.date))}</th><th>Change</th></tr></thead><tbody>
    ${rows.map(r => `<tr class="v-${r.v.replace(" ", "-")}"><td><a href="#labs/trends/${encodeURIComponent(r.k)}">${esc(r.name)}</a></td>
      <td>${r.a ? esc(Labs.valueText(r.a)) + " " + flagBadge(r.a.flag) : "—"}</td>
      <td>${r.b ? esc(Labs.valueText(r.b)) + " " + flagBadge(r.b.flag) : "—"}</td>
      <td>${esc(change(r.a, r.b))}${r.v && r.v !== "same" ? ` <span class="vd ${r.v === "worse" ? "bad" : "good"}">${r.v}</span>` : ""}</td></tr>`).join("")}
    </tbody></table></div>
  </section>`;
}

// ---- add / edit / import ----
function labEditor(id) {
  if (!labDraft || labDraft.id !== (id || null)) {
    const rep = id ? D().labs.find(r => r.id === id) : null;
    labDraft = rep ? { id, date: rep.date, lab: rep.lab || "", notes: rep.notes || "", mode: "manual", text: "", rows: rep.results.map(r => Object.assign({}, r)), errors: [] }
      : { id: null, date: today(), lab: "", notes: "", mode: "paste", text: "", rows: [], errors: [] };
  }
  const L = labDraft;
  return `<section class="card form">
    <h2>${L.id ? "Edit report" : "New report"}</h2>
    <div class="grid2 tight">
      <label class="field"><span>Report date</span><input type="date" data-inp="ld" data-f="date" value="${esc(L.date)}" max="${today()}"></label>
      <label class="field"><span>Lab name <small>optional</small></span><input data-inp="ld" data-f="lab" value="${esc(L.lab)}"></label>
    </div>
    <label class="field"><span>Lab notes <small>optional</small></span><input data-inp="ld" data-f="notes" value="${esc(L.notes)}" placeholder="e.g. sample hemolysed"></label>
    ${L.id ? "" : `<div class="seg two" role="tablist"><button type="button" class="${L.mode === "paste" ? "on" : ""}" data-act="ldMode" data-v="paste">Paste text</button><button type="button" class="${L.mode === "manual" ? "on" : ""}" data-act="ldMode" data-v="manual">Type one by one</button></div>`}
    ${L.mode === "paste" && !L.id ? `
      <label class="field"><span>Paste results, one per line: <code>Test name: value unit (range)</code></span>
      <textarea rows="7" data-inp="ld" data-f="text" class="mono" placeholder="${esc(EXAMPLE)}">${esc(L.text)}</textarea></label>
      <p class="muted small">Ranges like 3.5–5.1, &lt;2.6 or &gt;60 and words like Negative or Non reactive all work. Notes in [square brackets] are ignored. Start urine tests with “Urine” (e.g. Urine bilirubin).</p>
      <button class="btn primary" data-act="ldParse">Read lines</button>` : ""}
  </section>
  ${L.errors.length ? `<section class="banner warn"><b>${L.errors.length} line${L.errors.length > 1 ? "s" : ""} could not be read.</b> Fix them in the box above, or add them below by hand:<ul>${L.errors.map(e => `<li><code>${esc(e.raw)}</code></li>`).join("")}</ul></section>` : ""}
  ${L.rows.length || L.mode === "manual" || L.id ? `<section class="card">
    <h2>${L.mode === "paste" && !L.id ? "Check before saving" : "Results"} <small class="muted">${L.rows.length}</small></h2>
    <div class="prev-rows">${L.rows.map((r, i) => `<div class="prev-row${r.flag && r.flag !== "N" ? " abn" : ""}">
      <label class="field pr-name"><span>Test</span><input data-chg="ldRow" data-i="${i}" data-f="name" value="${esc(r.name)}"></label>
      <label class="field"><span>Value</span><input data-chg="ldRow" data-i="${i}" data-f="value" value="${esc(Labs.valueText(r))}"></label>
      <label class="field"><span>Unit</span><input data-chg="ldRow" data-i="${i}" data-f="unit" value="${esc(r.unit || "")}"></label>
      <label class="field"><span>Range</span><input data-chg="ldRow" data-i="${i}" data-f="ref" value="${esc(r.ref || "")}"></label>
      <label class="field"><span>Group</span><select data-chg="ldRow" data-i="${i}" data-f="cat">${CATEGORIES.map(c => `<option${r.cat === c ? " selected" : ""}>${c}</option>`).join("")}</select></label>
      <div class="pr-end">${flagBadge(r.flag) || `<span class="flag">—</span>`}<button class="rbtn" data-act="ldDel" data-i="${i}" aria-label="Remove row">×</button></div>
    </div>`).join("")}</div>
    <button class="btn ghost small" data-act="ldAdd">+ Add a test</button>
  </section>` : ""}
  ${L.rows.length ? `<div class="row end"><button class="btn ghost" data-act="ldCancel">Cancel</button><button class="btn primary" data-act="ldSave">Save report</button></div>` : ""}`;
}
Chg.ld = el => { labDraft[el.dataset.f] = el.value; return false; };
Act.ldMode = el => { labDraft.mode = el.dataset.v; if (el.dataset.v === "manual" && !labDraft.rows.length) labDraft.rows.push(Labs.finish({ name: "", num: null, qual: "", text: "", unit: "", ref: "" })); Sound.play("tap"); };
Act.ldParse = () => {
  const parsed = Labs.parseText(labDraft.text);
  labDraft.errors = parsed.filter(p => p.error);
  labDraft.rows = labDraft.rows.filter(r => r.name).concat(parsed.filter(p => !p.error));
  if (!parsed.length) { toast("Paste some lines first.", "bad"); return; }
  Sound.play(labDraft.errors.length ? "warn" : "check");
  toast(`${parsed.length - labDraft.errors.length} test${parsed.length - labDraft.errors.length === 1 ? "" : "s"} read. Check them below.`);
};
function setValue(r, str) {
  const s = String(str).trim(), m = s.match(/^([<>≤≥]=?)?\s*(-?\d[\d.,]*)$/);
  if (m) { r.qual = (m[1] || "").replace("≤", "<").replace("≥", ">").replace("=", ""); r.num = Number(m[2].replace(",", ".")); r.text = ""; }
  else { r.qual = ""; r.num = null; r.text = s; }
}
Chg.ldRow = el => {
  const r = labDraft.rows[Number(el.dataset.i)], f = el.dataset.f;
  if (f === "value") setValue(r, el.value);
  else r[f] = el.value.trim();
  if (f === "name") r.cat = Labs.category(r.name);
  Labs.finish(r);
  return true;
};
Act.ldAdd = () => { labDraft.rows.push(Labs.finish({ name: "", num: null, qual: "", text: "", unit: "", ref: "" })); Sound.play("tap"); };
Act.ldDel = el => { labDraft.rows.splice(Number(el.dataset.i), 1); Sound.play("undo"); };
Act.ldCancel = () => { const id = labDraft.id; labDraft = null; location.hash = id ? "#labs/r/" + id : "#labs"; return false; };
Act.ldSave = () => {
  const L = labDraft;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(L.date)) { toast("Please enter the report date.", "bad"); return false; }
  const rows = L.rows.filter(r => r.name && (r.num !== null || r.text)).map(r => {
    const o = { name: r.name, num: r.num, qual: r.qual || "", text: r.text || "", unit: r.unit || "", ref: r.ref || "", cat: r.cat };
    return Labs.finish(o);
  });
  if (!rows.length) { toast("Add at least one test with a value.", "bad"); return false; }
  const rep = { id: L.id || uid("rep"), date: L.date, lab: L.lab.trim(), notes: L.notes.trim(), results: rows };
  if (L.id) D().labs = D().labs.map(r => r.id === L.id ? rep : r); else D().labs.push(rep);
  labDraft = null;
  if (commit("goal")) {
    const matched = D().plan.filter(c => c.tests.some(t => rows.some(r => r.key === Labs.canon(t)))).length;
    toast(`Report saved${matched ? `. ${matched} plan card${matched > 1 ? "s" : ""} updated` : ""}.`, "good");
  }
  location.hash = "#labs/r/" + rep.id;
  return false;
};

Chg.labPick = el => { location.hash = "#labs/r/" + el.value; return false; };
let notesTimer = 0;
Chg.labNotes = el => { clearTimeout(notesTimer); notesTimer = setTimeout(() => { const r = D().labs.find(x => x.id === el.dataset.id); if (r) { r.notes = el.value; commit(); } }, 400); return false; };
Act.labCat = el => { labCat = el.dataset.v; Sound.play("tap"); };
Act.labAbn = () => { labAbn = !labAbn; Sound.play("tap"); };
Act.labDelete = async el => {
  const r = D().labs.find(x => x.id === el.dataset.id);
  if (!(await ask({ title: "Delete this report?", body: `<p>The report from ${esc(fmtDate(r.date))} with ${r.results.length} tests will be deleted. This cannot be undone (unless you have a backup).</p>`, ok: "Delete", danger: true }))) return;
  D().labs = D().labs.filter(x => x !== r);
  commit("undo");
  location.hash = "#labs";
  render();
};
