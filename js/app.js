const LABELS = { todo: "To do", doing: "In progress", done: "Done" };
const KEY = "saraapp-status";

function loadSaved() {
  try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; }
}
function save(map) {
  try { localStorage.setItem(KEY, JSON.stringify(map)); } catch (e) { /* storage blocked: ignore */ }
}

const saved = loadSaved();
const statusOf = t => saved[t.id] || t.status;
let filter = "all";
let openId = null;

const listEl = document.getElementById("todo-list");
const filtersEl = document.getElementById("filters");
const emptyEl = document.getElementById("empty");
const dlg = document.getElementById("todo-dialog");

function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined) n.textContent = text;
  return n;
}

function renderFilters() {
  filtersEl.replaceChildren();
  [["all", "All"], ["todo", "To do"], ["doing", "In progress"], ["done", "Done"]].forEach(([key, label]) => {
    const b = el("button", "chip" + (filter === key ? " active" : ""), label);
    b.addEventListener("click", () => { filter = key; render(); });
    filtersEl.append(b);
  });
}

function render() {
  renderFilters();
  listEl.replaceChildren();
  const items = window.TODOS.filter(t => filter === "all" || statusOf(t) === filter);
  emptyEl.hidden = items.length > 0;
  items.forEach(t => {
    const s = statusOf(t);
    const card = el("button", "todo-card s-" + s);
    card.type = "button";
    const top = el("div", "todo-top");
    top.append(el("span", "badge s-" + s, LABELS[s]));
    if (t.link) top.append(el("span", "badge play", "Playable"));
    card.append(top, el("h3", null, t.title), el("p", null, t.desc));
    card.addEventListener("click", () => openDialog(t));
    listEl.append(card);
  });
}

function openDialog(t) {
  openId = t.id;
  document.getElementById("d-title").textContent = t.title;
  document.getElementById("d-desc").textContent = t.desc;
  document.getElementById("d-status").value = statusOf(t);
  const notes = document.getElementById("d-notes");
  notes.replaceChildren(...(t.notes || []).map(n => el("li", null, n)));
  const link = document.getElementById("d-link");
  link.hidden = !t.link;
  if (t.link) link.href = t.link;
  dlg.showModal();
}

document.getElementById("d-status").addEventListener("change", e => {
  saved[openId] = e.target.value;
  save(saved);
  render();
});
dlg.addEventListener("click", e => { if (e.target === dlg) dlg.close(); });

render();
