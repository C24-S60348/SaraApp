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

## Home page = list of apps
Each card on the home page is one app (Tanam Tanam, Pet Puzzle Battle, Zuma Duo). "Read more" shows what is still to do inside it. The data is in `data/todos.js`.

## More games
- `games/pets/` : Pet Puzzle Battle (2 players, take turns on one screen)
- `games/zuma/` : Zuma Duo (P1 keyboard on the left, P2 mouse on the right)

## Sound
All games use `js/sfx.js`, which makes the sounds in code (no audio files). The "Sound" button in each game mutes them.

## Online multiplayer
See `online.html` (also on the website) for what is needed.

## Online Pet Puzzle Battle
Open the game, press "Play online", and create or join a room with a 4-letter code. Online code: `games/pets/pets-online.js`. The database is Firebase project `saraapp`; the rules are in `firebase.rules.json`.

## Online Zuma Duo
Press "Play online" in the game. The player who creates the room is the host: they pick the level, play P1 (left) and their device runs the game. The friend joins with the 4-letter code and plays P2 (right). Online code: `games/zuma/zuma-online.js`.
