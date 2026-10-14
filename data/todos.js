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
      { t: "8x8 match-3 board with swapping", done: true },
      { t: "P1 vs P2 turn by turn", done: true },
      { t: "Only your pet's colour does damage", done: true },
      { t: "Health bars, attack animation and winner screen", done: true },
      { t: "Choose your own pet and colour", done: false },
      { t: "Special blocks (bomb, heal, shield)", done: false },
      { t: "Play against the computer", done: false },
      { t: "Play online with a friend on another phone", done: false },
      { t: "Sound effects", done: false }
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
      { t: "More levels with different paths", done: false },
      { t: "Power-ups (slow, reverse, bomb)", done: false },
      { t: "Touch controls for phones", done: false },
      { t: "Sound effects and music", done: false },
      { t: "High score list", done: false }
    ]
  }
];
