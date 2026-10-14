// Plant pictures are SVG drawings made in code (no emoji).
// NOTE: these are placeholders. To use nicer pictures (e.g. free Canva images),
// replace plantSVG() output with <img src="..."> in tanam.js.
const G = "#43a047", G2 = "#2e7d32";
const soil = '<ellipse cx="100" cy="182" rx="72" ry="14" fill="#7a4a21"/><ellipse cx="100" cy="176" rx="62" ry="11" fill="#97612d"/>';
const leaf = (x, y, r, s, c = G) =>
  `<g transform="translate(${x} ${y}) rotate(${r}) scale(${s})"><path d="M0 0C10-16 32-16 44 0C32 16 10 16 0 0Z" fill="${c}"/><path d="M2 0H38" stroke="${G2}" stroke-width="1.5" opacity=".5"/></g>`;
const stem = (h, w = 5) => `<path d="M100 176V${176 - h}" stroke="${G2}" stroke-width="${w}" stroke-linecap="round"/>`;

function base(h, w, s) {
  let out = stem(h, w);
  [0.3, 0.55, 0.8].forEach((f, i) => {
    const y = 176 - h * f, sc = s * (1 - i * 0.15);
    out += leaf(100, y, -35, sc) + leaf(100, y, -145, sc);
  });
  return out + leaf(100, 176 - h, -90, s * 0.6);
}

const tomato = (x, y) =>
  `<circle cx="${x}" cy="${y}" r="13" fill="#e53935"/><circle cx="${x - 4}" cy="${y - 4}" r="4" fill="#fff" opacity=".35"/>` +
  `<path d="M${x - 7} ${y - 11}l7 4 7-4-4 6 4 3-7-1-7 1 4-3z" fill="${G2}"/>`;
const chili = (x, y, r) =>
  `<g transform="translate(${x} ${y}) rotate(${r})"><path d="M-5 0C7 4 9 26 -3 50C-5 28 -9 10 -5 0Z" fill="#d32f2f"/><rect x="-7" y="-4" width="8" height="6" rx="3" fill="${G2}"/></g>`;

function seeds(kind) {
  const t = '<g transform="translate(0 -4)">';
  if (kind === "tomato") return t + [[80, 168, -15], [104, 164, 10], [124, 170, 25]].map(([x, y, r]) =>
    `<ellipse cx="${x}" cy="${y}" rx="12" ry="8" fill="#f2d98a" stroke="#c9a94f" stroke-width="2" transform="rotate(${r} ${x} ${y})"/>`).join("") + "</g>";
  if (kind === "cili") return t + [[82, 168], [104, 164], [124, 169]].map(([x, y]) =>
    `<circle cx="${x}" cy="${y}" r="10" fill="#f6e7b4" stroke="#cdb36a" stroke-width="2"/>`).join("") + "</g>";
  if (kind === "bunga") return t + [[84, 164, -20], [112, 162, 15]].map(([x, y, r]) =>
    `<g transform="translate(${x} ${y}) rotate(${r})"><path d="M0-18C12-9 12 9 0 18C-12 9-12-9 0-18Z" fill="#37474f"/><path d="M-3-12V12M3-12V12" stroke="#cfd8dc" stroke-width="2"/></g>`).join("") + "</g>";
  return t + [[80, 168], [96, 165], [112, 168], [127, 165], [104, 172]].map(([x, y]) =>
    `<circle cx="${x}" cy="${y}" r="7" fill="#5d4037" stroke="#3e2723" stroke-width="1.5"/>`).join("") + "</g>";
}

function kangkung(stage) {
  const angles = stage === 3 ? [-42, -21, 0, 21, 42] : [-25, 0, 25];
  const len = stage === 3 ? 108 : 66;
  let out = "";
  angles.forEach(a => {
    const rad = a * Math.PI / 180, ex = 100 + len * Math.sin(rad), ey = 176 - len * Math.cos(rad);
    out += `<path d="M100 176L${ex.toFixed(1)} ${ey.toFixed(1)}" stroke="#7cb342" stroke-width="4" stroke-linecap="round"/>`;
    [0.55, 0.8].forEach((f, i) => {
      const mx = 100 + len * f * Math.sin(rad), my = 176 - len * f * Math.cos(rad);
      out += leaf(mx.toFixed(1), my.toFixed(1), a - 90 + 55, 0.5 + i * 0.1, "#66bb6a") + leaf(mx.toFixed(1), my.toFixed(1), a - 90 - 55, 0.5 + i * 0.1, "#66bb6a");
    });
    out += leaf(ex.toFixed(1), ey.toFixed(1), a - 90, 0.85, "#558b2f");
  });
  return out;
}

function sunflowerHead() {
  let petals = "";
  for (let a = 0; a < 360; a += 25.7) petals += `<ellipse cx="0" cy="-27" rx="8" ry="18" fill="#fdd835" transform="rotate(${a.toFixed(1)})"/>`;
  return `<g transform="translate(100 52)">${petals}<circle r="19" fill="#5d4037"/><circle r="11" fill="#3e2723"/></g>`;
}

// stage: 0 seed, 1 sprout, 2 growing, 3 final result
function plantSVG(kind, stage) {
  let art = "";
  if (stage === 0) art = seeds(kind);
  else if (kind === "kangkung") art = stage === 1 ? stem(24) + leaf(100, 152, -35, .55) + leaf(100, 152, -145, .55) : kangkung(stage);
  else if (stage === 1) art = stem(28) + leaf(100, 148, -35, .55) + leaf(100, 148, -145, .55);
  else if (kind === "tomato") art = stage === 2 ? base(78, 5, .8) : base(112, 6, .85) + tomato(70, 130) + tomato(132, 112) + tomato(122, 150) + tomato(78, 92);
  else if (kind === "cili") art = stage === 2 ? base(78, 5, .75) : base(112, 5, .8) + chili(76, 96, 8) + chili(126, 112, -6) + chili(84, 132, 4) + chili(118, 140, -10);
  else if (kind === "bunga") art = stage === 2 ? stem(90, 8) + leaf(100, 150, -30, 1) + leaf(100, 130, -150, 1) + `<circle cx="100" cy="82" r="10" fill="${G}"/>` : stem(128, 8) + leaf(100, 152, -25, 1.05) + leaf(100, 128, -155, 1.05) + sunflowerHead();
  return `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${kind} peringkat ${stage + 1}">${soil}${art}</svg>`;
}

const STAGE_NAMES = ["Biji", "Anak pokok", "Membesar", "Hasil"];

const PLANTS = [
  {
    id: "tomato", kind: "tomato", name: "Tomato", color: "#ffebee",
    desc: "Buah merah yang manis dan segar.",
    sun: "6–8 jam", water: "Setiap pagi", days: "60–80 hari",
    stages: [
      "Biji tomato kecil, leper dan berwarna kuning cair.",
      "Selepas 5–10 hari, anak pokok kecil muncul dengan dua daun pertama.",
      "Pokok makin tinggi, daun bertambah dan bunga kuning mula keluar.",
      "Buah bertukar merah. Sedia untuk dipetik!"
    ],
    steps: ["Rendam biji dalam air suam selama sehari.", "Tabur 2–3 biji dalam pasu berisi tanah subur, tutup nipis dengan tanah.", "Letak di tempat cerah dan siram sedikit setiap pagi.", "Bila pokok setinggi 15 cm, pindahkan ke pasu besar dan pasang kayu penyokong.", "Petik buah apabila sudah merah sepenuhnya."]
  },
  {
    id: "cili", kind: "cili", name: "Cili", color: "#fff3e0",
    desc: "Pedas dan sesuai untuk masakan harian.",
    sun: "6 jam", water: "Sehari sekali", days: "70–90 hari",
    stages: [
      "Biji cili bulat, leper dan berwarna krim.",
      "Selepas 7–14 hari, tunas hijau kecil naik dari tanah.",
      "Pokok bercabang dan mula berbunga putih.",
      "Cili bertukar merah dan boleh dipetik."
    ],
    steps: ["Keluarkan biji dari cili yang masak dan keringkan sehari.", "Semai dalam bekas kecil, tutup nipis dengan tanah.", "Jaga tanah sentiasa lembap, tetapi jangan banjir.", "Pindahkan ke pasu bila ada 4–6 helai daun.", "Petik cili bila warnanya merah menyala."]
  },
  {
    id: "bunga-matahari", kind: "bunga", name: "Bunga Matahari", color: "#fffde7",
    desc: "Bunga kuning besar yang menghadap matahari.",
    sun: "8 jam", water: "Dua hari sekali", days: "70–100 hari",
    stages: [
      "Biji bergaris hitam dan putih, berbentuk titisan air.",
      "Dalam seminggu, dua daun bulat kecil timbul.",
      "Batang tegak dan tebal, daun besar bertambah.",
      "Bunga kuning besar mekar menghadap matahari!"
    ],
    steps: ["Pilih tempat yang paling panas dan cerah.", "Tanam biji sedalam 2 cm, jarak 30 cm antara biji.", "Siram dua hari sekali sehingga tunas keluar.", "Sokong batang dengan kayu bila sudah tinggi.", "Biarkan bunga kering untuk mendapat bijinya."]
  },
  {
    id: "kangkung", kind: "kangkung", name: "Kangkung", color: "#e8f5e9",
    desc: "Sayur cepat tumbuh, boleh dituai dalam sebulan.",
    sun: "4–6 jam", water: "Dua kali sehari", days: "25–30 hari",
    stages: [
      "Biji kangkung kecil dan berwarna coklat tua.",
      "Dalam 3–5 hari, tunas kecil dengan daun muda muncul.",
      "Batang memanjang dan daun bertambah lebat.",
      "Batang hijau penuh dan sedia dituai!"
    ],
    steps: ["Rendam biji semalaman.", "Tabur rapat-rapat dalam bekas berisi tanah lembap.", "Siram pagi dan petang, kangkung suka air.", "Potong bila setinggi 20–25 cm, tinggalkan pangkal supaya tumbuh semula.", "Cuci dan masak!"]
  }
];
