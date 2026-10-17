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
      { t: "Special blocks (bomb, heal, shield)", done: false },
      { t: "Play against the computer", done: false },
      { t: "Sound effects, particles, screen shake and intro animation", done: true },
      { t: "Online multiplayer: 2 devices with a 4-letter room code, rematch, and friend-left message", done: true },
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
      { t: "Lock levels until the one before is cleared, and save the best scores", done: false },
      { t: "Power-ups (slow, reverse, bomb)", done: false },
      { t: "Main menu and a choice of controls (keyboard + mouse, or touch + touch)", done: true },
      { t: "Touch controls: left half for P1, right half for P2, with a highlighted zone at the start", done: true },
      { t: "Sound effects, particles, shake, zoom intro and better graphics", done: true },
      { t: "Online multiplayer: 2 devices with a room code, same game with a Local/Online mode (needs a Firebase project, see plan)", done: false },
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
      { t: "Build online Zuma Duo (host runs the game, guest sends touches)", done: false },
      { t: "Database rules so only room data can be used", done: true },
      { t: "Test Pet Puzzle online with two real devices (phone + computer)", done: false }
    ]
  }
];
