// Saving and loading. Everything lives in localStorage under ONE key with a schema version,
// so it can be moved to a real database later (the JSON export is the same shape).
const Store = (() => {
  const KEY = "healthTracker_v1";
  const SCHEMA = 1;
  const APP = "ikhtiar-health-tracker";
  let data = null;
  let lastError = null;
  const listeners = [];

  const clone = o => JSON.parse(JSON.stringify(o));
  const nowIso = () => new Date().toISOString();

  function fresh() {
    return {
      app: APP,
      schemaVersion: SCHEMA,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      settings: { name: "", heightCm: null, weightUnit: "kg", lengthUnit: "cm", theme: "auto", sound: true, waterReminder: true, lastBackup: null },
      goals: { waterMl: 2500, exerciseMinWeek: 150, sleepHours: 7.5, stepsDay: 8000, targetWeightKg: null, targetWaistCm: null, nextBloodTest: null },
      days: {},          // "YYYY-MM-DD" -> that day's check-in and trackers
      weekTicks: {},     // "YYYY-MM-DD" (Monday) -> { actionKey: true }
      onceTicks: {},     // actionKey -> date ticked
      plan: clone(DEFAULT_PLAN).map(c => Object.assign(c, { archived: false, resolved: null, warnOn: {} })),
      followups: DEFAULT_FOLLOWUPS.map(f => ({ id: f.id, title: f.title, due: null, status: "todo", notes: "", cards: f.cards.slice(), createdAt: nowIso() })),
      items: clone(DEFAULT_ITEMS).map(i => Object.assign(i, { archived: false })),
      labs: [],          // reports: { id, date, lab, notes, results: [...] }
      vaccines: []       // { id, vaccine, dose, date, notes }
    };
  }

  // Bring older saved data up to the current shape. Add a step here for each new schema version.
  function migrate(d) {
    if (!d || typeof d !== "object") throw new Error("Not a tracker file");
    let v = Number(d.schemaVersion || 0);
    if (v > SCHEMA) throw new Error("This backup was made by a newer version of the tracker");
    if (v < 1) { d.schemaVersion = 1; v = 1; }
    // (future) if (v < 2) { ...change the shape...; d.schemaVersion = 2; v = 2; }
    // fill in anything missing so old files keep working
    const base = fresh();
    for (const k of Object.keys(base)) if (d[k] === undefined) d[k] = base[k];
    d.settings = Object.assign(base.settings, d.settings);
    d.goals = Object.assign(base.goals, d.goals);
    d.plan.forEach(c => { c.warnOn = c.warnOn || {}; c.actions = c.actions || []; c.warnings = c.warnings || []; c.tests = c.tests || []; });
    d.app = APP;
    return d;
  }

  function storageWorks() {
    try { const t = "__ht_test__"; localStorage.setItem(t, "1"); localStorage.removeItem(t); return true; }
    catch (e) { return false; }
  }

  function load() {
    lastError = null;
    let raw = null;
    try { raw = localStorage.getItem(KEY); }
    catch (e) { lastError = "read"; }
    if (raw) {
      try { data = migrate(JSON.parse(raw)); }
      catch (e) {
        // keep the broken copy so nothing is lost, then start clean
        try { localStorage.setItem(KEY + "_broken_" + Date.now(), raw); } catch (e2) { /* ignore */ }
        lastError = "corrupt";
        data = fresh();
      }
    } else {
      data = fresh();
      if (!storageWorks()) lastError = lastError || "unavailable";
    }
    return data;
  }

  function save() {
    data.updatedAt = nowIso();
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
      if (lastError === "write") lastError = null;
      listeners.forEach(f => f(true));
      return true;
    } catch (e) {
      lastError = "write";
      listeners.forEach(f => f(false, e));
      return false;
    }
  }

  function exportJson() {
    return JSON.stringify(Object.assign({ exportedAt: nowIso() }, data), null, 2);
  }

  // Check a backup file and return the migrated data (does not save it yet).
  function parseBackup(text) {
    let d;
    try { d = JSON.parse(text); } catch (e) { throw new Error("This file is not valid JSON."); }
    if (!d || (d.app !== APP && d.schemaVersion === undefined)) throw new Error("This does not look like a Health Tracker backup.");
    delete d.exportedAt;
    return migrate(d);
  }

  function replaceAll(d) { data = d; return save(); }
  function reset() {
    try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ }
    data = fresh();
    return save();
  }

  function sizeKb() {
    try { return Math.round((localStorage.getItem(KEY) || "").length * 2 / 1024); } catch (e) { return null; }
  }

  return {
    KEY, SCHEMA,
    get data() { return data; },
    load, save, exportJson, parseBackup, replaceAll, reset, sizeKb,
    get error() { return lastError; },
    onSave(f) { listeners.push(f); }
  };
})();
