const $ = id => document.getElementById(id);
const screens = ["menu", "pilih", "detail"];
let current = null;
let stage = 0;

function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined) n.textContent = text;
  return n;
}

function show(name) {
  screens.forEach(s => { $("screen-" + s).hidden = s !== name; });
  $("btn-back").hidden = name === "menu";
  window.scrollTo(0, 0);
}

// ---- menu ----
$("menu-art").innerHTML = plantSVG("bunga", 3);
$("btn-play").addEventListener("click", () => { location.hash = "#pilih"; });
$("btn-back").addEventListener("click", () => history.back());

// ---- pilih tanaman ----
const grid = $("plant-grid");
PLANTS.forEach(p => {
  const card = el("button", "card");
  card.type = "button";
  const pic = el("div", "card-pic");
  pic.style.background = p.color;
  pic.innerHTML = plantSVG(p.kind, 3);
  const body = el("div", "card-body");
  body.append(el("h3", null, p.name), el("p", null, p.desc));
  card.append(pic, body);
  card.addEventListener("click", () => { location.hash = "#p/" + p.id; });
  grid.append(card);
});

// ---- detail ----
function setStage(i) {
  stage = i;
  $("stage-view").innerHTML = plantSVG(current.kind, i);
  $("stage-name").textContent = (i + 1) + ". " + STAGE_NAMES[i];
  $("stage-text").textContent = current.stages[i];
  $("btn-water").textContent = i === 3 ? "Tanam semula" : "Siram air";
  [...$("d-stages").children].forEach((c, k) => c.classList.toggle("on", k === i));
}

function openPlant(p) {
  current = p;
  $("stage-view").style.background = p.color;
  $("d-name").textContent = p.name;
  $("d-desc").textContent = p.desc;
  const facts = $("d-facts");
  facts.replaceChildren(...[["Cahaya", p.sun], ["Siraman", p.water], ["Masa tuai", p.days]].map(([k, v]) => {
    const f = el("div", "fact");
    f.append(el("span", null, k), el("strong", null, v));
    return f;
  }));
  const st = $("d-stages");
  st.replaceChildren(...STAGE_NAMES.map((n, i) => {
    const b = el("button", "thumb");
    b.type = "button";
    b.style.background = p.color;
    b.innerHTML = plantSVG(p.kind, i);
    b.append(el("span", null, n));
    b.addEventListener("click", () => setStage(i));
    return b;
  }));
  $("d-steps").replaceChildren(...p.steps.map(s => el("li", null, s)));
  setStage(0);
}

$("btn-water").addEventListener("click", () => {
  const view = $("stage-view");
  view.classList.add("watering");
  setTimeout(() => {
    view.classList.remove("watering");
    setStage(stage === 3 ? 0 : stage + 1);
  }, 600);
});

// ---- routing (hash, so the phone Back button works) ----
function route() {
  const h = location.hash;
  if (h.startsWith("#p/")) {
    const p = PLANTS.find(x => x.id === h.slice(3));
    if (p) { openPlant(p); show("detail"); return; }
  }
  show(h === "#pilih" ? "pilih" : "menu");
}
window.addEventListener("hashchange", route);
route();
