// The apps shown on the home page. Each app has a to-do list inside it.
// To add or change something, edit this file (or just ask Claude).
// done: true  = finished,  done: false = still to do
window.APPS = [
  {
    id: "tanam",
    title: "Tanam Tanam",
    desc: "A planting game. Pick a plant and learn how to grow it, from seed to harvest.",
    link: "games/tanam/index.html",
    items: [
      { t: "Main menu with a little plant and Play button", done: true },
      { t: "Pilih Tanaman screen with picture cards", done: true },
      { t: "How-to page with seed, growing stages and final result", done: true },
      { t: "Works in portrait and landscape", done: true },
      { t: "Plants that grow inside the dirt (carrot, sweet potato)", done: true },
      { t: "More plants: bayam, lobak merah, ubi keledek", done: true },
      { t: "Replace code-drawn pictures with Canva images", done: false },
      { t: "Add more plants (timun, terung, pandan)", done: false },
      { t: "Sound effects and music", done: false },
      { t: "Save which plants the player already grew", done: false },
      { t: "English language option", done: false }
    ]
  },
  {
    id: "pets",
    title: "Pet Puzzle Battle",
    desc: "Two players, two pets. Take turns matching blocks. Match your pet's colour to hit the enemy.",
    link: "games/pets/index.html",
    items: [
      { t: "6x6 match-3 board with big blocks and swipe", done: true },
      { t: "P1 vs P2 turn by turn", done: true },
      { t: "Only your pet's colour does damage", done: true },
      { t: "Health bars, attack animation and winner screen", done: true },
      { t: "Players choose their own pet and colour (5 pets)", done: true },
      { t: "Power-ups: match 4 makes a Bomb (clears 3x3), match 5 makes a Star (clears a whole colour)", done: true },
      { t: "More power-ups (heal, shield, freeze)", done: false },
      { t: "Play the computer on Easy, Medium or Hard", done: true },
      { t: "Smarter Hard computer that also guesses what blocks will fall", done: false },
      { t: "Sound effects, particles, screen shake and intro animation", done: true },
      { t: "Online multiplayer: 2 devices with a 4-letter room code, rematch, and friend-left message", done: true },
      { t: "Reconnect after a reload or after switching apps (Rejoin room button)", done: true },
      { t: "Clean up old rooms automatically", done: false },
      { t: "Quick match with a stranger (no code)", done: false },
      { t: "Music", done: false }
    ]
  },
  {
    id: "zuma",
    title: "Zuma Duo",
    desc: "Two players, one chain. P1 uses the keyboard on the left, P2 uses the mouse on the right.",
    link: "games/zuma/index.html",
    items: [
      { t: "Curvy path with a skull hole", done: true },
      { t: "P1 keyboard shooter on the left (arrows)", done: true },
      { t: "P2 mouse shooter on the right", done: true },
      { t: "Shared chain with separate scores", done: true },
      { t: "5 levels with different path styles and themes (jungle, desert spiral, ice switchbacks, candy heart, ocean waves)", done: true },
      { t: "Touch: hold to aim, release to shoot", done: true },
      { t: "Streak bonus: every 3 matches in a row or a chain reaction rolls the chain back (-2s)", done: true },
      { t: "8 levels (Level 1 to 8) with Next level after a win; all levels open for now", done: true },
      { t: "Turn level locking back on (set ALL_LEVELS_OPEN to false in zuma.js)", done: false },
      { t: "New paths: Zigzag Canyon, Bamboo Columns (straight up and down), Square Spiral", done: true },
      { t: "Many balls rush out at the start, plus a bar showing how many balls are out", done: true },
      { t: "A shot that does not match pushes the chain forward; only a match moves it back", done: true },
      { t: "Save the best score for each level", done: false },
      { t: "Power-ups (slow, reverse, bomb)", done: false },
      { t: "Main menu and a choice of controls (keyboard + mouse, or touch + touch)", done: true },
      { t: "Touch controls: left half for P1, right half for P2, with a highlighted zone at the start", done: true },
      { t: "Sound effects, particles, shake, zoom intro and better graphics", done: true },
      { t: "Online multiplayer: the room creator is the host (P1), the friend joins with a 4-letter code (P2)", done: true },
      { t: "Online: let the host rejoin after a reload (right now the host's game is lost)", done: false },
      { t: "Music", done: false },
      { t: "High score list", done: false }
    ]
  },
  {
    id: "online",
    title: "Online multiplayer plan",
    desc: "What we need to play Pet Puzzle Battle and Zuma Duo on two different devices.",
    link: "online.html",
    items: [
      { t: "Write the plan and requirements", done: true },
      { t: "Create a free Firebase project (saraapp) and set up the database", done: true },
      { t: "Build online Pet Puzzle Battle (room code, shared board seed, send moves)", done: true },
      { t: "Build online Zuma Duo (host runs the game, guest sends touches)", done: true },
      { t: "Database rules so only room data can be used", done: true },
      { t: "Test Pet Puzzle and Zuma Duo online with two real devices (phone + computer)", done: false }
    ]
  },
  {
    id: "elements",
    title: "Elements",
    desc: "A glowing card carousel inspired by your video. Fire, lotus bloom, sun rays and swirling wind.",
    link: "apps/elements/index.html",
    linkLabel: "Open",
    items: [
      { t: "Card carousel with 4 elements (Ember, Bloom, Solar, Breeze)", done: true },
      { t: "Live effects: flames, lotus petals, sun rays, wind swirls", done: true },
      { t: "Tap, swipe, arrow keys and mouse wheel; auto-demo; sounds; floor reflection", done: true },
      { t: "More elements (water, earth, lightning, shadow)", done: false },
      { t: "Use this card style as the pet picker in Pet Puzzle Battle (pet colour = element)", done: false },
      { t: "Use it as the plant picker in Tanam Tanam", done: false },
      { t: "Firefox: add a fallback for the floor reflection", done: false }
    ]
  },
  {
    id: "bingo",
    title: "Festival of Lights Bingo",
    desc: "Printable bingo cards (6 per A4 page) plus a caller sheet. The page opens on its own, with no link back to SaraApp.",
    link: "bingo/index.html",
    linkLabel: "Open",
    items: [
      { t: "Card generator: 4x4 or 5x4 grid, every card different, A4 landscape or portrait", done: true },
      { t: "Caller sheet and Print / Save as PDF", done: true },
      { t: "For 400 players use the 4x4 grid and set Cards to 402 (67 A4 pages plus 1 caller page)", done: false },
      { t: "Decide how to settle ties before the event (first to shout BINGO, or a lucky draw)", done: false },
      { t: "Do a test print of one page before printing all 402 cards", done: false },
      { t: "On-screen caller that picks a random picture each time", done: false }
    ]
  },
  {
    id: "bingo-cut",
    title: "Bingo: cut-friendly version",
    desc: "Same bingo cards, but the 6 cards on each A4 page touch each other with square corners, so you only make straight cuts. Two designs to choose from.",
    link: "bingo/cut/index.html",
    linkLabel: "Open",
    items: [
      { t: "No white gaps, square corners, optional cut guides", done: true },
      { t: "Design A (royal purple) and Design B (teal and gold)", done: true },
      { t: "Printer-safe edge option (4 mm white border) for printers that cannot print to the paper edge", done: true },
      { t: "Title no longer cut off (\"Festival Of Light\" is now \"Festival Of Lights:\")", done: true },
      { t: "Test print one page on the real printer, then cut it, before printing all 402 cards", done: false },
      { t: "Choose the final design (A or B)", done: false },
      { t: "Apply the title fix to the first bingo page too", done: false }
    ]
  }
];
