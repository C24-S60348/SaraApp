// Shared helpers and the numbers the pages show (totals, streaks, scores, alerts).
const D = () => Store.data;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const pad = n => String(n).padStart(2, "0");
const uid = p => p + "_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const round = (v, d = 1) => Math.round(v * 10 ** d) / 10 ** d;
const numOrNull = v => { if (v === "" || v === null || v === undefined) return null; const n = Number(String(v).replace(",", ".")); return Number.isFinite(n) ? n : null; };

// ---- dates (local time, "YYYY-MM-DD") ----
const dkey = d => d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
const parseKey = k => { const [y, m, d] = k.split("-").map(Number); return new Date(y, m - 1, d); };
const today = () => dkey(new Date());
const addDays = (k, n) => { const d = parseKey(k); d.setDate(d.getDate() + n); return dkey(d); };
const weekStart = (k = today()) => { const d = parseKey(k); d.setDate(d.getDate() - (d.getDay() + 6) % 7); return dkey(d); };
const daysBetween = (a, b) => Math.round((parseKey(b) - parseKey(a)) / 864e5);
const fmtDay = k => parseKey(k).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
const fmtDate = k => k ? parseKey(k).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "";
const weekKeys = (k = today()) => { const s = weekStart(k), out = []; for (let i = 0; i < 7; i++) { const d = addDays(s, i); if (d <= today()) out.push(d); } return out; };
function relDays(k) {
  const n = daysBetween(today(), k);
  if (n === 0) return "today"; if (n === 1) return "tomorrow"; if (n === -1) return "yesterday";
  return n > 0 ? `in ${n} days` : `${-n} days ago`;
}

// ---- units (saved in kg and cm, shown in your units) ----
const wUnit = () => D().settings.weightUnit;
const lUnit = () => D().settings.lengthUnit;
const wShow = kg => kg === null || kg === undefined ? "" : wUnit() === "lb" ? round(kg * 2.20462) : round(kg);
const wSave = v => { const n = numOrNull(v); return n === null ? null : wUnit() === "lb" ? n / 2.20462 : n; };
const lShow = cm => cm === null || cm === undefined ? "" : lUnit() === "in" ? round(cm / 2.54) : round(cm);
const lSave = v => { const n = numOrNull(v); return n === null ? null : lUnit() === "in" ? n * 2.54 : n; };
const litres = ml => round(ml / 1000, 2) + " L";

// ---- days ----
const dayOf = k => D().days[k] || {};
function dayMut(k) { return D().days[k] || (D().days[k] = {}); }
const waterTotal = k => (dayOf(k).water || []).reduce((a, w) => a + w.ml, 0);
const waterGoal = k => D().goals.waterMl + (dayOf(k).hotDay ? 500 : 0);
const exMin = k => (dayOf(k).exercise || []).reduce((a, e) => a + (Number(e.min) || 0), 0);
const weekEx = (k = today()) => weekKeys(k).reduce((a, d) => a + exMin(d), 0);
const food = k => dayOf(k).food || {};
function hasLog(k) {
  const d = dayOf(k);
  return !!((d.water && d.water.length) || d.weight || d.sleepH || d.mood || d.energy || (d.exercise && d.exercise.length) ||
    d.food || (d.meals && d.meals.length) || (d.ticks && Object.values(d.ticks).some(Boolean)) || d.urine || d.steps || d.notes);
}
function streak() {
  let k = today(), n = 0;
  if (!hasLog(k)) k = addDays(k, -1);
  while (hasLog(k)) { n++; k = addDays(k, -1); }
  return n;
}
function latestValue(field, upTo = today()) {
  const keys = Object.keys(D().days).filter(k => k <= upTo && D().days[k][field] !== null && D().days[k][field] !== undefined).sort();
  const k = keys[keys.length - 1];
  return k ? { d: k, v: D().days[k][field] } : null;
}
function bmi() {
  const h = D().settings.heightCm, w = latestValue("weight");
  if (!h || !w) return null;
  const v = w.v / ((h / 100) ** 2);
  // Malaysian / Asian cut-offs
  const cat = v < 18.5 ? "Underweight" : v < 23 ? "Healthy range" : v < 27.5 ? "Overweight" : "Obese";
  return { v: round(v), cat };
}

// ---- weekly scores ----
function dayHeart(k) {
  const f = food(k);
  if (!dayOf(k).food) return null;
  const s = 70 + 6 * Math.min(f.fibre || 0, 5) - 12 * (f.fried || 0) - 12 * (f.santan || 0) - 15 * (f.sweet || 0) - 15 * (f.fast || 0);
  return Math.max(0, Math.min(100, s));
}
function heartScore(k = today()) {
  const days = weekKeys(k), scores = days.map(dayHeart).filter(s => s !== null);
  const ex = Math.min(100, weekEx(k) / (D().goals.exerciseMinWeek || 150) * 100);
  if (!scores.length && !weekEx(k)) return null;
  const foodAvg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 50;
  return { score: Math.round(foodAvg * 0.6 + ex * 0.4), food: Math.round(foodAvg), foodDays: scores.length, ex: Math.round(ex) };
}
function hydrationScore(k = today()) {
  const days = weekKeys(k), met = days.filter(d => waterTotal(d) >= waterGoal(d)).length;
  return { met, of: days.length, score: Math.round(met / days.length * 100) };
}
function liverKidneyScore(k = today()) {
  const days = weekKeys(k), n = days.length;
  const painIds = D().items.filter(i => i.kind === "painkiller").map(i => i.id);
  const hyd = days.filter(d => waterTotal(d) >= waterGoal(d)).length / n;
  const noPain = days.filter(d => !painIds.some(id => (dayOf(d).items || {})[id] > 0)).length / n;
  const sleep = days.filter(d => (dayOf(d).sleepH || 0) >= 7).length / n;
  const measured = (days.some(d => dayOf(d).weight) ? 0.5 : 0) + (days.some(d => dayOf(d).waist) ? 0.5 : 0);
  return { score: Math.round(hyd * 40 + noPain * 20 + sleep * 20 + measured * 20), hyd, noPain, sleep, measured };
}
function scoreWord(s) { return s === null ? "" : s >= 80 ? "Strong week" : s >= 60 ? "Good effort" : s >= 40 ? "Building up" : "A gentle start"; }

// ---- plan actions ----
const activeCards = () => D().plan.filter(c => !c.archived && !c.resolved);
const fuById = id => D().followups.find(f => f.id === id);
function autoDone(type, k) {
  const d = dayOf(k);
  switch (type) {
    case "water": return waterTotal(k) >= waterGoal(k);
    case "urine": return !!d.urine;
    case "fibre": return (food(k).fibre || 0) >= 3;
    case "sleep": return (d.sleepH || 0) >= 7;
    case "exercise": return weekEx(k) >= (D().goals.exerciseMinWeek || 150);
    case "weighweek": return weekKeys(k).some(x => dayOf(x).weight) && weekKeys(k).some(x => dayOf(x).waist);
    case "urinary": return Array.isArray(d.urinary);
    default: return false;
  }
}
function actionDone(a, k = today()) {
  if (a.fu && fuById(a.fu)) return fuById(a.fu).status === "done";
  if (a.freq === "once") return !!D().onceTicks[a.key];
  if (a.auto && autoDone(a.auto, k)) return true;
  if (a.freq === "weekly") return !!(D().weekTicks[weekStart(k)] || {})[a.key];
  return !!(dayOf(k).ticks || {})[a.key];
}
function toggleAction(a, k = today()) {
  const was = actionDone(a, k);
  if (a.fu && fuById(a.fu)) fuById(a.fu).status = was ? "todo" : "done";
  else if (a.freq === "once") { if (was) delete D().onceTicks[a.key]; else D().onceTicks[a.key] = today(); }
  else if (a.freq === "weekly") { const w = D().weekTicks[weekStart(k)] || (D().weekTicks[weekStart(k)] = {}); w[a.key] = !was; }
  else { const d = dayMut(k); d.ticks = d.ticks || {}; d.ticks[a.key] = !was; }
  return !was;
}
// all actions from active cards, same action listed once
function combinedActions() {
  const map = new Map();
  activeCards().forEach(c => c.actions.forEach(a => {
    if (!map.has(a.key)) map.set(a.key, { a, cards: [] });
    map.get(a.key).cards.push(c.title);
  }));
  return [...map.values()];
}
const findAction = key => { for (const c of D().plan) for (const a of c.actions) if (a.key === key) return a; return null; };

// ---- follow-ups ----
const fuOverdue = f => f.status !== "done" && f.due && f.due < today();
const fuSoon = f => f.status !== "done" && f.due && f.due >= today() && daysBetween(today(), f.due) <= 7;

const RED_URINARY = ["blood", "fever", "difficulty"];
function alerts() {
  const out = [];
  D().plan.filter(c => !c.archived).forEach(c => Object.keys(c.warnOn || {}).forEach(i => {
    if (c.warnings[i]) out.push({ kind: "doctor", text: `You noted: <b>${esc(c.warnings[i])}</b> (${esc(c.title)}). Please see a doctor soon.`, href: "#plan/" + c.id });
  }));
  [today(), addDays(today(), -1)].forEach(k => {
    const u = dayOf(k).urinary || [];
    const red = u.filter(x => RED_URINARY.includes(x));
    if (red.length) out.push({ kind: "doctor", text: `On ${fmtDay(k)} you logged ${red.map(x => "<b>" + esc(URINARY_LABELS[x]) + "</b>").join(", ")}. Please see a doctor soon.`, href: "#checkin/" + k });
  });
  D().followups.filter(fuOverdue).forEach(f => out.push({ kind: "overdue", text: `Overdue: <b>${esc(f.title)}</b> (was due ${esc(relDays(f.due))})`, href: "#followups" }));
  D().followups.filter(fuSoon).forEach(f => out.push({ kind: "soon", text: `Coming up: <b>${esc(f.title)}</b> ${esc(relDays(f.due))}`, href: "#followups" }));
  return out;
}
const URINARY_LABELS = { pain: "Pain", burning: "Burning", frequent: "Frequent urination", weak: "Weak flow", night: "Waking at night to urinate", blood: "Blood in urine", fever: "Fever with urinary pain", difficulty: "Difficulty passing urine" };

function cardPriority(c) {
  if (c.archived) return -2;
  if (c.resolved) return -1;
  let p = 0;
  if (Object.keys(c.warnOn || {}).length) p += 8;
  if (D().followups.some(f => fuOverdue(f) && f.cards.includes(c.id))) p += 4;
  if (c.warnings.length) p += 2;
  if (D().followups.some(f => fuSoon(f) && f.cards.includes(c.id))) p += 1;
  return p;
}
