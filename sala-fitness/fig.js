/* Ilustrații: siluetă animată pentru fiecare exercițiu, harta mușchilor și iconițe SVG. */
(function (root) {
  'use strict';
  /* ───────── iconițe (linie, 24×24) ───────── */
  const P = {
    home: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
    dumbbell: '<path d="M6.5 6.5v11M17.5 6.5v11M3 9v6M21 9v6M6.5 12h11"/>',
    chart: '<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
    food: '<path d="M7 3v8a3 3 0 006 0V3M10 3v18M17 3c-2 2-2 6 0 8v10"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c1-3.5 3.5-5.5 6.5-5.5s5.5 2 6.5 5.5"/><path d="M16 4.5a3.5 3.5 0 010 7M18 14.8c2 .8 3.2 2.6 3.7 5.2"/>',
    bell: '<path d="M6 16V11a6 6 0 0112 0v5l2 2H4z"/><path d="M10 21h4"/>',
    chat: '<path d="M4 5h16v11H9l-5 4z"/><path d="M8 10h8M8 13h5"/>',
    qr: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM20 14v.01M14 20h.01M17 20h4v-3"/>',
    scan: '<path d="M4 8V5a1 1 0 011-1h3M16 4h3a1 1 0 011 1v3M20 16v3a1 1 0 01-1 1h-3M8 20H5a1 1 0 01-1-1v-3M4 12h16"/>',
    trophy: '<path d="M8 4h8v5a4 4 0 01-8 0z"/><path d="M8 6H5a3 3 0 003 4M16 6h3a3 3 0 01-3 4M12 13v4M8 20h8M9 17h6v3H9z"/>',
    flame: '<path d="M12 3c1 3 5 5 5 10a5 5 0 01-10 0c0-2 1-3.5 2-4.5 0 2 1 3 2 3 0-3-1-5 1-8.5z"/>',
    star: '<path d="M12 3l2.8 5.8 6.2.9-4.5 4.4 1.1 6.3L12 17.4l-5.6 3 1.1-6.3L3 9.7l6.2-.9z"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    play: '<path d="M8 5v14l11-7z"/>',
    phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a1 1 0 01-1 1A16 16 0 014 5a1 1 0 011-1z"/>',
    pin: '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0114 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
    gift: '<rect x="3" y="8" width="18" height="5" rx="1"/><path d="M5 13v8h14v-8M12 8v13M12 8C10 4 6.5 4.5 7 7c.3 1 2 1 5 1zM12 8c2-4 5.5-3.5 5-1-.3 1-2 1-5 1z"/>',
    megaphone: '<path d="M3 10v4h3l8 5V5L6 10z"/><path d="M18 9a4 4 0 010 6M6 14l1.5 6h3L9 14.5"/>',
    card: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M7 15h4"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>',
    logout: '<path d="M15 4h3a2 2 0 012 2v12a2 2 0 01-2 2h-3M10 8l-4 4 4 4M6 12h10"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.3-4.3"/>',
    water: '<path d="M12 3s6 6.5 6 11a6 6 0 01-12 0c0-4.5 6-11 6-11z"/><path d="M9 14.5a3 3 0 003 3"/>',
    scale: '<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M8.5 10a5 5 0 017 0M12 10l1.5-2"/>',
    camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
    lock: '<rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 018 0v3"/>',
    spark: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>',
    bolt: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    chev: '<path d="M9 5l7 7-7 7"/>',
    back: '<path d="M15 5l-7 7 7 7"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    download: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
    send: '<path d="M4 12l16-8-6 16-3-7z"/><path d="M11 13l9-9"/>',
    trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13 7l4 4"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.01"/>',
    book: '<path d="M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2z"/><path d="M4 19V5M8 7h7"/>',
    timer: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2M10 2h4M12 2v3"/>',
    medal: '<path d="M8 3l4 6 4-6M7 3h10"/><circle cx="12" cy="15" r="6"/><path d="M12 12.5l.9 1.8 2 .3-1.4 1.4.3 2-1.8-1-1.8 1 .3-2-1.4-1.4 2-.3z"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    wallet: '<path d="M4 7a2 2 0 012-2h11v4"/><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M16 13.5h2"/>',
    tv: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    filter: '<path d="M4 5h16l-6 7.5V19l-4 2v-8.5z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  };
  function icon(name, size = 22, cls = '') { return `<svg class="ic ${cls}" viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${P[name] || P.dumbbell}</svg>`; }

  /* ───────── silueta animată ─────────
     fiecare tipar de mișcare are două poziții (A și B); interpolăm între ele.
     puncte: h cap, s umăr, e cot, w mână, p șold, k genunchi, a gleznă (+ f* = membrele din spate) */
  const Q = (o) => o;
  const PAT = {
    squat: { eq: 'bar', hi: ['legs'], A: Q({ h: [100, 36], s: [100, 58], e: [86, 70], w: [97, 57], p: [100, 110], k: [103, 148], a: [100, 186] }), B: Q({ h: [112, 74], s: [104, 94], e: [90, 106], w: [101, 93], p: [72, 140], k: [118, 146], a: [100, 186] }) },
    goblet: { eq: 'db-chest', hi: ['legs'], A: Q({ h: [100, 36], s: [100, 58], e: [104, 84], w: [110, 68], p: [100, 110], k: [103, 148], a: [100, 186] }), B: Q({ h: [108, 76], s: [102, 96], e: [108, 122], w: [114, 106], p: [74, 142], k: [118, 146], a: [100, 186] }) },
    legpress: { eq: 'press', hi: ['legs'], A: Q({ h: [46, 116], s: [58, 130], e: [70, 148], w: [80, 152], p: [96, 160], k: [118, 120], a: [150, 104] }), B: Q({ h: [46, 116], s: [58, 130], e: [70, 148], w: [80, 152], p: [96, 160], k: [146, 142], a: [178, 114] }) },
    lunge: { eq: 'db', hi: ['legs'], A: Q({ h: [100, 36], s: [100, 58], e: [100, 84], w: [100, 106], p: [100, 110], k: [104, 148], a: [104, 186], fk: [96, 148], fa: [94, 186] }), B: Q({ h: [100, 64], s: [100, 86], e: [100, 112], w: [100, 134], p: [100, 138], k: [130, 150], a: [130, 186], fk: [84, 176], fa: [62, 186] }) },
    hinge: { eq: 'bar', hi: ['hams'], A: Q({ h: [100, 36], s: [100, 58], e: [100, 84], w: [101, 108], p: [100, 110], k: [103, 148], a: [100, 186] }), B: Q({ h: [140, 74], s: [128, 88], e: [128, 114], w: [127, 140], p: [82, 114], k: [96, 150], a: [100, 186] }) },
    thrust: { eq: 'bar-hip', hi: ['glute'], A: Q({ h: [42, 108], s: [60, 120], e: [80, 140], w: [100, 150], p: [104, 154], k: [136, 132], a: [142, 186] }), B: Q({ h: [42, 108], s: [60, 120], e: [82, 120], w: [102, 122], p: [104, 122], k: [140, 124], a: [142, 186] }), bench: [30, 124, 46, 62] },
    bench: { eq: 'bar', hi: ['chest', 'arm'], A: Q({ h: [44, 122], s: [60, 126], e: [62, 102], w: [62, 78], p: [116, 128], k: [146, 150], a: [150, 186] }), B: Q({ h: [44, 122], s: [60, 126], e: [48, 140], w: [62, 112], p: [116, 128], k: [146, 150], a: [150, 186] }), bench: [30, 134, 100, 52] },
    incline: { eq: 'db', hi: ['chest', 'arm'], A: Q({ h: [56, 86], s: [66, 100], e: [74, 72], w: [76, 50], p: [110, 136], k: [146, 146], a: [150, 186] }), B: Q({ h: [56, 86], s: [66, 100], e: [52, 112], w: [70, 86], p: [110, 136], k: [146, 146], a: [150, 186] }), bench: [40, 140, 80, 46], incline: true },
    pushup: { eq: 'floor', hi: ['chest', 'arm'], A: Q({ h: [48, 106], s: [62, 112], e: [62, 136], w: [62, 160], p: [120, 126], k: [146, 134], a: [172, 142] }), B: Q({ h: [46, 140], s: [62, 146], e: [80, 140], w: [62, 160], p: [120, 150], k: [146, 154], a: [172, 156] }) },
    fly: { eq: 'cable', hi: ['chest'], A: Q({ h: [100, 36], s: [100, 58], e: [72, 66], w: [52, 70], p: [100, 110], k: [101, 148], a: [100, 186] }), B: Q({ h: [100, 36], s: [100, 58], e: [116, 76], w: [128, 86], p: [100, 110], k: [101, 148], a: [100, 186] }), cable: [20, 50] },
    pullup: { eq: 'pullbar', hi: ['back', 'arm'], A: Q({ h: [108, 60], s: [100, 72], e: [100, 52], w: [100, 30], p: [100, 124], k: [106, 160], a: [96, 190] }), B: Q({ h: [108, 28], s: [100, 46], e: [86, 52], w: [100, 30], p: [100, 98], k: [106, 134], a: [96, 164] }) },
    latpull: { eq: 'latbar', hi: ['back', 'arm'], A: Q({ h: [100, 72], s: [100, 92], e: [100, 64], w: [100, 38], p: [100, 146], k: [130, 148], a: [130, 186] }), B: Q({ h: [102, 72], s: [100, 92], e: [84, 104], w: [100, 72], p: [100, 146], k: [130, 148], a: [130, 186] }), cable: [100, 6] },
    row: { eq: 'db', hi: ['back', 'arm'], A: Q({ h: [142, 80], s: [128, 92], e: [128, 118], w: [128, 142], p: [80, 116], k: [96, 150], a: [100, 186] }), B: Q({ h: [142, 80], s: [128, 92], e: [106, 100], w: [120, 114], p: [80, 116], k: [96, 150], a: [100, 186] }) },
    cablerow: { eq: 'cable-h', hi: ['back', 'arm'], A: Q({ h: [114, 104], s: [104, 118], e: [130, 136], w: [154, 146], p: [80, 160], k: [118, 148], a: [154, 172] }), B: Q({ h: [92, 96], s: [86, 112], e: [74, 140], w: [100, 146], p: [80, 160], k: [118, 148], a: [154, 172] }), cable: [190, 146] },
    ohp: { eq: 'db', hi: ['shoulder', 'arm'], A: Q({ h: [100, 36], s: [100, 58], e: [88, 74], w: [94, 54], p: [100, 110], k: [101, 148], a: [100, 186] }), B: Q({ h: [100, 36], s: [100, 58], e: [98, 34], w: [100, 10], p: [100, 110], k: [101, 148], a: [100, 186] }) },
    lateral: { eq: 'db', front: true, hi: ['shoulder'], A: Q({ h: [100, 34], n: [100, 52], sl: [84, 58], el: [80, 84], wl: [80, 106], sr: [116, 58], er: [120, 84], wr: [120, 106], p: [100, 110], kl: [92, 148], al: [90, 186], kr: [108, 148], ar: [110, 186] }), B: Q({ h: [100, 34], n: [100, 52], sl: [84, 58], el: [60, 60], wl: [38, 64], sr: [116, 58], er: [140, 60], wr: [162, 64], p: [100, 110], kl: [92, 148], al: [90, 186], kr: [108, 148], ar: [110, 186] }) },
    curl: { eq: 'db', hi: ['arm'], A: Q({ h: [100, 36], s: [100, 58], e: [100, 86], w: [102, 112], p: [100, 110], k: [101, 148], a: [100, 186] }), B: Q({ h: [100, 36], s: [100, 58], e: [100, 86], w: [112, 62], p: [100, 110], k: [101, 148], a: [100, 186] }) },
    triceps: { eq: 'cable', hi: ['arm'], A: Q({ h: [104, 38], s: [100, 60], e: [102, 88], w: [118, 74], p: [98, 112], k: [100, 148], a: [100, 186] }), B: Q({ h: [104, 38], s: [100, 60], e: [102, 88], w: [106, 116], p: [98, 112], k: [100, 148], a: [100, 186] }), cable: [124, 4] },
    dips: { eq: 'parallel', hi: ['arm', 'chest'], A: Q({ h: [104, 40], s: [100, 62], e: [100, 82], w: [100, 102], p: [100, 114], k: [110, 142], a: [96, 154] }), B: Q({ h: [108, 64], s: [102, 86], e: [78, 92], w: [100, 102], p: [98, 138], k: [108, 166], a: [94, 178] }) },
    plank: { eq: 'floor', hi: ['core'], A: Q({ h: [50, 128], s: [62, 134], e: [62, 160], w: [86, 160], p: [120, 142], k: [146, 150], a: [172, 158] }), B: Q({ h: [50, 126], s: [62, 133], e: [62, 160], w: [86, 160], p: [120, 138], k: [146, 148], a: [172, 158] }) },
    crunch: { eq: 'cable', hi: ['core'], A: Q({ h: [100, 70], s: [102, 90], e: [92, 80], w: [100, 66], p: [106, 142], k: [110, 186], a: [150, 186] }), B: Q({ h: [134, 136], s: [126, 122], e: [124, 106], w: [134, 118], p: [106, 142], k: [110, 186], a: [150, 186] }), cable: [100, 4] },
    legraise: { eq: 'pullbar', hi: ['core'], A: Q({ h: [110, 58], s: [100, 70], e: [100, 50], w: [100, 30], p: [100, 122], k: [101, 158], a: [100, 192] }), B: Q({ h: [110, 58], s: [100, 70], e: [100, 50], w: [100, 30], p: [102, 120], k: [138, 112], a: [174, 104] }) },
    bike: { eq: 'bike', hi: ['legs'], cyc: true, A: Q({ h: [124, 46], s: [112, 64], e: [130, 82], w: [148, 84], p: [86, 112], k: [126, 108], a: [124, 150], fk: [118, 130], fa: [110, 172] }), B: Q({ h: [124, 46], s: [112, 64], e: [130, 82], w: [148, 84], p: [86, 112], k: [118, 130], a: [110, 172], fk: [126, 108], fa: [124, 150] }) },
    walk: { eq: 'tread', hi: ['legs'], cyc: true, A: Q({ h: [104, 34], s: [100, 56], e: [112, 80], w: [122, 96], p: [98, 108], k: [114, 144], a: [120, 178], fk: [90, 146], fa: [76, 172], fe: [90, 80], fw: [82, 100] }), B: Q({ h: [104, 34], s: [100, 56], e: [90, 80], w: [82, 100], p: [98, 108], k: [90, 146], a: [76, 172], fk: [114, 144], fa: [120, 178], fe: [112, 80], fw: [122, 96] }) },
    rower: { eq: 'rower', hi: ['back', 'legs'], A: Q({ h: [116, 104], s: [106, 118], e: [128, 136], w: [148, 140], p: [92, 162], k: [124, 128], a: [150, 162] }), B: Q({ h: [48, 100], s: [58, 116], e: [72, 140], w: [94, 136], p: [70, 162], k: [112, 150], a: [150, 162] }) },
  };
  const EXPAT = { ex_squat: 'squat', ex_goblet: 'goblet', ex_legpress: 'legpress', ex_lunge: 'lunge', ex_rdl: 'hinge', ex_hipthrust: 'thrust', ex_bench: 'bench', ex_dbpress: 'incline', ex_pushup: 'pushup', ex_fly: 'fly', ex_pullup: 'pullup', ex_latpull: 'latpull', ex_row: 'row', ex_cablerow: 'cablerow', ex_ohp: 'ohp', ex_lateral: 'lateral', ex_curl: 'curl', ex_triceps: 'triceps', ex_dips: 'dips', ex_plank: 'plank', ex_crunch: 'crunch', ex_legraise: 'legraise', ex_bike: 'bike', ex_treadmill: 'walk', ex_rowerg: 'rower' };
  const MUSCLE_PAT = { 'Picioare': 'squat', 'Femurali și fesieri': 'hinge', 'Fesieri': 'thrust', 'Piept': 'bench', 'Spate': 'row', 'Umeri': 'ohp', 'Brațe': 'curl', 'Abdomen': 'plank', 'Cardio': 'walk' };
  const patFor = (ex) => PAT[EXPAT[ex.id]] || PAT[MUSCLE_PAT[ex.muscle]] || PAT.squat;

  const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  function frame(pat, t) { const o = {}; for (const k in pat.A) o[k] = lerp(pat.A[k], pat.B[k] || pat.A[k], t); return o; }
  const L = (a, b, w, c, extra = '') => `<line x1="${a[0].toFixed(1)}" y1="${a[1].toFixed(1)}" x2="${b[0].toFixed(1)}" y2="${b[1].toFixed(1)}" stroke="${c}" stroke-width="${w}" stroke-linecap="round" ${extra}/>`;
  function drawFig(pat, t) {
    const f = frame(pat, t), ink = 'var(--fig, #EDEDF2)', far = 'var(--fig2, #55555F)', acc = 'var(--acc)', hi = pat.hi;
    const cl = (part) => (hi.includes(part) ? acc : ink), out = [];
    // echipament static
    if (pat.bench) { const [x, y, w, h] = pat.bench; out.push(pat.incline ? `<path d="M${x} ${y}L${x + 18} ${y - 50}L${x + 26} ${y - 46}L${x + 14} ${y + 4}H${x + w}V${y + 8}H${x}z" fill="#2B2B33"/><path d="M${x + 10} ${y + 8}v${h - 8}M${x + w - 10} ${y + 8}v${h - 8}" stroke="#2B2B33" stroke-width="5"/>` : `<rect x="${x}" y="${y}" width="${w}" height="8" rx="4" fill="#2B2B33"/><path d="M${x + 10} ${y + 8}v${h - 8}M${x + w - 10} ${y + 8}v${h - 8}" stroke="#2B2B33" stroke-width="5"/>`); }
    if (pat.eq === 'pullbar') out.push('<path d="M50 30H150" stroke="#55555F" stroke-width="6" stroke-linecap="round"/>');
    if (pat.eq === 'parallel') out.push('<path d="M70 102H150" stroke="#55555F" stroke-width="6" stroke-linecap="round"/><path d="M78 102v90M142 102v90" stroke="#2B2B33" stroke-width="5"/>');
    if (pat.eq === 'press') out.push(`<rect x="20" y="150" width="90" height="10" rx="5" fill="#2B2B33" transform="rotate(-25 60 155)"/><g transform="translate(${f.a[0] - 4} ${f.a[1] - 22}) rotate(-28)"><rect width="10" height="44" rx="3" fill="#3A3A44"/></g><path d="M150 40L190 160" stroke="#2B2B33" stroke-width="6"/>`);
    if (pat.eq === 'bike') out.push('<path d="M86 118L118 176M70 112h32M124 150l24-62M140 82h18M96 176h48" stroke="#3A3A44" stroke-width="7" stroke-linecap="round"/><circle cx="117" cy="150" r="22" fill="none" stroke="#2B2B33" stroke-width="5"/>');
    if (pat.eq === 'tread') out.push('<path d="M40 182L176 170" stroke="#3A3A44" stroke-width="10" stroke-linecap="round"/><path d="M168 172L156 70h18" stroke="#2B2B33" stroke-width="6" stroke-linecap="round"/>');
    if (pat.eq === 'rower') out.push('<path d="M30 172H190" stroke="#3A3A44" stroke-width="8" stroke-linecap="round"/><rect x="' + (f.p[0] - 16) + '" y="162" width="32" height="8" rx="3" fill="#55555F"/><circle cx="182" cy="140" r="16" fill="none" stroke="#2B2B33" stroke-width="6"/>');
    if (pat.eq === 'floor' || pat.eq === 'tread' || pat.eq === 'rower' || pat.eq === 'press') {} else out.push('<path d="M20 192H180" stroke="#2B2B33" stroke-width="3" stroke-linecap="round"/>');
    if (pat.eq === 'floor') out.push('<path d="M20 163H185" stroke="#2B2B33" stroke-width="3" stroke-linecap="round"/>');
    if (pat.cable) { const w = f.w || f.wr; out.push(L(pat.cable, w, 2, '#6A6A75', 'stroke-dasharray="1 0"')); out.push(`<circle cx="${pat.cable[0]}" cy="${pat.cable[1]}" r="5" fill="#55555F"/>`); }
    if (pat.front) {
      out.push(L(f.p, [f.p[0] - 8, f.p[1]], 12, ink), L(f.p, [f.p[0] + 8, f.p[1]], 12, ink));
      out.push(L([f.p[0] - 8, f.p[1]], f.kl, 12, cl('legs')), L(f.kl, f.al, 11, cl('legs')), L([f.p[0] + 8, f.p[1]], f.kr, 12, cl('legs')), L(f.kr, f.ar, 11, cl('legs')));
      out.push(L(f.n, f.p, 20, ink), L(f.sl, f.sr, 14, cl('shoulder')));
      out.push(L(f.sl, f.el, 10, cl('shoulder')), L(f.el, f.wl, 9, ink), L(f.sr, f.er, 10, cl('shoulder')), L(f.er, f.wr, 9, ink));
      out.push(`<circle cx="${f.h[0]}" cy="${f.h[1]}" r="12" fill="${ink}"/>`);
      [f.wl, f.wr].forEach((w) => out.push(db(w)));
      return out.join('');
    }
    // membrele din spate (mai închise)
    const fk = f.fk || [f.k[0] - 5, f.k[1]], fa = f.fa || [f.a[0] - 5, f.a[1]];
    out.push(L(f.p, fk, 12, far), L(fk, fa, 11, far));
    if (f.fe) out.push(L(f.s, f.fe, 9, far), L(f.fe, f.fw, 8, far));
    // trunchi și picioare
    const toe = [fa, f.a].map((a) => [a[0] + 12, a[1] + 1]);
    out.push(L(fa, toe[0], 8, far));
    out.push(L(f.p, f.k, 13, hi.includes('legs') || hi.includes('glute') || hi.includes('hams') ? acc : ink), L(f.k, f.a, 11, cl('legs')), L(f.a, toe[1], 8, ink));
    out.push(L(f.s, f.p, 18, hi.includes('core') || hi.includes('back') ? acc : hi.includes('chest') ? `url(#fg)` : ink));
    // cap
    out.push(`<circle cx="${f.h[0].toFixed(1)}" cy="${f.h[1].toFixed(1)}" r="11.5" fill="${ink}"/>`);
    // braț
    out.push(L(f.s, f.e, 10, hi.includes('arm') || hi.includes('shoulder') ? acc : ink), L(f.e, f.w, 9, hi.includes('arm') ? acc : ink));
    // greutăți
    if (pat.eq === 'bar') out.push(`<circle cx="${f.w[0]}" cy="${f.w[1]}" r="15" fill="#3A3A44" stroke="#6A6A75" stroke-width="3"/><circle cx="${f.w[0]}" cy="${f.w[1]}" r="4" fill="#9A9AA8"/>`);
    if (pat.eq === 'bar-hip') out.push(`<circle cx="${f.p[0]}" cy="${f.p[1] - 14}" r="15" fill="#3A3A44" stroke="#6A6A75" stroke-width="3"/>`);
    if (pat.eq === 'db' || pat.eq === 'db-chest') out.push(db(f.w));
    if (pat.eq === 'latbar' || pat.eq === 'cable' || pat.eq === 'cable-h') out.push(`<circle cx="${f.w[0]}" cy="${f.w[1]}" r="5" fill="#9A9AA8"/>`);
    if (pat.eq === 'latbar') out.push(L([f.w[0] - 26, f.w[1] - 4], [f.w[0] + 26, f.w[1] - 4], 5, '#9A9AA8'));
    if (pat.eq === 'pullbar' || pat.eq === 'parallel') out.push(`<circle cx="${f.w[0]}" cy="${f.w[1]}" r="5.5" fill="${ink}"/>`);
    return out.join('');
  }
  const db = (w) => `<g transform="translate(${w[0].toFixed(1)} ${w[1].toFixed(1)})"><rect x="-11" y="-3" width="22" height="6" rx="2" fill="#9A9AA8"/><rect x="-14" y="-8" width="7" height="16" rx="2" fill="#3A3A44" stroke="#6A6A75" stroke-width="1.5"/><rect x="7" y="-8" width="7" height="16" rx="2" fill="#3A3A44" stroke="#6A6A75" stroke-width="1.5"/></g>`;

  // animatori activi (o singură buclă pentru toate)
  const live = new Set(); let raf = 0;
  const reduce = () => root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function loop(ts) {
    raf = 0;
    for (const a of live) {
      if (!a.el.isConnected) { live.delete(a); continue; }
      const ph = ((ts - a.t0) / a.period) % 1, t = a.pat.cyc ? (1 - Math.cos(ph * 2 * Math.PI)) / 2 : ph < 0.45 ? (1 - Math.cos((ph / 0.45) * Math.PI)) / 2 : ph < 0.55 ? 1 : (1 + Math.cos(((ph - 0.55) / 0.45) * Math.PI)) / 2;
      a.g.innerHTML = drawFig(a.pat, t);
    }
    if (live.size) raf = requestAnimationFrame(loop);
  }
  function figure(ex, o = {}) {
    const pat = patFor(ex), id = 'f' + Math.random().toString(36).slice(2, 8);
    return `<svg class="fig${o.still ? ' still' : ''}" viewBox="0 0 200 200" data-fig="${id}" data-pat="${EXPAT[ex.id] || ''}" role="img" aria-label="Animație: ${String(ex.name || '').replace(/"/g, '')}" style="${o.style || ''}"><defs><linearGradient id="fg" x1="0" x2="1"><stop offset="0" stop-color="var(--acc)"/><stop offset="1" stop-color="var(--fig, #EDEDF2)"/></linearGradient></defs><g>${drawFig(pat, 0.35)}</g></svg>`;
  }
  // pornește animațiile pentru toate siluetele din element
  function animate(rootEl, exFind) {
    (rootEl || document).querySelectorAll('svg.fig[data-fig]:not(.still)').forEach((el) => {
      if (el._on) return; el._on = 1;
      const pat = PAT[el.dataset.pat] || (exFind && patFor(exFind(el))) || PAT.squat;
      if (reduce()) { el.querySelector('g').innerHTML = drawFig(pat, 0.5); return; }
      live.add({ el, g: el.querySelector('g'), pat, t0: performance.now() - Math.random() * 500, period: pat.cyc ? 1100 : 2600 });
    });
    if (live.size && !raf) raf = requestAnimationFrame(loop);
  }

  /* ───────── harta mușchilor (față și spate) ───────── */
  const EXMUS = {
    ex_squat: [['quads', 'glutes'], ['hams', 'core', 'lowerback', 'calves']], ex_goblet: [['quads', 'glutes'], ['core', 'hams']], ex_legpress: [['quads'], ['glutes', 'hams', 'calves']],
    ex_lunge: [['quads', 'glutes'], ['hams', 'calves', 'core']], ex_rdl: [['hams', 'glutes'], ['lowerback', 'traps', 'forearms']], ex_hipthrust: [['glutes'], ['hams', 'quads']],
    ex_bench: [['chest'], ['triceps', 'delts']], ex_dbpress: [['chest', 'delts'], ['triceps']], ex_pushup: [['chest'], ['triceps', 'delts', 'core']], ex_fly: [['chest'], ['delts']],
    ex_pullup: [['lats'], ['biceps', 'traps', 'forearms']], ex_latpull: [['lats'], ['biceps', 'traps']], ex_row: [['lats', 'traps'], ['biceps', 'reardelts']], ex_cablerow: [['lats', 'traps'], ['biceps', 'reardelts', 'lowerback']],
    ex_ohp: [['delts'], ['triceps', 'traps']], ex_lateral: [['delts'], ['traps']], ex_curl: [['biceps'], ['forearms']], ex_triceps: [['triceps'], []], ex_dips: [['triceps', 'chest'], ['delts']],
    ex_plank: [['core'], ['delts', 'glutes', 'obliques']], ex_crunch: [['core'], ['obliques']], ex_legraise: [['core'], ['obliques', 'forearms']],
    ex_bike: [['quads'], ['calves', 'hams', 'glutes']], ex_treadmill: [['glutes', 'calves'], ['quads', 'hams']], ex_rowerg: [['lats', 'quads'], ['hams', 'biceps', 'core', 'traps']],
  };
  const BY_GROUP = { 'Picioare': [['quads'], ['glutes']], 'Femurali și fesieri': [['hams', 'glutes'], []], 'Fesieri': [['glutes'], ['hams']], 'Piept': [['chest'], ['triceps']], 'Spate': [['lats'], ['biceps']], 'Umeri': [['delts'], []], 'Brațe': [['biceps', 'triceps'], []], 'Abdomen': [['core'], ['obliques']], 'Cardio': [['quads'], ['calves']] };
  const MNAME = { chest: 'Piept', delts: 'Umeri', biceps: 'Biceps', triceps: 'Triceps', forearms: 'Antebrațe', core: 'Abdomen', obliques: 'Oblici', quads: 'Cvadricepși', hams: 'Femurali', glutes: 'Fesieri', calves: 'Gambe', lats: 'Dorsali', traps: 'Trapez', lowerback: 'Lombari', reardelts: 'Umăr spate' };
  function musclesOf(ex) { return EXMUS[ex.id] || BY_GROUP[ex.muscle] || [[], []]; }
  // forme simple pentru fiecare mușchi; [mușchi, formă svg]
  const E = (cx, cy, rx, ry, rot = 0) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}"${rot ? ` transform="rotate(${rot} ${cx} ${cy})"` : ''}/>`;
  const FRONT = [['delts', E(31, 47, 7, 8, -20) + E(69, 47, 7, 8, 20)], ['chest', E(42, 56, 9, 7, 8) + E(58, 56, 9, 7, -8)], ['biceps', E(26, 66, 4.6, 10, 12) + E(74, 66, 4.6, 10, -12)], ['forearms', E(21, 90, 4, 11, 10) + E(79, 90, 4, 11, -10)], ['core', '<rect x="43" y="66" width="14" height="34" rx="6"/>'], ['obliques', E(37, 82, 4, 10, 8) + E(63, 82, 4, 10, -8)], ['quads', E(41, 128, 7.5, 21, 6) + E(59, 128, 7.5, 21, -6)], ['calves', E(40, 170, 4.5, 12) + E(60, 170, 4.5, 12)]];
  const BACK = [['traps', '<path d="M50 34L36 45L50 62L64 45z"/>'], ['reardelts', E(31, 48, 7, 7, -20) + E(69, 48, 7, 7, 20)], ['delts', ''], ['lats', '<path d="M38 52Q32 72 42 88L49 80V56zM62 52Q68 72 58 88L51 80V56z"/>'], ['triceps', E(26, 66, 4.8, 10, 12) + E(74, 66, 4.8, 10, -12)], ['forearms', E(21, 90, 4, 11, 10) + E(79, 90, 4, 11, -10)], ['lowerback', '<rect x="44" y="84" width="12" height="16" rx="5"/>'], ['glutes', E(43, 110, 8, 8) + E(57, 110, 8, 8)], ['hams', E(41, 134, 7, 18, 4) + E(59, 134, 7, 18, -4)], ['calves', E(40, 168, 5.5, 12) + E(60, 168, 5.5, 12)]];
  const SIL = '<circle cx="50" cy="16" r="10"/><rect x="45" y="24" width="10" height="8" rx="3"/><path d="M28 38Q50 30 72 38L76 54L66 100L68 112H32L34 100L24 54z"/><path d="M24 42Q18 60 20 76L16 104L23 106L30 78L32 54z"/><path d="M76 42Q82 60 80 76L84 104L77 106L70 78L68 54z"/><path d="M33 108L31 150L33 188H44L46 150L49 112z"/><path d="M67 108L69 150L67 188H56L54 150L51 112z"/>';
  function muscleMap(ex) {
    const [pri, sec] = musclesOf(ex);
    const draw = (parts) => parts.map(([k, sh]) => (sh ? `<g class="mu ${pri.includes(k) ? 'p' : sec.includes(k) ? 's' : ''}">${sh}</g>` : '')).join('');
    return `<div class="mmap"><figure><svg viewBox="0 0 100 196" role="img" aria-label="Mușchi lucrați, față"><g class="sil">${SIL}</g>${draw(FRONT)}</svg><figcaption>față</figcaption></figure><figure><svg viewBox="0 0 100 196" role="img" aria-label="Mușchi lucrați, spate"><g class="sil">${SIL}</g>${draw(BACK)}</svg><figcaption>spate</figcaption></figure>
      <div class="mleg">${pri.map((k) => `<span class="ml p">${MNAME[k]}</span>`).join('')}${sec.map((k) => `<span class="ml s">${MNAME[k]}</span>`).join('')}</div></div>`;
  }


  /* ───────── insignele rangurilor Empire ───────── */
  const RK_COL = [['#8A8F98', '#4B4F57'], ['#B8F05A', '#4E8A16'], ['#E8F4D8', '#7A8A70'], ['#FFD66B', '#B07A10'], ['#FFE58A', '#C98B00']];
  const CHEV = (y) => `<path d="M30 ${y}L50 ${y + 11}L70 ${y}" fill="none" stroke="#0A0A0C" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>`;
  const SYM = [
    CHEV(50),
    CHEV(42) + CHEV(58),
    CHEV(36) + CHEV(50) + CHEV(64),
    '<path d="M50 30l5.6 11.4 12.6 1.8-9.1 8.9 2.1 12.5L50 58.7l-11.2 5.9 2.1-12.5-9.1-8.9 12.6-1.8z" fill="#0A0A0C"/><path d="M30 72q20 10 40 0" fill="none" stroke="#0A0A0C" stroke-width="5" stroke-linecap="round"/>',
    '<path d="M28 66L24 38l14 12 12-20 12 20 14-12-4 28z" fill="#0A0A0C"/><rect x="28" y="69" width="44" height="6" rx="3" fill="#0A0A0C"/><circle cx="24" cy="36" r="4" fill="#0A0A0C"/><circle cx="50" cy="27" r="4" fill="#0A0A0C"/><circle cx="76" cy="36" r="4" fill="#0A0A0C"/>',
  ];
  function rankBadge(idx, size = 48) {
    const i = Math.max(0, Math.min(4, idx | 0)), [a, b] = RK_COL[i], id = 'rk' + i + Math.random().toString(36).slice(2, 6);
    return `<svg class="rkb" viewBox="0 0 100 110" width="${size}" height="${size * 1.1}" aria-hidden="true"><defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>
      <path d="M50 4L92 18V52C92 78 72 96 50 106C28 96 8 78 8 52V18Z" fill="url(#${id})" stroke="rgba(255,255,255,.35)" stroke-width="2"/>
      <path d="M50 12L84 23.5V52C84 73 68 88 50 97C32 88 16 73 16 52V23.5Z" fill="none" stroke="rgba(0,0,0,.25)" stroke-width="2"/>${SYM[i]}</svg>`;
  }
  root.GymFig = { rankBadge, drawFig: (k, t) => drawFig(PAT[k], t), PATS: Object.keys(PAT), icon, figure, animate, muscleMap, musclesOf, MNAME, patFor };
})(this);
