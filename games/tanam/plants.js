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
  if (kind === "bayam") return t + [[84, 168], [98, 164], [112, 168], [126, 165], [106, 172], [92, 173]].map(([x, y]) =>
    `<circle cx="${x}" cy="${y}" r="4.5" fill="#263238"/>`).join("") + "</g>";
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


// ---- leafy rosette (bayam) ----
function rosette(n, s, stemColor) {
  let out = "";
  const angles = n === 3 ? [-60, -90, -120] : [-30, -55, -80, -100, -125, -150];
  angles.forEach((a, i) => {
    const rad = a * Math.PI / 180, len = 30 * s * (0.8 + (i % 3) * 0.15);
    const ex = 100 + len * Math.cos(rad), ey = 174 + len * Math.sin(rad);
    out += `<path d="M100 174L${ex.toFixed(1)} ${ey.toFixed(1)}" stroke="${stemColor}" stroke-width="4" stroke-linecap="round"/>`;
    out += leaf(ex.toFixed(1), ey.toFixed(1), a, 0.75 * s, i % 2 ? "#388e3c" : "#4caf50");
  });
  return out;
}

// ---- plants that grow inside the dirt (cutaway soil view) ----
function ugBase() {
  return '<path d="M8 104H192V176Q192 196 172 196H28Q8 196 8 176Z" fill="#9a6232"/>' +
    '<path d="M8 150H192V176Q192 196 172 196H28Q8 196 8 176Z" fill="#7d4c23"/>' +
    '<g fill="#6d4220"><circle cx="28" cy="128" r="3"/><circle cx="166" cy="124" r="4"/><circle cx="150" cy="172" r="3.5"/><circle cx="44" cy="168" r="4"/><circle cx="176" cy="150" r="2.5"/><circle cx="22" cy="150" r="2.5"/></g>' +
    '<rect x="4" y="96" width="192" height="12" rx="6" fill="#66bb6a"/>';
}
function feathery(x, h, spread) {
  let out = "";
  [-spread, 0, spread].forEach(a => {
    const tx = x + h * Math.sin(a * Math.PI / 180) * 0.9, ty = 100 - h * Math.cos(a * Math.PI / 180);
    out += `<path d="M${x} 100Q${(x + tx) / 2} ${(100 + ty) / 2 - 6} ${tx.toFixed(1)} ${ty.toFixed(1)}" stroke="${G2}" stroke-width="2.5" fill="none" stroke-linecap="round"/>`;
    for (let k = 1; k <= 4; k++) {
      const f = k / 4.5, lx = x + (tx - x) * f, ly = 100 + (ty - 100) * f;
      out += `<ellipse cx="${(lx - 5).toFixed(1)}" cy="${ly.toFixed(1)}" rx="6" ry="2.6" fill="${G}" transform="rotate(-30 ${lx.toFixed(1)} ${ly.toFixed(1)})"/><ellipse cx="${(lx + 5).toFixed(1)}" cy="${ly.toFixed(1)}" rx="6" ry="2.6" fill="${G}" transform="rotate(30 ${lx.toFixed(1)} ${ly.toFixed(1)})"/>`;
    }
  });
  return out;
}
function carrotRoot(x, len, w) {
  const l = 104 + len;
  return `<path d="M${x - w / 2} 103Q${x - w / 2} 108 ${x - w * 0.42} ${104 + len * 0.5}Q${x - w * 0.18} ${104 + len * 0.9} ${x} ${l}Q${x + w * 0.18} ${104 + len * 0.9} ${x + w * 0.42} ${104 + len * 0.5}Q${x + w / 2} 108 ${x + w / 2} 103Z" fill="#fb8c00"/>` +
    `<path d="M${x - w * 0.3} ${104 + len * 0.3}h${w * 0.25}M${x + w * 0.05} ${104 + len * 0.5}h${w * 0.25}M${x - w * 0.25} ${104 + len * 0.65}h${w * 0.2}" stroke="#e65100" stroke-width="2" stroke-linecap="round"/>` +
    `<path d="M${x - w * 0.3} 108v${len * 0.2}" stroke="#ffb74d" stroke-width="3" stroke-linecap="round" opacity=".7"/>`;
}
const heart = (x, y, r, s, c = "#43a047") =>
  `<g transform="translate(${x} ${y}) rotate(${r}) scale(${s})"><path d="M0 0C-14-10-16-26-6-28C-2-28 0-24 0-22C0-24 2-28 6-28C16-26 14-10 0 0Z" fill="${c}"/><path d="M0 0V-18" stroke="${G2}" stroke-width="1.4" opacity=".5"/></g>`;
const tuber = (x, y, rx, ry, r) =>
  `<g transform="rotate(${r} ${x} ${y})"><ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="#8e24aa"/><ellipse cx="${x - rx * .3}" cy="${y - ry * .35}" rx="${rx * .35}" ry="${ry * .2}" fill="#fff" opacity=".25"/></g>`;

function undergroundSVG(kind, stage) {
  let art = "";
  if (kind === "lobak") {
    if (stage === 0) art = [[78, 124], [100, 136], [124, 126], [92, 150], [114, 154]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="6" ry="3.5" fill="#e6c590" stroke="#b99557" stroke-width="1.5" transform="rotate(${x * 3 % 60 - 30} ${x} ${y})"/>`).join("");
    else if (stage === 1) art = `<path d="M100 104V132" stroke="#fff3e0" stroke-width="4" stroke-linecap="round"/>` + feathery(100, 24, 22);
    else if (stage === 2) art = carrotRoot(100, 42, 18) + feathery(100, 50, 28);
    else art = carrotRoot(58, 52, 22) + carrotRoot(142, 58, 24) + carrotRoot(100, 80, 34) + feathery(100, 64, 30) + feathery(58, 42, 25) + feathery(142, 46, 25);
  } else {
    if (stage === 0) art = tuber(100, 130, 22, 11, -12) + '<path d="M82 126l-8-6M118 122l9-7" stroke="#6a1b9a" stroke-width="2" stroke-linecap="round"/>';
    else if (stage === 1) art = '<path d="M100 104V126M100 120l-12 12M100 120l12 12" stroke="#fff3e0" stroke-width="3" stroke-linecap="round"/>' + '<path d="M100 100V80" stroke="#2e7d32" stroke-width="3" stroke-linecap="round"/>' + heart(100, 82, -20, .6) + heart(100, 82, 20, .6);
    else {
      const big = stage === 3;
      art = (big ? tuber(60, 138, 22, 12, -15) + tuber(138, 142, 24, 13, 12) + tuber(100, 160, 30, 14, 4) + tuber(86, 128, 14, 8, 20)
        : tuber(76, 130, 12, 7, -20) + tuber(124, 134, 13, 7, 15)) +
        '<path d="M70 108L76 128M130 108L124 132" stroke="#ba68c8" stroke-width="2" opacity=".8"/>' +
        '<path d="M100 100Q70 80 52 90M100 100Q135 78 152 88M100 100V76" stroke="#2e7d32" stroke-width="3" fill="none" stroke-linecap="round"/>' +
        heart(52, 90, -70, big ? .95 : .75) + heart(152, 88, 70, big ? .95 : .75) + heart(100, 76, 0, big ? 1.05 : .8) + (big ? heart(76, 90, -30, .8) + heart(128, 88, 30, .8) : "");
    }
  }
  return `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${kind} peringkat ${stage + 1}">${ugBase()}${art}</svg>`;
}

// stage: 0 seed, 1 sprout, 2 growing, 3 final result
function plantSVG(kind, stage) {
  if (kind === "lobak" || kind === "ubi") return undergroundSVG(kind, stage);
  let art = "";
  if (stage === 0) art = seeds(kind);
  else if (kind === "bayam") art = stage === 1 ? stem(20) + leaf(100, 156, -35, .5) + leaf(100, 156, -145, .5) : rosette(stage === 2 ? 3 : 6, stage === 2 ? .9 : 1.25, stage === 3 ? "#e57373" : "#81c784");
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
  },
  {
    id: "bayam", kind: "bayam", name: "Bayam", color: "#f1f8e9",
    desc: "Sayur hijau berkhasiat yang cepat tumbuh.",
    sun: "4–6 jam", water: "Sehari sekali", days: "25–35 hari",
    stages: [
      "Biji bayam sangat kecil dan berwarna hitam.",
      "Dalam 4–7 hari, dua daun kecil muncul dari tanah.",
      "Daun bertambah dan membentuk rumpun yang kecil.",
      "Rumpun daun lebat dan batang kemerahan. Sedia dituai!"
    ],
    steps: ["Tabur biji nipis-nipis dalam alur cetek.", "Tutup dengan tanah halus setebal 1 cm.", "Siram lembut setiap hari, tanah mesti lembap.", "Jarangkan anak pokok supaya tidak bersesak.", "Tuai daun luar dahulu, daun dalam akan terus tumbuh."]
  },
  {
    id: "lobak-merah", kind: "lobak", name: "Lobak Merah", color: "#e1f5fe", under: true,
    desc: "Akar oren yang manis dan rangup, tumbuh di dalam tanah.",
    sun: "6 jam", water: "Sehari sekali", days: "70–80 hari",
    stages: [
      "Biji lobak merah sangat kecil dan berwarna coklat muda. Ia ditanam di dalam tanah.",
      "Dalam 1–2 minggu, daun halus yang kecil muncul. Akar putih mula memanjang di bawah tanah.",
      "Daun makin lebat. Akar membesar dan menjadi oren di dalam tanah, tidak nampak dari atas.",
      "Lobak merah sudah gemuk dan oren. Cabut perlahan-lahan untuk menuai!"
    ],
    steps: ["Gemburkan tanah sedalam 30 cm dan buang batu supaya akar lurus.", "Tabur biji nipis-nipis, tutup dengan tanah setebal 0.5 cm.", "Siram lembut setiap hari sehingga tunas keluar.", "Jarangkan anak pokok kira-kira 5 cm antara satu sama lain.", "Tuai bila bahagian atas lobak (bahu) nampak selebar 2 cm."]
  },
  {
    id: "ubi-keledek", kind: "ubi", name: "Ubi Keledek", color: "#f3e5f5", under: true,
    desc: "Ubi ungu yang manis, membesar di bawah tanah.",
    sun: "6–8 jam", water: "Dua hari sekali", days: "90–120 hari",
    stages: [
      "Ditanam daripada ubi kecil atau pucuk yang sudah bertunas.",
      "Pucuk kecil muncul di permukaan dan akar halus mula memanjang.",
      "Pokok menjalar di atas tanah, ubi kecil mula terbentuk di bawah.",
      "Ubi ungu yang besar sedia digali!"
    ],
    steps: ["Pilih tanah yang gembur dan tidak berair.", "Tanam pucuk atau keratan dengan 2–3 ruas di bawah tanah.", "Siram dua hari sekali pada minggu pertama.", "Biarkan pokok menjalar dan jangan siram terlalu kerap.", "Gali berhati-hati dengan garpu supaya ubi tidak luka."]
  }
];
