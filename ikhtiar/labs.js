// Lab report helpers: read pasted lines, read reference ranges, flag Low / Normal / High.
const Labs = (() => {
  const norm = s => String(s || "").toLowerCase().replace(/^serum\s+|^s\.\s*/, "").replace(/[^a-z0-9]/g, "");

  // spelling -> main key
  const aliasMap = {};
  for (const [key, list] of Object.entries(TEST_ALIASES)) {
    aliasMap[key] = key;
    list.forEach(n => { aliasMap[norm(n)] = key; });
  }
  const canon = name => { const n = norm(name); return aliasMap[n] || n; };
  const displayName = key => (TEST_ALIASES[key] ? TEST_ALIASES[key][0] : null);

  function category(name) {
    const n = norm(name), k = canon(name);
    for (const [cat, r] of CATEGORY_RULES) {
      if ((r.exact || []).some(x => x === n || x === k)) return cat;
      if ((r.has || []).some(x => n.includes(x))) return cat;
    }
    return "Other";
  }

  const NEG = ["negative", "neg", "nil", "notdetected", "nonreactive", "absent", "normal", "none", "notseen", "clear"];
  const POS = ["positive", "pos", "reactive", "detected", "present", "trace"];
  const isNeg = t => NEG.includes(norm(t));
  const isPos = t => { const n = norm(t); return /\+/.test(t) || POS.some(p => n.startsWith(p)); };

  function num(str) {
    let s = String(str).trim();
    if (/^-?\d{1,3}(,\d{3})+(\.\d+)?$/.test(s)) s = s.replace(/,/g, "");   // 1,234 -> 1234
    else s = s.replace(",", ".");                                          // 3,7 -> 3.7
    const v = parseFloat(s);
    return Number.isFinite(v) ? v : null;
  }

  // "3.5–5.1", "3.5 - 5.1 mmol/L", "<2.60", "≤ 40", ">60", "up to 4", "Negative"
  function parseRef(ref) {
    const r = String(ref || "").replace(/\s+/g, " ").trim();
    const N = "(-?\\d+(?:[.,]\\d+)?)";
    let m;
    if (!r) return { type: "", lo: null, hi: null };
    if ((m = r.match(new RegExp("^" + N + "\\s*(?:-|–|—|to)\\s*" + N, "i")))) return { type: "range", lo: num(m[1]), hi: num(m[2]) };
    if ((m = r.match(new RegExp("^(<=|≤|=<|up to|upto|below|less than|<)\\s*" + N, "i")))) {
      const strict = m[1] === "<" || /below|less/i.test(m[1]);
      return { type: strict ? "lt" : "le", lo: null, hi: num(m[2]) };
    }
    if ((m = r.match(new RegExp("^(>=|≥|=>|above|more than|greater than|>)\\s*" + N, "i")))) {
      const strict = m[1] === ">" || /above|more|greater/i.test(m[1]);
      return { type: strict ? "gt" : "ge", lo: num(m[2]), hi: null };
    }
    if (!/\d/.test(r)) return { type: "text", lo: null, hi: null, text: r };
    return { type: "", lo: null, hi: null };
  }

  // Work out the flag: L (low), H (high), N (normal), A (abnormal text result), "" (cannot tell)
  function flag(res) {
    const ref = parseRef(res.ref);
    if (res.num !== null && res.num !== undefined && res.num !== "") {
      const v = Number(res.num);
      if (ref.type === "range") return v < ref.lo ? "L" : v > ref.hi ? "H" : "N";
      if (ref.type === "lt") return v >= ref.hi && res.qual !== "<" ? "H" : "N";
      if (ref.type === "le") return v > ref.hi && res.qual !== "<" ? "H" : "N";
      if (ref.type === "gt") return v <= ref.lo && res.qual !== ">" ? "L" : "N";
      if (ref.type === "ge") return v < ref.lo && res.qual !== ">" ? "L" : "N";
      return "";
    }
    const t = res.text || "";
    if (!t) return "";
    if (ref.type === "text") {
      if (norm(t) === norm(ref.text) || (isNeg(t) && isNeg(ref.text))) return "N";
      return "A";
    }
    if (isNeg(t)) return "N";
    if (isPos(t)) return "A";
    return "";
  }

  // One pasted line -> a result (or an error message)
  function parseLine(line) {
    let s = String(line).replace(/\[[^\]]*\]/g, " ").replace(/\s+/g, " ").trim();   // drop [FLAG] notes
    s = s.replace(/^[•*·]\s*/, "").replace(/^-\s+/, "");
    if (!s) return null;
    let name, rest, m;
    if ((m = s.match(/^(.+?)\s*:\s*(.+)$/))) { name = m[1]; rest = m[2]; }
    else if ((m = String(line).match(/^([^\t]+)\t+(.+)$/))) { name = m[1].trim(); rest = m[2].replace(/\t+/g, " ").trim(); }
    else if ((m = s.match(/^(.+?)\s+([<>≤≥]?=?\s*-?\d[\d.,]*(?:\s.*)?)$/))) { name = m[1]; rest = m[2]; }
    else return { error: "Could not find “Test name: value”", raw: line };

    let ref = "";
    const rm = rest.match(/\(([^()]*)\)\s*$/);
    if (rm && !/^\s*(\++|trace)\s*$/i.test(rm[1])) { ref = rm[1].trim(); rest = rest.slice(0, rm.index).trim(); }
    if (!ref) {   // also accept "value unit ref: 3.5-5.1" or "value unit | 3.5-5.1"
      const r2 = rest.match(/\s(?:\||ref(?:erence)?(?: range)?:?)\s*(.+)$/i);
      if (r2) { ref = r2[1].trim(); rest = rest.slice(0, r2.index).trim(); }
    }
    const res = { name: name.trim(), ref, raw: String(line).trim() };
    const vm = rest.match(/^([<>≤≥]=?)?\s*(-?\d[\d.,]*)\s*(.*)$/);
    if (vm && num(vm[2]) !== null) {
      res.qual = (vm[1] || "").replace("≤", "<").replace("≥", ">").replace("=", "");
      res.num = num(vm[2]);
      res.unit = vm[3].trim();
      res.text = "";
    } else {
      res.qual = ""; res.num = null; res.unit = ""; res.text = rest.trim();
    }
    return finish(res);
  }

  // fill in the computed parts (key, category, flag)
  function finish(res) {
    res.key = canon(res.name);
    res.cat = res.cat || category(res.name);
    res.flag = flag(res);
    return res;
  }

  function parseText(text) {
    return String(text || "").split(/\r?\n/).map(parseLine).filter(Boolean);
  }

  const valueText = r => r.num !== null && r.num !== undefined ? (r.qual || "") + fmtNum(r.num) : (r.text || "");
  function fmtNum(v) {
    if (v === null || v === undefined || v === "") return "";
    const n = Number(v);
    return Math.abs(n) >= 100 ? String(Math.round(n * 10) / 10) : String(Math.round(n * 1000) / 1000);
  }
  const FLAG_LABEL = { L: "Low", H: "High", N: "Normal", A: "Abnormal", "": "—" };

  // how far outside the range (0 = inside); used to tell better / worse
  function distance(r) {
    if (r.num === null || r.num === undefined) return r.flag === "A" ? 1 : 0;
    const ref = parseRef(r.ref), v = Number(r.num);
    if (ref.lo !== null && v < ref.lo) return (ref.lo - v) / (Math.abs(ref.lo) || 1);
    if (ref.hi !== null && v > ref.hi) return (v - ref.hi) / (Math.abs(ref.hi) || 1);
    return 0;
  }

  // all results for one test key across reports, oldest first
  function series(key) {
    const out = [];
    Store.data.labs.slice().sort((a, b) => a.date.localeCompare(b.date)).forEach(rep => {
      rep.results.forEach(r => { if (r.key === key) out.push(Object.assign({ date: rep.date, reportId: rep.id }, r)); });
    });
    return out;
  }
  const latest = key => { const s = series(key); return s[s.length - 1] || null; };
  const sortedReports = () => Store.data.labs.slice().sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));

  return { norm, canon, displayName, category, parseRef, flag, parseLine, parseText, finish, valueText, fmtNum, FLAG_LABEL, distance, series, latest, sortedReports };
})();
