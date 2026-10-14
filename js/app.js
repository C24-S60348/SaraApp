const KEY = "saraapp-done";

function loadSaved() {
  try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; }
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(saved)); } catch (e) { /* storage blocked: ignore */ }
}

// Ticks made in this browser: { "appId:itemIndex": true/false }
const saved = loadSaved();
const keyOf = (app, i) => app.id + ":" + i;
const isDone = (app, i) => (keyOf(app, i) in saved ? saved[keyOf(app, i)] : app.items[i].done);

const listEl = document.getElementById("todo-list");
const dlg = document.getElementById("todo-dialog");
let openApp = null;

function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined) n.textContent = text;
  return n;
}

function counts(app) {
  const done = app.items.filter((_, i) => isDone(app, i)).length;
  return { done, total: app.items.length };
}

function render() {
  listEl.replaceChildren();
  window.APPS.forEach(app => {
    const { done, total } = counts(app);
    const card = el("article", "app-card");
    card.append(el("h3", null, app.title), el("p", "app-desc", app.desc));

    const bar = el("div", "bar");
    const fill = el("span");
    fill.style.width = (total ? (done / total) * 100 : 0) + "%";
    bar.append(fill);
    card.append(bar, el("p", "progress", done + " of " + total + " done"));

    const row = el("div", "card-actions");
    const more = el("button", "btn small", "Read more");
    more.type = "button";
    more.addEventListener("click", () => openDialog(app));
    row.append(more);
    if (app.link) {
      const play = el("a", "btn small secondary", "Play");
      play.href = app.link;
      row.append(play);
    }
    card.append(row);
    listEl.append(card);
  });
}

function checkItem(app, i, done) {
  const li = el("li");
  const label = el("label");
  const box = el("input");
  box.type = "checkbox";
  box.checked = done;
  box.addEventListener("change", () => {
    saved[keyOf(app, i)] = box.checked;
    save();
    renderDialog();
    render();
  });
  label.append(box, el("span", done ? "is-done" : null, app.items[i].t));
  li.append(label);
  return li;
}

function renderDialog() {
  const app = openApp;
  const todo = [], doneList = [];
  app.items.forEach((_, i) => (isDone(app, i) ? doneList : todo).push(checkItem(app, i, isDone(app, i))));
  document.getElementById("d-todo").replaceChildren(...todo);
  if (!todo.length) document.getElementById("d-todo").append(el("li", null, "Everything is done!"));
  document.getElementById("d-done").replaceChildren(...doneList);
  document.getElementById("d-done-count").textContent = "Already done (" + doneList.length + ")";
  document.getElementById("d-done-box").hidden = doneList.length === 0;
}

function openDialog(app) {
  openApp = app;
  document.getElementById("d-title").textContent = app.title;
  document.getElementById("d-desc").textContent = app.desc;
  const link = document.getElementById("d-link");
  link.hidden = !app.link;
  if (app.link) link.href = app.link;
  renderDialog();
  dlg.showModal();
}

dlg.addEventListener("click", e => { if (e.target === dlg) dlg.close(); });
render();

// Copy the update prompt
const copyBtn = document.getElementById("copy-prompt");
copyBtn.addEventListener("click", async () => {
  const text = document.getElementById("prompt-text").textContent;
  try {
    await navigator.clipboard.writeText(text);
    copyBtn.textContent = "Copied!";
  } catch (e) {
    const range = document.createRange();
    range.selectNodeContents(document.getElementById("prompt-text"));
    getSelection().removeAllRanges();
    getSelection().addRange(range);
    copyBtn.textContent = "Press Ctrl+C to copy";
  }
  setTimeout(() => { copyBtn.textContent = "Copy prompt"; }, 2000);
});
