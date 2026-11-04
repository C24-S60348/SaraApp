// Small line charts drawn as inline SVG (no library, works offline).
// Chart.line(points, opts) returns an SVG string. points: [{ d: "YYYY-MM-DD", v: number, flag?: "H" }]
const Chart = (() => {
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const day = k => { const [y, m, d] = k.split("-").map(Number); return Date.UTC(y, m - 1, d) / 864e5; };
  const short = k => { const [y, m, d] = k.split("-").map(Number); return new Date(y, m - 1, d).toLocaleDateString("en-GB", { day: "numeric", month: "short" }); };
  const long = k => { const [y, m, d] = k.split("-").map(Number); return new Date(y, m - 1, d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }); };
  const fmt = v => Math.abs(v) >= 100 ? String(Math.round(v)) : String(Math.round(v * 100) / 100);

  // nice round tick steps
  function ticks(min, max, count) {
    const span = max - min || 1, raw = span / count, p = Math.pow(10, Math.floor(Math.log10(raw)));
    const step = [1, 2, 2.5, 5, 10].map(m => m * p).find(s => s >= raw) || raw;
    const out = [];
    for (let t = Math.ceil(min / step) * step; t <= max + 1e-9; t += step) out.push(Math.round(t * 1e6) / 1e6);
    return out;
  }

  function line(points, opts = {}) {
    const pts = points.filter(p => p.v !== null && p.v !== undefined && Number.isFinite(Number(p.v)));
    const H = opts.height || 150, W = 320, padL = 36, padR = 14, padT = 14, padB = 22;
    if (!pts.length) return `<p class="muted small">No data yet.</p>`;
    const lo = opts.lo ?? null, hi = opts.hi ?? null, goal = opts.goal ?? null, unit = opts.unit || "";
    let vals = pts.map(p => Number(p.v));
    [lo, hi, goal].forEach(x => { if (x !== null) vals.push(x); });
    let min = Math.min(...vals), max = Math.max(...vals);
    const pad = (max - min) * 0.15 || Math.abs(max) * 0.1 || 1;
    min -= pad; max += pad;
    const tk = ticks(min, max, 3);
    min = Math.min(min, tk[0]); max = Math.max(max, tk[tk.length - 1]);
    const x0 = day(pts[0].d), x1 = day(pts[pts.length - 1].d), xs = x1 - x0 || 1;
    const X = d => pts.length === 1 ? (padL + W - padR) / 2 : padL + (day(d) - x0) / xs * (W - padL - padR);
    const Y = v => padT + (max - v) / (max - min) * (H - padT - padB);

    let s = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(opts.label || "Trend chart")}" data-unit="${esc(unit)}">`;
    // healthy range band
    if (lo !== null || hi !== null) {
      const top = Y(hi !== null ? hi : max), bot = Y(lo !== null ? lo : min);
      s += `<rect class="band" x="${padL}" y="${top}" width="${W - padL - padR}" height="${Math.max(0, bot - top)}"/>`;
    }
    tk.forEach(t => { s += `<line class="grid" x1="${padL}" x2="${W - padR}" y1="${Y(t)}" y2="${Y(t)}"/><text class="axis" x="${padL - 6}" y="${Y(t) + 3.5}" text-anchor="end">${fmt(t)}</text>`; });
    if (goal !== null) s += `<line class="goal" x1="${padL}" x2="${W - padR}" y1="${Y(goal)}" y2="${Y(goal)}"/><text class="axis goal-t" x="${W - padR}" y="${Y(goal) - 4}" text-anchor="end">goal</text>`;
    // x labels: first and last date
    s += `<text class="axis" x="${padL}" y="${H - 5}" text-anchor="start">${short(pts[0].d)}</text>`;
    if (pts.length > 1) s += `<text class="axis" x="${W - padR}" y="${H - 5}" text-anchor="end">${short(pts[pts.length - 1].d)}</text>`;
    if (pts.length > 1) s += `<polyline class="ln" points="${pts.map(p => X(p.d).toFixed(1) + "," + Y(p.v).toFixed(1)).join(" ")}"/>`;
    pts.forEach((p, i) => {
      const off = p.flag === "H" || p.flag === "L" || p.flag === "A";
      s += `<circle class="dot${off ? " off" : ""}" cx="${X(p.d).toFixed(1)}" cy="${Y(p.v).toFixed(1)}" r="4" data-i="${i}"/>`;
    });
    const last = pts[pts.length - 1];
    s += `<text class="lab" x="${Math.min(X(last.d), W - padR)}" y="${Math.max(11, Y(last.v) - 9)}" text-anchor="${pts.length > 1 ? "end" : "middle"}">${fmt(Number(last.v))}</text>`;
    // invisible data for the tooltip
    s += `<g class="tipdata" data-pts='${esc(JSON.stringify(pts.map(p => [X(p.d), Y(p.v), long(p.d), fmt(Number(p.v))])))}'></g>`;
    s += `</svg>`;
    return `<div class="chart-wrap">${s}<div class="tip" hidden></div></div>`;
  }

  // one tooltip handler for every chart on the page (hover or tap)
  function onMove(e) {
    const wrap = e.target.closest && e.target.closest(".chart-wrap");
    document.querySelectorAll(".chart-wrap .tip:not([hidden])").forEach(t => { if (!wrap || t.parentNode !== wrap) t.hidden = true; });
    if (!wrap) return;
    const svg = wrap.querySelector("svg"), g = svg.querySelector(".tipdata"), tip = wrap.querySelector(".tip");
    const pts = JSON.parse(g.dataset.pts || "[]");
    if (!pts.length) return;
    const r = svg.getBoundingClientRect(), sx = (e.clientX - r.left) / r.width * 320;
    let best = pts[0];
    pts.forEach(p => { if (Math.abs(p[0] - sx) < Math.abs(best[0] - sx)) best = p; });
    tip.innerHTML = `<b>${esc(best[3])} ${esc(svg.dataset.unit || "")}</b><span>${esc(best[2])}</span>`;
    tip.hidden = false;
    const left = best[0] / 320 * r.width, top = best[1] / svg.viewBox.baseVal.height * r.height;
    tip.style.left = Math.max(4, Math.min(r.width - tip.offsetWidth - 4, left - tip.offsetWidth / 2)) + "px";
    tip.style.top = Math.max(0, top - tip.offsetHeight - 10) + "px";
    svg.querySelectorAll(".dot.hl").forEach(d => d.classList.remove("hl"));
    const dots = svg.querySelectorAll(".dot");
    dots[pts.indexOf(best)] && dots[pts.indexOf(best)].classList.add("hl");
  }
  document.addEventListener("pointermove", onMove);
  document.addEventListener("pointerdown", onMove);

  // simple progress bar
  function bar(value, goal, cls = "") {
    const pct = goal > 0 ? Math.max(0, Math.min(100, value / goal * 100)) : 0;
    return `<div class="pbar ${cls}" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(pct)}"><span style="width:${pct}%"></span></div>`;
  }

  return { line, bar };
})();
