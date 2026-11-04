// Fixed content for the tracker: plan cards, follow-ups, reminders and test names.
// IMPORTANT: no personal values (lab numbers, names, IDs) go in this file.
// Everything personal is typed or imported in the browser and kept in localStorage.

const REMINDERS = [
  "Tie your camel, then trust Allah.",
  "I do my part. The result is in Allah's hands.",
  "My body is an amanah. Caring for it is gratitude.",
  "Whoever puts their trust in Allah, He is sufficient for them. (65:3)",
  "Small steps, done sincerely, are worship too.",
  "Ikhtiar today. Tawakkal always.",
  "Drink, move, rest, then let go of the worry.",
  "Progress, not perfection. Allah sees the effort."
];

// Plan cards. tests = names matched against your lab reports (see TEST_ALIASES).
// Action frequencies: daily (ticks reset each day), weekly (reset each Monday), once.
// auto = ticks itself from your trackers. fu = linked follow-up. prep = pre-test step.
const DEFAULT_PLAN = [
  {
    id: "lipids", title: "LDL cholesterol, total cholesterol and non-HDL", status: "High",
    tests: ["LDL-C", "Total cholesterol", "Non-HDL cholesterol"],
    meaning: "Higher long-term risk for the heart and blood vessels if it stays high.",
    actions: [
      { key: "lessfried", text: "Go easy on fried and santan dishes", freq: "daily" },
      { key: "nosweet", text: "Skip or cut down sweet drinks", freq: "daily" },
      { key: "fibre", text: "Eat vegetables, fruit, oats or beans (3+ servings)", freq: "daily", auto: "fibre" },
      { key: "nosmoke", text: "No smoking or vaping", freq: "daily" },
      { key: "exercise150", text: "Reach 150+ minutes of exercise this week", freq: "weekly", auto: "exercise" },
      { key: "weighweek", text: "Check my weight and waist this week", freq: "weekly", auto: "weighweek" },
      { key: "fu_chol", text: "Recheck cholesterol in 3–6 months", freq: "once", fu: "fu_chol" }
    ],
    warnings: []
  },
  {
    id: "creatinine", title: "Creatinine (eGFR mildly reduced)", status: "High",
    tests: ["Creatinine", "eGFR"],
    meaning: "Could be dehydration, high muscle mass, heavy exercise or supplements, but it needs a repeat test.",
    actions: [
      { key: "water", text: "Drink to my daily water goal", freq: "daily", auto: "water" },
      { key: "nopainkiller", text: "No ibuprofen or other painkillers without the doctor's advice", freq: "daily" },
      { key: "pausecreatine", text: "Pause creatine and high-dose protein before the retest", freq: "once", prep: true },
      { key: "noheavy48", text: "No heavy workout or cycling for 48 hours before the test", freq: "once", prep: true },
      { key: "fu_kidney", text: "Repeat the kidney blood test", freq: "once", fu: "fu_kidney" }
    ],
    warnings: []
  },
  {
    id: "electrolytes", title: "Potassium and phosphate", status: "High",
    tests: ["Potassium", "Phosphate"],
    meaning: "The lab said the sample was probably hemolysed (damaged in the tube), which can falsely raise these.",
    actions: [
      { key: "fu_kidney", text: "Repeat the blood test with a fresh sample", freq: "once", fu: "fu_kidney" },
      { key: "usualdiet", text: "Keep my usual diet until the retest (no big changes)", freq: "daily" }
    ],
    warnings: ["Muscle weakness", "Palpitations or an irregular heartbeat"]
  },
  {
    id: "protein", title: "Total protein", status: "Slightly high",
    tests: ["Total protein"],
    meaning: "Often from mild dehydration.",
    actions: [
      { key: "water", text: "Drink to my daily water goal", freq: "daily", auto: "water" },
      { key: "recheck_tp", text: "Recheck with my next blood test", freq: "once" }
    ],
    warnings: []
  },
  {
    id: "liver", title: "AST (ALT near the upper limit)", status: "Borderline",
    tests: ["AST", "ALT"],
    meaning: "The liver enzymes are at the edge of normal. This can happen with heavy exercise, fatty liver or some medicines.",
    actions: [
      { key: "nosweet", text: "Skip or cut down sweet drinks", freq: "daily" },
      { key: "lessfried", text: "Go easy on fried and santan dishes", freq: "daily" },
      { key: "sleep7", text: "Sleep 7–8 hours", freq: "daily", auto: "sleep" },
      { key: "noalcohol", text: "No alcohol", freq: "daily" },
      { key: "exercise150", text: "Reach 150+ minutes of exercise this week", freq: "weekly", auto: "exercise" },
      { key: "weighweek", text: "Check my weight and waist this week", freq: "weekly", auto: "weighweek" },
      { key: "stopsupps", text: "Stop unnecessary supplements and herbal products", freq: "once" },
      { key: "noheavy48", text: "No heavy workout or cycling for 48 hours before the test", freq: "once", prep: true }
    ],
    warnings: []
  },
  {
    id: "ubili", title: "Urine bilirubin", status: "Positive",
    tests: ["Urine bilirubin"],
    meaning: "Blood bilirubin was normal, so this may be a false positive from concentrated urine, but it needs a repeat urine test.",
    actions: [
      { key: "water", text: "Drink to my daily water goal", freq: "daily", auto: "water" },
      { key: "fu_urine", text: "Repeat the urine test (first morning urine)", freq: "once", fu: "fu_urine" }
    ],
    warnings: ["Yellow eyes or skin", "Tea-coloured urine", "Pale stools", "Itching", "Pain in the upper right abdomen"]
  },
  {
    id: "ucreat", title: "Urine creatinine", status: "High",
    tests: ["Urine creatinine"],
    meaning: "The urine was concentrated.",
    actions: [
      { key: "water", text: "Drink to my daily water goal", freq: "daily", auto: "water" },
      { key: "urinecheck", text: "Check my urine colour (aim for 1–2)", freq: "daily", auto: "urine" }
    ],
    warnings: []
  },
  {
    id: "psa", title: "PSA", status: "High", extra: "symptoms",
    tests: ["PSA", "Free PSA"],
    meaning: "Unusual at my age. It can come from inflammation or infection of the prostate, among other causes. A doctor needs to review it (the lab suggests a free PSA test).",
    actions: [
      { key: "fu_psa", text: "Book the doctor review", freq: "once", fu: "fu_psa" },
      { key: "urinarylog", text: "Log urinary symptoms today (or none)", freq: "daily", auto: "urinary" },
      { key: "noejac48", text: "No ejaculation for 48 hours before the retest", freq: "once", prep: true },
      { key: "noheavy48", text: "No heavy workout or cycling for 48 hours before the test", freq: "once", prep: true }
    ],
    warnings: ["Fever with urinary pain", "Blood in urine", "Difficulty passing urine"]
  },
  {
    id: "platelets", title: "MPV and PDW", status: "Slightly low",
    tests: ["MPV", "PDW"],
    meaning: "Usually not significant, since the platelet count itself is normal.",
    actions: [
      { key: "recheck_fbc", text: "Recheck with my next full blood count", freq: "once" }
    ],
    warnings: []
  },
  {
    id: "hepatitis", title: "Hepatitis B and Hepatitis A", status: "Not immune", extra: "vaccines",
    tests: ["Anti-HBs", "Anti-HAV"],
    meaning: "No protection against either infection yet.",
    actions: [
      { key: "fu_hepb", text: "Ask the doctor about the Hepatitis B vaccine", freq: "once", fu: "fu_hepb" },
      { key: "fu_hepa", text: "Ask the doctor about the Hepatitis A vaccine", freq: "once", fu: "fu_hepa" },
      { key: "hygiene", text: "Wash hands before eating; be careful with food and drink hygiene", freq: "daily" }
    ],
    warnings: []
  }
];

const DEFAULT_FOLLOWUPS = [
  { id: "fu_psa", title: "Doctor review: PSA result (ask about a free PSA test)", cards: ["psa"] },
  { id: "fu_kidney", title: "Repeat kidney and electrolyte blood test with a fresh sample", cards: ["creatinine", "electrolytes"] },
  { id: "fu_urine", title: "Repeat urine test (first morning urine)", cards: ["ubili", "ucreat"] },
  { id: "fu_hepb", title: "Ask about Hepatitis B vaccination", cards: ["hepatitis"] },
  { id: "fu_hepa", title: "Ask about Hepatitis A vaccination", cards: ["hepatitis"] },
  { id: "fu_chol", title: "Recheck cholesterol in 3–6 months", cards: ["lipids"] }
];

// Starter list for the supplements and medicines tracker (you can edit these).
const DEFAULT_ITEMS = [
  { id: "it_pain", name: "Painkiller (e.g. ibuprofen)", kind: "painkiller" },
  { id: "it_paracetamol", name: "Paracetamol", kind: "medicine" },
  { id: "it_protein", name: "Protein powder", kind: "supplement", pause: true },
  { id: "it_creatine", name: "Creatine", kind: "supplement", pause: true }
];

// Different labs write the same test differently. Each line: the main name, then other spellings.
// Spellings are compared lower-case with spaces and symbols removed.
const TEST_ALIASES = {
  ldl: ["LDL-C", "ldl", "ldlcholesterol", "ldlc", "lowdensitylipoprotein", "lowdensitylipoproteincholesterol", "ldlcalculated", "ldlcdirect", "ldlcholesterolcalculated"],
  totalchol: ["Total cholesterol", "cholesterol", "cholesteroltotal", "tc", "chol", "serumcholesterol"],
  nonhdl: ["Non-HDL cholesterol", "nonhdl", "nonhdlc"],
  hdl: ["HDL-C", "hdl", "hdlcholesterol", "highdensitylipoprotein"],
  tg: ["Triglycerides", "triglyceride", "tg", "trig"],
  creatinine: ["Creatinine", "creat", "serumcreatinine", "screatinine", "creatinineserum"],
  egfr: ["eGFR", "estimatedgfr", "gfr", "egfrckdepi", "egfrmdrd"],
  urea: ["Urea", "bloodurea", "bun", "ureanitrogen"],
  potassium: ["Potassium", "k", "serumpotassium"],
  sodium: ["Sodium", "na", "serumsodium"],
  phosphate: ["Phosphate", "phosphorus", "inorganicphosphate", "inorganicphosphorus", "po4", "phos"],
  totalprotein: ["Total protein", "protein", "proteintotal", "tp", "serumprotein"],
  ast: ["AST", "sgot", "aspartateaminotransferase", "astsgot", "aspartatetransaminase"],
  alt: ["ALT", "sgpt", "alanineaminotransferase", "altsgpt", "alaninetransaminase"],
  urinebilirubin: ["Urine bilirubin", "bilirubinurine", "ubilirubin", "urinebili"],
  urinecreatinine: ["Urine creatinine", "creatinineurine", "ucreatinine", "urinecreat"],
  psa: ["PSA", "totalpsa", "psatotal", "prostatespecificantigen", "tpsa"],
  freepsa: ["Free PSA", "fpsa", "psafree"],
  mpv: ["MPV", "meanplateletvolume"],
  pdw: ["PDW", "plateletdistributionwidth"],
  antihbs: ["Anti-HBs", "hbsab", "antihbsantibody", "hepatitisbsurfaceantibody", "hbsantibody", "antihbstitre"],
  hbsag: ["HBsAg", "hepatitisbsurfaceantigen"],
  antihav: ["Anti-HAV", "antihavigg", "antihavtotal", "havigg", "havab", "hepatitisaantibody", "hepatitisaigg", "antihavantibody"]
};

const CATEGORIES = ["Blood count", "Lipids", "Kidney", "Liver", "Thyroid", "Tumour markers", "Serology", "Urine", "Other"];

// How a test is put into a category. Checked in this order. "exact" = whole name, "has" = part of the name.
const CATEGORY_RULES = [
  ["Urine", { has: ["urine", "urinary"], exact: ["urinebilirubin", "urinecreatinine", "ph", "specificgravity", "sg", "leucocytes", "leukocytes", "nitrite", "ketones", "urobilinogen", "epithelialcells", "casts", "crystals"] }],
  ["Lipids", { has: ["ldl", "hdl", "cholesterol", "triglycer", "lipid", "lipoprotein"], exact: ["tc", "tg", "chol", "nonhdl", "totalchol"] }],
  ["Thyroid", { has: ["thyro", "tsh"], exact: ["ft4", "ft3", "t4", "t3"] }],
  ["Tumour markers", { has: ["psa", "prostatespecific", "alphafeto", "carcinoembryonic", "ca125", "ca199", "ca153"], exact: ["cea", "afp", "freepsa"] }],
  ["Serology", { has: ["hbs", "hbc", "hbe", "hav", "hcv", "hiv", "hepatitis", "syphilis", "vdrl", "tpha", "rpr", "dengue", "antibody", "antigen", "reactive"], exact: ["antihbs", "hbsag", "antihav"] }],
  ["Kidney", { has: ["creatinine", "urea", "gfr", "uricacid", "sodium", "potassium", "chloride", "phosphate", "phosphorus", "calcium", "bicarbonate", "electrolyte"], exact: ["k", "na", "cl", "bun", "co2", "po4", "phos", "ca", "creat", "egfr"] }],
  ["Liver", { has: ["bilirubin", "albumin", "globulin", "protein", "transaminase", "aminotransferase", "phosphatase", "glutamyl", "sgot", "sgpt"], exact: ["ast", "alt", "alp", "ggt", "agratio", "ag", "tp", "totalprotein"] }],
  ["Blood count", { has: ["haemoglobin", "hemoglobin", "platelet", "neutrophil", "lymphocyte", "monocyte", "eosinophil", "basophil", "whitecell", "redcell", "whiteblood", "redblood", "haematocrit", "hematocrit", "corpuscular"], exact: ["hb", "hgb", "wbc", "rbc", "plt", "mcv", "mch", "mchc", "rdw", "rdwcv", "mpv", "pdw", "hct", "pcv", "esr", "twc"] }]
];
