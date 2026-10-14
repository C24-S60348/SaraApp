// The to-do list shown on the home page.
// To add or change a to-do, edit this file (or just ask Claude).
// status: "todo" | "doing" | "done"
// link (optional): a page in this website that opens when you press "Open"
window.TODOS = [
  {
    id: "tanam-tanam",
    title: "Tanam Tanam (game)",
    status: "doing",
    desc: "A small planting game: main menu, choose a plant, then learn how to grow it step by step.",
    notes: [
      "Main menu with a little plant and a Play button",
      "Pilih Tanaman screen with picture cards",
      "How-to page: seed, growing stages and final result",
      "Works in portrait and landscape",
      "Pictures are SVG drawings made in code. Replace with Canva images later if wanted."
    ],
    link: "games/tanam/index.html"
  },
  {
    id: "more-plants",
    title: "Add more plants to Tanam Tanam",
    status: "todo",
    desc: "Add more plants such as bayam, timun and pandan.",
    notes: ["Write a short description for each", "Draw the 4 stages for each"]
  },
  {
    id: "canva-images",
    title: "Swap drawings for Canva images",
    status: "todo",
    desc: "Replace the code-drawn plants with nicer pictures from Canva (free ones).",
    notes: ["Export PNG or SVG from Canva", "Upload into the games/tanam folder"]
  },
  {
    id: "website-live",
    title: "Put SaraApp on GitHub Pages",
    status: "done",
    desc: "The website is live and can be tested online.",
    notes: ["Home, About and the Tanam Tanam game are online"]
  }
];
