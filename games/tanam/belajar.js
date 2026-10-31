// Belajar Tanam: a learning path. Each chapter (Asas Menanam + one per plant) has 4 tahap.
// A tahap = a short lesson, then a 5-question quiz. 5 right = 3 stars, 4 = 2 stars, 3 = 1 star.
// One star or more unlocks the next tahap, and the chapter's plant grows.
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const view = $("view");
const KEY = "tanam-belajar";

// ---------- progress (saved in this browser) ----------
let progress = {};
try { progress = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { progress = {}; }
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(progress)); } catch (e) { /* ignore */ } };
const starsOf = bank => { const s = progress[bank] || []; return [0, 1, 2, 3].map(i => s[i] || 0); };
const passed = bank => { let n = 0; for (const s of starsOf(bank)) { if (s > 0) n++; else break; } return n; };
const unlocked = (bank, t) => t === 0 || starsOf(bank)[t - 1] > 0;
const stageFor = bank => Math.min(3, passed(bank));
const chapterOf = bank => BELAJAR.find(c => c.bank === bank);
const plantOf = ch => PLANTS.find(p => p.kind === ch.plant);
const starText = (n, max = 3) => Array.from({ length: max }, (_, i) => `<span class="star${i < n ? "" : " off"}">★</span>`).join("");
const totalStars = () => BELAJAR.reduce((n, c) => n + starsOf(c.bank).reduce((a, b) => a + b, 0), 0);
function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
const art = (ch, stage) => { const P = plantOf(ch); return plantSVG(P.kind, stage); };

// ---------- screens ----------
function showMap() {
  const total = totalStars(), max = BELAJAR.length * 12;
  view.innerHTML = `<h1 class="h1">Belajar Menanam</h1>
    <p class="lead">Pilih pokok. Setiap pokok ada 4 tahap. Habiskan tahap untuk membesarkan pokok anda!</p>
    <div class="total"><span class="star">★</span> ${total} / ${max} bintang</div>
    <div class="chapters">${BELAJAR.map(ch => {
      const P = plantOf(ch), s = starsOf(ch.bank), got = s.reduce((a, b) => a + b, 0), done = passed(ch.bank);
      const ribbon = done === 4 ? `<span class="ribbon done">Siap dituai!</span>` : ch.bank === "asas" && total === 0 ? `<span class="ribbon">Mula di sini</span>` : "";
      return `<button class="chap" data-bank="${ch.bank}" type="button">${ribbon}
        <div class="art" style="background:${P.color}">${art(ch, stageFor(ch.bank))}</div>
        <div class="body"><h3>${esc(ch.name)}</h3><p>${esc(ch.intro)}</p>
        <div class="bar"><span style="width:${done * 25}%"></span></div>
        <div class="meta"><span>Tahap ${done} / 4</span><span><span class="star">★</span> ${got} / 12</span></div></div></button>`;
    }).join("")}</div>`;
  view.querySelectorAll(".chap").forEach(b => b.addEventListener("click", () => { SFX.play("click"); go("#c/" + b.dataset.bank); }));
}

function showChapter(bank) {
  const ch = chapterOf(bank), P = plantOf(ch), s = starsOf(bank), done = passed(bank);
  const plantPage = PLANTS.find(p => p.kind === ch.plant);
  view.innerHTML = `<div class="chapter">
    <div><div class="bigart" style="background:${P.color}">${done === 4 ? `<span class="badge">Hasil!</span>` : ""}${art(ch, stageFor(bank))}</div>
      <h2>${esc(ch.name)}</h2><p class="intro">${esc(ch.intro)}</p>
      <div class="infow">${bank !== "asas" ? `<a class="info" href="index.html#p/${plantPage.id}">Lihat cara menanam ${esc(ch.name)} →</a>` : ""}</div></div>
    <div class="path">${ch.tahap.map((t, i) => {
      const open = unlocked(bank, i), cls = s[i] > 0 ? "done" : open ? (i === done ? "next" : "") : "locked";
      return `<button class="node ${cls}" data-t="${i}" type="button"><span class="num">${i + 1}</span>
        <span><b>Tahap ${i + 1} · ${esc(t.title)}</b><small>${open ? (s[i] > 0 ? "Selesai. Main lagi untuk lebih bintang." : "Belajar, kemudian jawab 5 soalan.") : "Habiskan tahap " + i + " dahulu."}</small></span>
        <span class="stars">${starText(s[i])}</span></button>`;
    }).join("")}</div></div>`;
  view.querySelectorAll(".node").forEach(b => b.addEventListener("click", () => {
    const t = +b.dataset.t;
    if (!unlocked(bank, t)) { SFX.play("nope"); return; }
    SFX.play("click"); go(`#l/${bank}/${t}`);
  }));
}

function showLesson(bank, t) {
  const ch = chapterOf(bank), T = ch.tahap[t], P = plantOf(ch);
  let shown = 1;
  const draw = () => {
    const last = shown >= T.facts.length;
    view.innerHTML = `<div class="lesson"><p class="crumb">${esc(ch.name)}</p><h2>Tahap ${t + 1} · ${esc(T.title)}</h2>
      <div class="lesson-art" style="background:${P.color}">${art(ch, T.art)}</div>
      <ul class="facts">${T.facts.slice(0, shown).map((f, i) => `<li data-n="${i + 1}"${i === shown - 1 ? ' class="new"' : ""}>${esc(f)}</li>`).join("")}</ul>
      <div class="actions">${last
        ? `<button class="go orange" id="startq" type="button">Mula kuiz (5 soalan)</button>`
        : `<button class="go" id="nextf" type="button">Seterusnya (${shown} / ${T.facts.length})</button>`}</div></div>`;
    if (last) $("startq").addEventListener("click", () => { SFX.play("go"); go(`#q/${bank}/${t}`, true); });
    else $("nextf").addEventListener("click", () => { shown++; SFX.play("spark"); draw(); });
  };
  draw();
}

function showQuiz(bank, t) {
  const ch = chapterOf(bank), T = ch.tahap[t], bankQs = KUIZ_BANKS[bank].qs;
  const qs = shuffle(T.qs.slice()).map(i => {
    const [q, ...opts] = bankQs[i], order = shuffle([0, 1, 2, 3]);
    return { q, opts: order.map(k => opts[k]), ans: order.indexOf(0) };
  });
  const res = [];
  let qi = 0;
  const draw = () => {
    const Q = qs[qi];
    view.innerHTML = `<div class="quiz"><p class="crumb">${esc(ch.name)} · Tahap ${t + 1}</p><h2>Soalan ${qi + 1} / ${qs.length}</h2>
      <div class="steps">${qs.map((_, i) => `<i class="${i < res.length ? (res[i] ? "ok" : "no") : i === qi ? "now" : ""}"></i>`).join("")}</div>
      <div class="qbox"><p>${esc(Q.q)}</p><div class="opts">${Q.opts.map((o, k) => `<button class="opt" data-k="${k}" type="button">${esc(o)}</button>`).join("")}</div>
      <p class="feedback" id="fb"></p><div class="actions" id="act"></div></div></div>`;
    view.querySelectorAll(".opt").forEach(b => b.addEventListener("click", () => pick(+b.dataset.k)));
  };
  const pick = k => {
    const Q = qs[qi], ok = k === Q.ans, btns = view.querySelectorAll(".opt");
    btns.forEach(b => { b.disabled = true; });
    btns[Q.ans].classList.add("right");
    if (!ok) btns[k].classList.add("wrong");
    res.push(ok);
    SFX.play(ok ? "combo" : "nope", 1);
    const fb = $("fb");
    fb.className = "feedback " + (ok ? "ok" : "no");
    fb.textContent = ok ? "Betul!" : "Belum tepat. Jawapan yang betul ditanda hijau.";
    const last = qi === qs.length - 1;
    $("act").innerHTML = `<button class="go" id="nq" type="button">${last ? "Lihat keputusan" : "Seterusnya"}</button>`;
    $("nq").addEventListener("click", () => { SFX.play("click"); if (last) finish(); else { qi++; draw(); } });
    $("nq").focus();
  };
  const finish = () => {
    const right = res.filter(Boolean).length, stars = right >= 5 ? 3 : right === 4 ? 2 : right === 3 ? 1 : 0;
    const before = stageFor(bank), had = starsOf(bank)[t];
    if (stars > had) { progress[bank] = starsOf(bank); progress[bank][t] = stars; save(); }
    const after = stageFor(bank), grew = after > before, nextOpen = t < 3 && unlocked(bank, t + 1), P = plantOf(ch);
    const msg = stars === 3 ? "Hebat! Semua betul!" : stars === 2 ? "Bagus!" : stars === 1 ? "Lulus! Cuba lagi untuk lebih bintang." : "Belum lulus. Baca semula pelajaran dan cuba lagi!";
    view.innerHTML = `<div class="quiz result"><p class="crumb">${esc(ch.name)} · Tahap ${t + 1}</p><h2>${msg}</h2>
      <div class="bigstars">${starText(stars)}</div>
      <p><b>${right} / ${qs.length}</b> betul${had > stars ? ` · rekod terbaik anda kekal ${had} bintang` : ""}</p>
      <div class="grow-art${grew ? " up" : ""}" style="background:${P.color}">${art(ch, after)}</div>
      <p>${passed(bank) === 4 && t === 3 && stars > 0 ? "<b>Tahniah! " + esc(ch.name) + " sudah siap dituai!</b>" : grew ? "<b>Pokok anda membesar!</b>" : ""}</p>
      <div class="actions">
        ${nextOpen && stars > 0 ? `<button class="go orange" id="r-next" type="button">Tahap ${t + 2}</button>` : ""}
        <button class="go${stars > 0 ? " alt" : ""}" id="r-again" type="button">${stars > 0 ? "Main lagi" : "Cuba lagi"}</button>
        ${stars === 0 ? `<button class="go alt" id="r-learn" type="button">Baca pelajaran</button>` : ""}
        <button class="go alt" id="r-map" type="button">Semua tahap</button>
      </div></div>`;
    SFX.play(stars > 0 ? "win" : "lose");
    if ($("r-next")) $("r-next").addEventListener("click", () => go(`#l/${bank}/${t + 1}`, true));
    $("r-again").addEventListener("click", () => showQuiz(bank, t));
    if ($("r-learn")) $("r-learn").addEventListener("click", () => go(`#l/${bank}/${t}`, true));
    $("r-map").addEventListener("click", () => go("#c/" + bank, true));
  };
  draw();
}

// ---------- routing (#c/bank, #l/bank/t, #q/bank/t) ----------
function go(hash, replace) { if (replace) location.replace(hash); else location.hash = hash; }
function route() {
  const [kind, bank, t] = location.hash.replace(/^#/, "").split("/");
  const ok = bank && chapterOf(bank), n = Math.max(0, Math.min(3, +t || 0));
  window.scrollTo(0, 0);
  $("btn-back").hidden = false;
  if (kind === "c" && ok) return showChapter(bank);
  if (kind === "l" && ok && unlocked(bank, n)) return showLesson(bank, n);
  if (kind === "q" && ok && unlocked(bank, n)) return showQuiz(bank, n);
  $("btn-back").hidden = true; // the map is the first screen
  showMap();
}
$("btn-back").addEventListener("click", () => {
  const [kind, bank] = location.hash.replace(/^#/, "").split("/");
  SFX.play("click");
  go(kind === "c" || !bank ? "#" : "#c/" + bank, true);
});
window.addEventListener("hashchange", route);
SFX.bindButton($("btn-sound"));
route();
