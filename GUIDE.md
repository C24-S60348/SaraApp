# Beginner guide

## What is this?
A website made of 3 kinds of files:
- `.html` = the content (text, buttons, pages)
- `css/style.css` = how it looks (colors, spacing)
- `js/app.js` = what it does (clicking, counting)

GitHub Pages hosts these files for free. Flask (Python) needs a running server, which GitHub Pages does not offer, so we use plain HTML/CSS/JS instead.

## Turn on the live link (one time, ~1 minute)
1. Open https://github.com/C24-S60348/SaraApp
2. Click **Settings** (top tab) → **Pages** (left menu).
3. Under **Build and deployment → Source**, choose **Deploy from a branch**.
4. Under **Branch**, choose `ccr-66309fba-ukb5pu` and folder `/ (root)`, then **Save**.
5. Wait 1–2 minutes and refresh. A green box shows: **Your site is live at https://c24-s60348.github.io/SaraApp/**

## Change something
Just tell Claude, e.g. "make the title red" or "add a Gallery page". Claude edits the files and pushes. Refresh the link after ~1 minute (hard refresh: Ctrl+Shift+R).

## Test on your computer (optional)
Double-click `index.html` and it opens in your browser.

## The to-do list (home page)
The cards on the home page come from `data/todos.js`. Each card has a title, status (todo / doing / done), a description and an optional `link` to a page or game. To add or change one, edit that file or just ask Claude.
Visitors can change a card's status in their own browser, but that is only saved on their device. To change it for everyone, ask Claude.

## Tanam Tanam game
Files are in `games/tanam/`. Plant info is in `plants.js`. The plant pictures are drawings made in code (no emoji). They are placeholders and can be replaced with Canva images.
