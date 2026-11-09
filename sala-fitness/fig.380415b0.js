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
    // recuperare (podeaua la y=163 pentru exercițiile pe sol)
    catcow: { eq: 'floor', hi: ['back', 'core'], A: Q({ h: [50, 112], s: [70, 114], e: [70, 138], w: [70, 160], p: [130, 116], k: [130, 160], a: [170, 162] }), B: Q({ h: [56, 122], s: [72, 104], e: [70, 132], w: [70, 160], p: [130, 106], k: [130, 160], a: [170, 162] }) },
    birddog: { eq: 'floor', hi: ['back', 'core'], A: Q({ h: [52, 104], s: [70, 112], e: [70, 136], w: [70, 160], p: [130, 112], k: [130, 160], a: [170, 162], fe: [70, 136], fw: [70, 160] }), B: Q({ h: [52, 98], s: [70, 112], e: [44, 114], w: [16, 114], p: [130, 112], k: [162, 110], a: [194, 108], fk: [130, 160], fa: [170, 162], fe: [70, 136], fw: [70, 160] }) },
    deadbug: { eq: 'floor', hi: ['core'], A: Q({ h: [46, 150], s: [66, 152], e: [68, 126], w: [70, 100], p: [128, 152], k: [130, 120], a: [162, 120], fk: [126, 120], fa: [158, 120], fe: [68, 126], fw: [70, 100] }), B: Q({ h: [46, 150], s: [66, 152], e: [54, 128], w: [38, 108], p: [128, 152], k: [158, 140], a: [190, 148], fk: [126, 120], fa: [158, 120], fe: [68, 126], fw: [70, 100] }) },
    bridge: { eq: 'floor', hi: ['glute'], A: Q({ h: [40, 152], s: [60, 154], e: [82, 158], w: [104, 160], p: [112, 154], k: [140, 124], a: [152, 160] }), B: Q({ h: [40, 152], s: [60, 152], e: [82, 158], w: [104, 160], p: [112, 122], k: [144, 118], a: [152, 160] }) },
    childpose: { eq: 'floor', hi: ['back'], A: Q({ h: [106, 60], s: [106, 80], e: [102, 102], w: [100, 122], p: [108, 120], k: [112, 160], a: [152, 162] }), B: Q({ h: [70, 152], s: [88, 144], e: [56, 156], w: [26, 160], p: [140, 146], k: [112, 160], a: [152, 162] }) },
    hipflexor: { eq: 'none', hi: ['legs'], A: Q({ h: [98, 80], s: [98, 102], e: [112, 124], w: [104, 146], p: [98, 148], k: [132, 150], a: [132, 190], fk: [76, 188], fa: [44, 190] }), B: Q({ h: [106, 82], s: [106, 104], e: [120, 126], w: [112, 148], p: [110, 154], k: [136, 150], a: [132, 190], fk: [76, 188], fa: [44, 190] }) },
    chintuck: { eq: 'none', hi: ['shoulder'], A: Q({ h: [112, 37], s: [100, 58], e: [100, 86], w: [102, 110], p: [100, 110], k: [101, 148], a: [100, 186] }), B: Q({ h: [100, 35], s: [100, 58], e: [100, 86], w: [102, 110], p: [100, 110], k: [101, 148], a: [100, 186] }) },
    wallangel: { eq: 'none', front: true, hi: ['shoulder'], A: Q({ h: [100, 34], n: [100, 52], sl: [84, 58], el: [64, 60], wl: [62, 36], sr: [116, 58], er: [136, 60], wr: [138, 36], p: [100, 110], kl: [92, 148], al: [90, 186], kr: [108, 148], ar: [110, 186] }), B: Q({ h: [100, 34], n: [100, 52], sl: [84, 58], el: [72, 30], wl: [84, 8], sr: [116, 58], er: [128, 30], wr: [116, 8], p: [100, 110], kl: [92, 148], al: [90, 186], kr: [108, 148], ar: [110, 186] }) },
    facepull: { eq: 'cable', hi: ['shoulder', 'back'], A: Q({ h: [96, 36], s: [96, 58], e: [124, 56], w: [150, 52], p: [96, 110], k: [98, 148], a: [96, 186] }), B: Q({ h: [96, 36], s: [96, 58], e: [86, 46], w: [112, 36], p: [96, 110], k: [98, 148], a: [96, 186] }), cable: [190, 44] },
    mpinc: { eq: 'mpress', hi: ['chest', 'arm'], A: Q({ h: [70, 58], s: [76, 80], e: [104, 66], w: [128, 50], p: [90, 140], k: [128, 142], a: [130, 186] }), B: Q({ h: [70, 58], s: [76, 80], e: [66, 102], w: [94, 82], p: [90, 140], k: [128, 142], a: [130, 186] }), piv: [58, 18] },
    mphor: { eq: 'mpress', hi: ['chest', 'arm'], A: Q({ h: [70, 58], s: [76, 80], e: [108, 84], w: [138, 82], p: [90, 140], k: [128, 142], a: [130, 186] }), B: Q({ h: [70, 58], s: [76, 80], e: [66, 102], w: [96, 92], p: [90, 140], k: [128, 142], a: [130, 186] }), piv: [60, 150] },
    mpdec: { eq: 'mpress', hi: ['chest', 'arm'], A: Q({ h: [70, 58], s: [76, 80], e: [106, 96], w: [134, 106], p: [90, 140], k: [128, 142], a: [130, 186] }), B: Q({ h: [70, 58], s: [76, 80], e: [66, 108], w: [98, 104], p: [90, 140], k: [128, 142], a: [130, 186] }), piv: [62, 22] },
    wallsit: { eq: 'none', wall: true, hi: ['legs'], A: Q({ h: [62, 80], s: [62, 102], e: [80, 122], w: [100, 132], p: [64, 144], k: [104, 142], a: [104, 188] }), B: Q({ h: [62, 84], s: [62, 106], e: [80, 126], w: [100, 135], p: [64, 148], k: [104, 146], a: [104, 188] }) },
  };
  const EXPAT = { ex_m_chestpress: 'mphor', ex_m_pecfly: 'fly', ex_m_incpress: 'mpinc', ex_m_decpress: 'mpdec', ex_squat: 'squat', ex_goblet: 'goblet', ex_legpress: 'legpress', ex_lunge: 'lunge', ex_rdl: 'hinge', ex_hipthrust: 'thrust', ex_bench: 'bench', ex_dbpress: 'incline', ex_pushup: 'pushup', ex_fly: 'fly', ex_pullup: 'pullup', ex_latpull: 'latpull', ex_row: 'row', ex_cablerow: 'cablerow', ex_ohp: 'ohp', ex_lateral: 'lateral', ex_curl: 'curl', ex_triceps: 'triceps', ex_dips: 'dips', ex_plank: 'plank', ex_crunch: 'crunch', ex_legraise: 'legraise', ex_bike: 'bike', ex_treadmill: 'walk', ex_rowerg: 'rower', ex_catcow: 'catcow', ex_birddog: 'birddog', ex_deadbug: 'deadbug', ex_bridge: 'bridge', ex_childpose: 'childpose', ex_hipflexor: 'hipflexor', ex_chintuck: 'chintuck', ex_wallangel: 'wallangel', ex_facepull: 'facepull', ex_wallsit: 'wallsit' };
  const MUSCLE_PAT = { 'Picioare': 'squat', 'Femurali și fesieri': 'hinge', 'Fesieri': 'thrust', 'Piept': 'bench', 'Spate': 'row', 'Umeri': 'ohp', 'Brațe': 'curl', 'Abdomen': 'plank', 'Cardio': 'walk', 'Recuperare': 'catcow' };
  const patFor = (ex) => PAT[EXPAT[ex.id]] || PAT[MUSCLE_PAT[ex.muscle]] || PAT.squat;

  const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  function frame(pat, t) { const o = {}; for (const k in pat.A) o[k] = lerp(pat.A[k], pat.B[k] || pat.A[k], t); return o; }
  const L = (a, b, w, c, extra = '') => `<line x1="${a[0].toFixed(1)}" y1="${a[1].toFixed(1)}" x2="${b[0].toFixed(1)}" y2="${b[1].toFixed(1)}" stroke="${c}" stroke-width="${w}" stroke-linecap="round" ${extra}/>`;
  function drawFig(pat, t) {
    const f = frame(pat, t), ink = 'var(--fig, #EDEDF2)', far = 'var(--fig2, #55555F)', acc = 'var(--acc)', hi = pat.hi;
    const cl = (part) => (hi.includes(part) ? acc : ink), out = [];
    // echipament static
    if (pat.bench) { const [x, y, w, h] = pat.bench; out.push(pat.incline ? `<path d="M${x} ${y}L${x + 18} ${y - 50}L${x + 26} ${y - 46}L${x + 14} ${y + 4}H${x + w}V${y + 8}H${x}z" fill="#2B2B33"/><path d="M${x + 10} ${y + 8}v${h - 8}M${x + w - 10} ${y + 8}v${h - 8}" stroke="#2B2B33" stroke-width="5"/>` : `<rect x="${x}" y="${y}" width="${w}" height="8" rx="4" fill="#2B2B33"/><path d="M${x + 10} ${y + 8}v${h - 8}M${x + w - 10} ${y + 8}v${h - 8}" stroke="#2B2B33" stroke-width="5"/>`); }
    if (pat.eq === 'mpress') out.push(`<path d="M24 192L34 14H54L48 192Z" fill="#24242B"/><path d="M${P2(f.p[0] - 4, f.p[1] + 4)}L${P2(f.h[0] - 18, f.h[1] - 22)}" stroke="#2F6B45" stroke-width="13" stroke-linecap="round"/><path d="M${P2(f.p[0] - 6, f.p[1] + 7)}H${(f.p[0] + 28).toFixed(1)}" stroke="#2F6B45" stroke-width="10" stroke-linecap="round"/><path d="M${P2(f.p[0] + 4, f.p[1] + 12)}L${P2(f.p[0] - 4, 192)}" stroke="#2B2B33" stroke-width="7"/><rect x="34" y="150" width="14" height="30" rx="3" fill="var(--acc)" opacity=".8"/>`, L(pat.piv, f.w, 6, '#6A6A75'), `<circle cx="${pat.piv[0]}" cy="${pat.piv[1]}" r="6" fill="#55555F"/><circle cx="${f.w[0].toFixed(1)}" cy="${f.w[1].toFixed(1)}" r="5" fill="#9A9AA8"/>`);
    if (pat.eq === 'pullbar') out.push('<path d="M50 30H150" stroke="#55555F" stroke-width="6" stroke-linecap="round"/>');
    if (pat.eq === 'parallel') out.push('<path d="M70 102H150" stroke="#55555F" stroke-width="6" stroke-linecap="round"/><path d="M78 102v90M142 102v90" stroke="#2B2B33" stroke-width="5"/>');
    if (pat.eq === 'press') out.push(`<rect x="20" y="150" width="90" height="10" rx="5" fill="#2B2B33" transform="rotate(-25 60 155)"/><g transform="translate(${f.a[0] - 4} ${f.a[1] - 22}) rotate(-28)"><rect width="10" height="44" rx="3" fill="#3A3A44"/></g><path d="M150 40L190 160" stroke="#2B2B33" stroke-width="6"/>`);
    if (pat.eq === 'bike') out.push('<path d="M86 118L118 176M70 112h32M124 150l24-62M140 82h18M96 176h48" stroke="#3A3A44" stroke-width="7" stroke-linecap="round"/><circle cx="117" cy="150" r="22" fill="none" stroke="#2B2B33" stroke-width="5"/>');
    if (pat.eq === 'tread') out.push('<path d="M40 182L176 170" stroke="#3A3A44" stroke-width="10" stroke-linecap="round"/><path d="M168 172L156 70h18" stroke="#2B2B33" stroke-width="6" stroke-linecap="round"/>');
    if (pat.eq === 'rower') out.push('<path d="M30 172H190" stroke="#3A3A44" stroke-width="8" stroke-linecap="round"/><rect x="' + (f.p[0] - 16) + '" y="162" width="32" height="8" rx="3" fill="#55555F"/><circle cx="182" cy="140" r="16" fill="none" stroke="#2B2B33" stroke-width="6"/>');
    if (pat.wall) out.push('<path d="M44 14V192" stroke="#3A3A44" stroke-width="8" stroke-linecap="round"/>');
    if (pat.eq === 'floor' || pat.eq === 'tread' || pat.eq === 'rower' || pat.eq === 'press') {} else out.push('<path d="M20 192H180" stroke="#2B2B33" stroke-width="3" stroke-linecap="round"/>');
    if (pat.eq === 'floor') out.push('<path d="M20 163H185" stroke="#2B2B33" stroke-width="3" stroke-linecap="round"/>');
    if (pat.cable) { const w = f.w || f.wr; out.push(L(pat.cable, w, 2, '#6A6A75', 'stroke-dasharray="1 0"')); out.push(`<circle cx="${pat.cable[0]}" cy="${pat.cable[1]}" r="5" fill="#55555F"/>`); }
    if (pat.front) {
      out.push(L(f.p, [f.p[0] - 8, f.p[1]], 12, ink), L(f.p, [f.p[0] + 8, f.p[1]], 12, ink));
      out.push(L([f.p[0] - 8, f.p[1]], f.kl, 12, cl('legs')), L(f.kl, f.al, 11, cl('legs')), L([f.p[0] + 8, f.p[1]], f.kr, 12, cl('legs')), L(f.kr, f.ar, 11, cl('legs')));
      out.push(L(f.n, f.p, 20, ink), L(f.sl, f.sr, 14, cl('shoulder')));
      out.push(L(f.sl, f.el, 10, cl('shoulder')), L(f.el, f.wl, 9, ink), L(f.sr, f.er, 10, cl('shoulder')), L(f.er, f.wr, 9, ink));
      out.push(`<circle cx="${f.h[0]}" cy="${f.h[1]}" r="12" fill="${ink}"/>`);
      if (pat.eq !== 'none') [f.wl, f.wr].forEach((w) => out.push(db(w)));
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
    ex_m_chestpress: [['chest'], ['triceps', 'delts']], ex_m_pecfly: [['chest'], ['delts']], ex_m_incpress: [['chest', 'delts'], ['triceps']], ex_m_decpress: [['chest'], ['triceps', 'delts']], ex_bench: [['chest'], ['triceps', 'delts']], ex_dbpress: [['chest', 'delts'], ['triceps']], ex_pushup: [['chest'], ['triceps', 'delts', 'core']], ex_fly: [['chest'], ['delts']],
    ex_pullup: [['lats'], ['biceps', 'traps', 'forearms']], ex_latpull: [['lats'], ['biceps', 'traps']], ex_row: [['lats', 'traps'], ['biceps', 'reardelts']], ex_cablerow: [['lats', 'traps'], ['biceps', 'reardelts', 'lowerback']],
    ex_ohp: [['delts'], ['triceps', 'traps']], ex_lateral: [['delts'], ['traps']], ex_curl: [['biceps'], ['forearms']], ex_triceps: [['triceps'], []], ex_dips: [['triceps', 'chest'], ['delts']],
    ex_plank: [['core'], ['delts', 'glutes', 'obliques']], ex_crunch: [['core'], ['obliques']], ex_legraise: [['core'], ['obliques', 'forearms']],
    ex_bike: [['quads'], ['calves', 'hams', 'glutes']],
    ex_catcow: [['lowerback'], ['core', 'traps']], ex_birddog: [['core', 'lowerback'], ['glutes', 'delts']], ex_deadbug: [['core'], ['obliques']], ex_bridge: [['glutes'], ['hams', 'lowerback']], ex_childpose: [['lowerback', 'lats'], []],
    ex_hipflexor: [['quads'], ['core', 'glutes']], ex_chintuck: [['traps'], []], ex_wallangel: [['traps', 'reardelts'], ['delts']], ex_facepull: [['reardelts', 'traps'], ['delts']], ex_wallsit: [['quads'], ['glutes', 'calves']], ex_treadmill: [['glutes', 'calves'], ['quads', 'hams']], ex_rowerg: [['lats', 'quads'], ['hams', 'biceps', 'core', 'traps']],
  };
  const BY_GROUP = { 'Picioare': [['quads'], ['glutes']], 'Femurali și fesieri': [['hams', 'glutes'], []], 'Fesieri': [['glutes'], ['hams']], 'Piept': [['chest'], ['triceps']], 'Spate': [['lats'], ['biceps']], 'Umeri': [['delts'], []], 'Brațe': [['biceps', 'triceps'], []], 'Abdomen': [['core'], ['obliques']], 'Recuperare': [['lowerback'], ['core']], 'Cardio': [['quads'], ['calves']] };
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

  /* ───────── figurina realistă: proporții de om adult, umbre și mușchi ───────── */
  const shade = (hex, f) => { const m = /^#([0-9a-f]{6})$/i.exec(hex); if (!m) return hex; const n = parseInt(m[1], 16); const c = [n >> 16, (n >> 8) & 255, n & 255].map((v) => Math.max(0, Math.min(255, Math.round(f < 0 ? v * (1 + f) : v + (255 - v) * f)))); return '#' + c.map((v) => v.toString(16).padStart(2, '0')).join(''); };
  // un membru (braț / picior) desenat ca formă plină, din puncte cu lățimi
  function limb(pts) {
    const L = [], R = [];
    for (let i = 0; i < pts.length; i++) {
      const [x, y, w] = pts[i], a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
      let dx = b[0] - a[0], dy = b[1] - a[1]; const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d;
      L.push([x - dy * w / 2, y + dx * w / 2]); R.push([x + dy * w / 2, y - dx * w / 2]);
    }
    const sm = (arr, mv) => arr.map((p, i) => (i === 0 ? `${mv ? 'M' : 'L'}${P2(p[0], p[1])}` : i === arr.length - 1 ? `L${P2(p[0], p[1])}` : `Q${P2(p[0], p[1])} ${P2((p[0] + arr[i + 1][0]) / 2, (p[1] + arr[i + 1][1]) / 2)}`)).join('');
    const rr = R.slice().reverse(), first = pts[0], last = pts[pts.length - 1];
    return `${sm(L, true)}A${(last[2] / 2).toFixed(1)} ${(last[2] / 2).toFixed(1)} 0 0 0 ${P2(rr[0][0], rr[0][1])}${sm(rr, false)}A${(first[2] / 2).toFixed(1)} ${(first[2] / 2).toFixed(1)} 0 0 0 ${P2(L[0][0], L[0][1])}Z`;
  }
  function heroReal(L, rank, o) {
    const r = Math.max(0, Math.min(4, rank | 0)), F = L.body === 'F', sk = pick(SKIN, L.skin, 1), hc = pick(HAIRC, L.hairCol, 0), ti = L.topCol | 0;
    const tc0 = pick(TOPC, ti, 0), tc = tc0.startsWith('var(') ? '#C8F03C' : tc0, top = L.top | 0, hs = L.hair | 0, ac = L.acc | 0, cx = 60;
    const bd = L.build === undefined || L.build === null ? 1 : Math.max(0, Math.min(2, L.build | 0)), SK = bd === 0, BB = bd === 2;
    const k = (m, f) => (F ? f : m);
    const S = k(15.5, 13) + (SK ? -2.2 : BB ? k(3.6, 2) : 0) + r * (BB ? 0.7 : SK ? 0.25 : 0.5);
    const W = k(10.5, 8.2) + (SK ? k(-1.3, -0.6) : BB ? 0.3 : 0) + r * 0.1;
    const H = k(11, 12.8) + (SK ? -1.2 : BB ? k(0.4, 0.6) : 0);
    const A = k(5.2, 4.1) + (SK ? -1.3 : BB ? k(2.3, 1.3) : 0) + r * (BB ? 0.35 : 0.25);
    const T = k(7.6, 7.6) + (SK ? -1.9 : BB ? k(2.3, 1.6) : 0) + r * 0.25;
    const nk = k(3.7, 3) + (BB ? k(1.6, 0.4) : SK ? -0.3 : 0), bulge = (BB ? 1.5 : SK ? 0.3 : 0.9) + r * 0.25;
    const skD = shade(sk, -0.22), skL = shade(sk, 0.25), tcD = shade(tc, -0.3), pants = '#24242B', id = 'hr' + Math.random().toString(36).slice(2, 7), out = [];
    out.push(`<defs><linearGradient id="${id}c" x1="0" x2="1"><stop offset="0" stop-color="#000" stop-opacity=".28"/><stop offset=".35" stop-color="#fff" stop-opacity=".12"/><stop offset=".6" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".32"/></linearGradient>
      <radialGradient id="${id}h" cx=".42" cy=".38" r=".7"><stop offset="0" stop-color="#fff" stop-opacity=".18"/><stop offset="1" stop-color="#000" stop-opacity=".22"/></radialGradient></defs>`);
    out.push(`<ellipse cx="${cx}" cy="147" rx="26" ry="3.6" fill="#000" opacity=".4"/><g class="hb">`);
    const sh = (d) => `<path d="${d}" fill="url(#${id}c)"/>`;
    // părul lung, în spate
    if (hs === 2) out.push(`<path d="M${P2(cx - 7.4, 10)}C${P2(cx - 9, 22)} ${P2(cx - 9.5, 34)} ${P2(cx - 8, 42)}Q${P2(cx, 45)} ${P2(cx + 8, 42)}C${P2(cx + 9.5, 34)} ${P2(cx + 9, 22)} ${P2(cx + 7.4, 10)}Z" fill="${shade(hc, -0.15)}"/>`);
    // picioarele
    const legs = [];
    for (const d of [-1, 1]) {
      const pts = [[cx + d * (H * 0.48), 74, T * 1.55], [cx + d * (H * 0.5 - 0.3), 88, T * 1.32], [cx + d * 5.6, 106, T * 0.82], [cx + d * 6, 118, T * (BB ? 1.02 : 0.92)], [cx + d * 5.4, 132, T * 0.55], [cx + d * 5.2, 141, T * 0.42]];
      const p = limb(pts); legs.push(`<path d="${p}" fill="${sk}"/>${sh(p)}`);
      if (BB || r >= 3) legs.push(`<path d="M${P2(cx + d * (H * 0.5 - 2.5), 80)}Q${P2(cx + d * (H * 0.5 - 0.5), 92)} ${P2(cx + d * 4.6, 103)}" fill="none" stroke="${skD}" stroke-width=".7" opacity=".55"/>`);
      if (F) legs.push(`<path d="${limb(pts.slice(0, 5).concat([[cx + d * 5.3, 137, T * 0.47]]))}" fill="${pants}"/><path d="M${P2(cx + d * (H * 0.48 + T * 0.72), 76)}L${P2(cx + d * (5.4 + T * 0.27), 134)}" stroke="${tc}" stroke-width=".9" opacity=".85"/>`);
      legs.push(`<path d="M${P2(cx + d * 1.6, 142)}Q${P2(cx + d * 1.4, 138.6)} ${P2(cx + d * 5.2, 138.8)}Q${P2(cx + d * 9.8, 139)} ${P2(cx + d * 10.6, 143)}Q${P2(cx + d * 10.8, 146)} ${P2(cx + d * 6, 146)}L${P2(cx + d * 2.2, 146)}Q${P2(cx + d * 1.2, 145.6)} ${P2(cx + d * 1.6, 142)}Z" fill="#EDEDF2"/><path d="M${P2(cx + d * 1.6, 145)}H${(cx + d * 10.6).toFixed(1)}" stroke="${tc}" stroke-width="1.3"/>`);
    }
    out.push(legs.join(''));
    // trunchiul (piele)
    const torso = `M${P2(cx - nk, 26)}C${P2(cx - nk - 2.5, 29)} ${P2(cx - S + 4, 28.6)} ${P2(cx - S, 31.2)}C${P2(cx - S - 1.4, 34)} ${P2(cx - S - 0.4, 40)} ${P2(cx - S + 1.8, 44.5)}C${P2(cx - W - (F ? 0.4 : 1.4), 52)} ${P2(cx - W, 57)} ${P2(cx - W, 61.5)}C${P2(cx - W, 64)} ${P2(cx - H, 66)} ${P2(cx - H, 70)}L${P2(cx + H, 70)}C${P2(cx + H, 66)} ${P2(cx + W, 64)} ${P2(cx + W, 61.5)}C${P2(cx + W, 57)} ${P2(cx + W + (F ? 0.4 : 1.4), 52)} ${P2(cx + S - 1.8, 44.5)}C${P2(cx + S + 0.4, 40)} ${P2(cx + S + 1.4, 34)} ${P2(cx + S, 31.2)}C${P2(cx + S - 4, 28.6)} ${P2(cx + nk + 2.5, 29)} ${P2(cx + nk, 26)}Z`;
    out.push(`<path d="${torso}" fill="${sk}"/>`);
    // musculatura pe piele (se vede la maieu)
    const pecY = F ? 40 : 41.5;
    const def = F ? `<path d="M${P2(cx - 7.5, 36)}Q${P2(cx - 4.2, 44)} ${P2(cx - 0.6, 39.5)}M${P2(cx + 0.6, 39.5)}Q${P2(cx + 4.2, 44)} ${P2(cx + 7.5, 36)}" fill="none" stroke="${skD}" stroke-width=".8"/>`
      : `<path d="M${P2(cx - S + 4, 34)}Q${P2(cx - 6, pecY + 2.5)} ${P2(cx - 0.5, pecY)}M${P2(cx + S - 4, 34)}Q${P2(cx + 6, pecY + 2.5)} ${P2(cx + 0.5, pecY)}" fill="none" stroke="${skD}" stroke-width="${BB ? 1.1 : 0.8}"/>`;
    const abs = BB || r >= 2 || (SK && !F) ? `<path d="M${P2(cx, 44)}V60M${P2(cx - 3.6, 47.5)}H${cx - 0.8}M${P2(cx + 0.8, 47.5)}H${cx + 3.6}M${P2(cx - 3.8, 51.5)}H${cx - 0.8}M${P2(cx + 0.8, 51.5)}H${cx + 3.8}M${P2(cx - 3.6, 55.5)}H${cx - 0.8}M${P2(cx + 0.8, 55.5)}H${cx + 3.6}" stroke="${skD}" stroke-width=".7" opacity="${BB ? 0.8 : 0.45}"/>` : '';
    out.push(def + abs + sh(torso));
    // haina pe trunchi
    if (top === 1 && F) {
      out.push(`<path d="M${P2(cx - S + 3.4, 31)}L${P2(cx - 4, 33)}Q${P2(cx, 37)} ${P2(cx + 4, 33)}L${P2(cx + S - 3.4, 31)}C${P2(cx + S - 1.6, 36)} ${P2(cx + S - 2.2, 42)} ${P2(cx + W + 1.6, 46)}L${P2(cx - W - 1.6, 46)}C${P2(cx - S + 2.2, 42)} ${P2(cx - S + 1.6, 36)} ${P2(cx - S + 3.4, 31)}Z" fill="${tc}"/><path d="M${P2(cx - 7.5, 37)}Q${P2(cx - 4, 43.5)} ${P2(cx - 0.6, 39.5)}M${P2(cx + 0.6, 39.5)}Q${P2(cx + 4, 43.5)} ${P2(cx + 7.5, 37)}" fill="none" stroke="${tcD}" stroke-width=".8"/><path d="M${P2(cx - W - 1.6, 46)}H${(cx + W + 1.6).toFixed(1)}" stroke="${tcD}" stroke-width="1.4"/><circle cx="${cx}" cy="52.5" r=".6" fill="${skD}"/>`);
    } else if (top === 1) {
      out.push(`<path d="M${P2(cx - 7, 27.6)}Q${P2(cx, 36)} ${P2(cx + 7, 27.6)}L${P2(cx + 9.5, 28.8)}C${P2(cx + 9, 36)} ${P2(cx + S - 2, 42)} ${P2(cx + S - 2.2, 45)}C${P2(cx + W + 1.4, 52)} ${P2(cx + W, 57)} ${P2(cx + W, 62)}L${P2(cx - W, 62)}C${P2(cx - W, 57)} ${P2(cx - W - 1.4, 52)} ${P2(cx - S + 2.2, 45)}C${P2(cx - S + 2, 42)} ${P2(cx - 9, 36)} ${P2(cx - 9.5, 28.8)}Z" fill="${tc}"/>`);
    } else {
      out.push(`<path d="${torso}" fill="${tc}"/><path d="M${P2(cx - nk - 1, 26.4)}Q${P2(cx, 31.5)} ${P2(cx + nk + 1, 26.4)}" fill="none" stroke="${tcD}" stroke-width="1.3"/>`);
      if (!F) out.push(`<path d="M${P2(cx - S + 4.5, 36)}Q${P2(cx - 6, pecY + 2.6)} ${P2(cx - 0.5, pecY + 0.4)}M${P2(cx + S - 4.5, 36)}Q${P2(cx + 6, pecY + 2.6)} ${P2(cx + 0.5, pecY + 0.4)}" fill="none" stroke="${tcD}" stroke-width=".7" opacity=".7"/>`);
      else out.push(`<path d="M${P2(cx - 7.5, 37)}Q${P2(cx - 4, 43.5)} ${P2(cx - 0.6, 39.8)}M${P2(cx + 0.6, 39.8)}Q${P2(cx + 4, 43.5)} ${P2(cx + 7.5, 37)}" fill="none" stroke="${tcD}" stroke-width=".8"/>`);
      if (top === 2) out.push(`<path d="M${P2(cx - 8, 27)}Q${P2(cx, 33)} ${P2(cx + 8, 27)}Q${P2(cx + 7, 23)} ${P2(cx + 4, 22.5)}M${P2(cx - 8, 27)}Q${P2(cx - 7, 23)} ${P2(cx - 4, 22.5)}" fill="none" stroke="${tcD}" stroke-width="1.6"/><path d="M${P2(cx - 1.6, 30)}v8M${P2(cx + 1.6, 30)}v8" stroke="#fff" stroke-width=".7" opacity=".8"/><path d="M${P2(cx - 6, 54)}h12v6h-12z" fill="${tcD}" opacity=".5"/>`);
    }
    out.push(sh(torso));
    // pantaloni scurți (bărbat) / talia colanților (femeie)
    if (!F) out.push(`<path d="M${P2(cx - W - 0.6, 61)}L${P2(cx + W + 0.6, 61)}C${P2(cx + H + 0.4, 66)} ${P2(cx + H + 1.8, 76)} ${P2(cx + H + 1.6, 92)}L${P2(cx + 1.6, 93)}L${P2(cx, 82)}L${P2(cx - 1.6, 93)}L${P2(cx - H - 1.6, 92)}C${P2(cx - H - 1.8, 76)} ${P2(cx - H - 0.4, 66)} ${P2(cx - W - 0.6, 61)}Z" fill="${pants}"/><path d="M${P2(cx + H + 1.6, 78)}V91M${P2(cx - H - 1.6, 78)}V91" stroke="${tc}" stroke-width="1.1"/>`);
    else out.push(`<path d="M${P2(cx - W - 0.4, 61)}L${P2(cx + W + 0.4, 61)}C${P2(cx + H, 65)} ${P2(cx + H + 0.6, 70)} ${P2(cx + H + 0.4, 77)}L${P2(cx, 80)}L${P2(cx - H - 0.4, 77)}C${P2(cx - H - 0.6, 70)} ${P2(cx - H, 65)} ${P2(cx - W - 0.4, 61)}Z" fill="${pants}"/>`);
    // brațele
    const arms = [];
    for (const d of [-1, 1]) {
      const sx = cx + d * (S - 1.6), ex = cx + d * (S + 1.4 + A * 0.15), wx = cx + d * (S + 2.2 + A * 0.25);
      const pts = [[sx, 32.2, A * 1.55], [cx + d * (S + 0.2), 39, A * 1.25 + bulge], [ex, 51, A * 0.92], [cx + d * (S + 2.1 + A * 0.2), 59, A * 1.02], [wx, 68, A * 0.62]];
      const p = limb(pts); arms.push(`<path d="${p}" fill="${sk}"/>`);
      arms.push(`<path d="M${P2(sx + d * A * 0.2, 35)}Q${P2(cx + d * (S + A * 0.55), 40)} ${P2(ex - d * A * 0.1, 49)}" fill="none" stroke="${skD}" stroke-width=".7" opacity=".7"/>`);
      if (top === 0) arms.push(`<path d="${limb([[sx, 32.2, A * 1.8], [cx + d * (S + 0.3), 37.5, A * 1.55 + bulge], [cx + d * (S + 0.8), 42, A * 1.45]])}" fill="${tc}"/>`);
      if (top === 2) arms.push(`<path d="${limb([[sx, 32.2, A * 1.75], [cx + d * (S + 0.2), 39, A * 1.45 + bulge], [ex, 51, A * 1.15], [wx - d * 0.2, 66, A * 0.95]])}" fill="${tc}"/>`);
      arms.push(sh(p));
      // mâna
      arms.push(`<path d="M${P2(wx - A * 0.42, 67.5)}C${P2(wx - A * 0.6, 72)} ${P2(wx - A * 0.3, 76)} ${P2(wx + d * 0.4, 76.5)}C${P2(wx + A * 0.4, 76)} ${P2(wx + A * 0.6, 72)} ${P2(wx + A * 0.42, 67.5)}Z" fill="${sk}"/><path d="M${P2(wx - A * 0.42, 67.5)}C${P2(wx - A * 0.6, 72)} ${P2(wx - A * 0.3, 76)} ${P2(wx + d * 0.4, 76.5)}C${P2(wx + A * 0.4, 76)} ${P2(wx + A * 0.6, 72)} ${P2(wx + A * 0.42, 67.5)}Z" fill="url(#${id}c)"/>`);
      if (r >= 1) arms.push(`<rect x="${(wx - A * 0.45).toFixed(1)}" y="64.6" width="${(A * 0.9).toFixed(1)}" height="2.4" rx="1" fill="${tc}"/>`);
    }
    out.push(arms.join(''));
    // gâtul și capul
    out.push(`<path d="M${P2(cx - nk, 19)}L${P2(cx - nk, 27.5)}Q${P2(cx, 30)} ${P2(cx + nk, 27.5)}L${P2(cx + nk, 19)}Z" fill="${sk}"/><path d="M${P2(cx - nk, 22)}Q${P2(cx, 25.5)} ${P2(cx + nk, 22)}" fill="none" stroke="${skD}" stroke-width=".8" opacity=".7"/>`);
    if (BB && !F) out.push(`<path d="M${P2(cx - nk - 0.4, 25)}Q${P2(cx - nk - 4, 26.5)} ${P2(cx - S + 2, 30)}M${P2(cx + nk + 0.4, 25)}Q${P2(cx + nk + 4, 26.5)} ${P2(cx + S - 2, 30)}" fill="none" stroke="${skD}" stroke-width=".7" opacity=".6"/>`);
    const jaw = F ? 0.9 : 0;
    const head = `M${P2(cx - 6.4, 12.5)}C${P2(cx - 6.6, 6.6)} ${P2(cx - 3.5, 3.8)} ${P2(cx, 3.8)}C${P2(cx + 3.5, 3.8)} ${P2(cx + 6.6, 6.6)} ${P2(cx + 6.4, 12.5)}C${P2(cx + 6.3, 16.5)} ${P2(cx + 5.4 - jaw, 19.6)} ${P2(cx + 3.2, 21.6)}C${P2(cx + 1.6, 22.9)} ${P2(cx - 1.6, 22.9)} ${P2(cx - 3.2, 21.6)}C${P2(cx - 5.4 + jaw, 19.6)} ${P2(cx - 6.3, 16.5)} ${P2(cx - 6.4, 12.5)}Z`;
    out.push(`<ellipse cx="${cx - 6.4}" cy="13.6" rx="1.3" ry="2.2" fill="${skD}"/><ellipse cx="${cx + 6.4}" cy="13.6" rx="1.3" ry="2.2" fill="${skD}"/><path d="${head}" fill="${sk}"/><path d="${head}" fill="url(#${id}h)"/>`);
    // fața
    const ey = 12.6;
    out.push(`<g class="eyes" style="transform-origin:${cx}px ${ey}px"><path d="M${P2(cx - 4.4, ey)}Q${P2(cx - 2.8, ey - 1.3)} ${P2(cx - 1.2, ey)}Q${P2(cx - 2.8, ey + 0.9)} ${P2(cx - 4.4, ey)}Z" fill="#F4F1EC"/><path d="M${P2(cx + 1.2, ey)}Q${P2(cx + 2.8, ey - 1.3)} ${P2(cx + 4.4, ey)}Q${P2(cx + 2.8, ey + 0.9)} ${P2(cx + 1.2, ey)}Z" fill="#F4F1EC"/><circle cx="${cx - 2.8}" cy="${ey - 0.05}" r=".72" fill="#3A2A20"/><circle cx="${cx + 2.8}" cy="${ey - 0.05}" r=".72" fill="#3A2A20"/></g>`);
    out.push(`<path d="M${P2(cx - 4.8, ey - 1.9)}Q${P2(cx - 2.8, ey - 2.9)} ${P2(cx - 1, ey - 2)}M${P2(cx + 1, ey - 2)}Q${P2(cx + 2.8, ey - 2.9)} ${P2(cx + 4.8, ey - 1.9)}" fill="none" stroke="${hs === 5 ? skD : shade(hc, -0.1)}" stroke-width="${F ? 0.55 : 0.85}" stroke-linecap="round"/>`);
    if (F) out.push(`<path d="M${P2(cx - 4.5, ey - 0.1)}l-.7-.6M${P2(cx + 4.5, ey - 0.1)}l.7-.6" stroke="#1A1A1E" stroke-width=".45" stroke-linecap="round"/>`);
    out.push(`<path d="M${P2(cx - 0.3, ey + 0.6)}Q${P2(cx - 1.1, ey + 3.6)} ${P2(cx - 0.9, ey + 4.4)}Q${P2(cx, ey + 4.9)} ${P2(cx + 0.9, ey + 4.4)}" fill="none" stroke="${skD}" stroke-width=".6" stroke-linecap="round"/>`);
    out.push(F ? `<path d="M${P2(cx - 2.1, ey + 6.7)}Q${P2(cx - 0.8, ey + 6)} ${P2(cx, ey + 6.4)}Q${P2(cx + 0.8, ey + 6)} ${P2(cx + 2.1, ey + 6.7)}Q${P2(cx, ey + 8.3)} ${P2(cx - 2.1, ey + 6.7)}Z" fill="#B85866"/>` : `<path d="M${P2(cx - 2.2, ey + 6.7)}Q${P2(cx, ey + 7.6)} ${P2(cx + 2.2, ey + 6.7)}" fill="none" stroke="${shade(sk, -0.4)}" stroke-width=".7" stroke-linecap="round"/>`);
    out.push(`<circle cx="${cx - 4}" cy="${ey + 4.2}" r="1.5" fill="#E07A6A" opacity="${F ? 0.22 : 0.1}"/><circle cx="${cx + 4}" cy="${ey + 4.2}" r="1.5" fill="#E07A6A" opacity="${F ? 0.22 : 0.1}"/>`);
    if (!F && (BB || r >= 3) && hs !== 5) out.push(`<path d="M${P2(cx - 5.6, 16)}Q${P2(cx - 4, 21.5)} ${P2(cx, 22.2)}Q${P2(cx + 4, 21.5)} ${P2(cx + 5.6, 16)}" fill="none" stroke="${hc}" stroke-width="1.6" opacity=".35"/>`);
    // părul
    const capH = `M${P2(cx - 6.6, 13)}C${P2(cx - 7.2, 5.4)} ${P2(cx - 3.8, 2.6)} ${P2(cx, 2.6)}C${P2(cx + 3.8, 2.6)} ${P2(cx + 7.2, 5.4)} ${P2(cx + 6.6, 13)}C${P2(cx + 6, 9.6)} ${P2(cx + 5, 7.8)} ${P2(cx + 2.5, 7.4)}C${P2(cx, 8.2)} ${P2(cx - 3, 7)} ${P2(cx - 5, 8.6)}C${P2(cx - 6, 9.6)} ${P2(cx - 6.4, 11)} ${P2(cx - 6.6, 13)}Z`;
    if (hs === 0) out.push(`<path d="${capH}" fill="${hc}"/>`);
    if (hs === 1) out.push(`<path d="${capH}" fill="${hc}" opacity=".45"/><path d="M${P2(cx - 3, 8)}C${P2(cx - 3.4, 3)} ${P2(cx - 1.5, 0.6)} ${P2(cx + 0.6, 0.8)}C${P2(cx + 2.8, 1.4)} ${P2(cx + 3.4, 4)} ${P2(cx + 3, 8)}Z" fill="${hc}"/>`);
    if (hs === 2) out.push(`<path d="M${P2(cx - 7.4, 20)}C${P2(cx - 8.6, 6)} ${P2(cx - 4, 2.4)} ${P2(cx + 0.5, 2.4)}C${P2(cx + 5, 2.4)} ${P2(cx + 8.6, 6)} ${P2(cx + 7.4, 20)}C${P2(cx + 6.4, 13)} ${P2(cx + 5.4, 9)} ${P2(cx + 1.4, 7.4)}C${P2(cx - 2.6, 8.4)} ${P2(cx - 5.6, 10)} ${P2(cx - 7.4, 20)}Z" fill="${hc}"/><path d="M${P2(cx + 1.4, 3)}Q${P2(cx + 4.6, 4.5)} ${P2(cx + 6, 9)}" fill="none" stroke="#fff" stroke-width=".6" opacity=".25"/>`);
    if (hs === 3) out.push(`<circle cx="${cx}" cy="1.8" r="3.2" fill="${hc}"/><path d="${capH}" fill="${hc}"/><path d="M${P2(cx - 2.6, 3.8)}Q${P2(cx, 4.8)} ${P2(cx + 2.6, 3.8)}" stroke="${tc}" stroke-width="1" fill="none"/>`);
    if (hs === 4) { const c = [`<path d="${capH}" fill="${hc}"/>`]; for (let a = -170; a <= -10; a += 20) { const rd = (a * Math.PI) / 180; c.push(`<circle cx="${(cx + Math.cos(rd) * 6.2).toFixed(1)}" cy="${(10 + Math.sin(rd) * 6.6).toFixed(1)}" r="2.2" fill="${hc}"/>`); } out.push(c.join('')); }
    if (hs === 5) out.push(`<ellipse cx="${cx - 2.4}" cy="6" rx="2.4" ry="1.1" fill="#fff" opacity=".22" transform="rotate(-20 ${cx - 2.4} 6)"/>`);
    // accesorii
    if (ac === 1) out.push(`<path d="M${P2(cx - 6.8, 9)}Q${P2(cx, 5.2)} ${P2(cx + 6.8, 9)}L${P2(cx + 6.9, 10.8)}Q${P2(cx, 7.2)} ${P2(cx - 6.9, 10.8)}Z" fill="${tc}"/>`);
    if (ac === 2) out.push(`<path d="M${P2(cx - 7, 9.5)}C${P2(cx - 7.4, 3)} ${P2(cx - 3.6, 1.6)} ${P2(cx, 1.6)}C${P2(cx + 3.6, 1.6)} ${P2(cx + 7.4, 3)} ${P2(cx + 7, 9.5)}Z" fill="${top === 1 || ti === 2 ? '#1E1E24' : tc}"/><path d="M${P2(cx - 7.4, 9.6)}Q${P2(cx, 11.2)} ${P2(cx + 7.4, 9.6)}Q${P2(cx, 8)} ${P2(cx - 7.4, 9.6)}Z" fill="#15151A"/>`);
    if (ac === 3) out.push(`<path d="M${P2(cx - 7.6, 13)}C${P2(cx - 8, 1.6)} ${P2(cx + 8, 1.6)} ${P2(cx + 7.6, 13)}" fill="none" stroke="#24242B" stroke-width="1.4"/><rect x="${cx - 9.2}" y="10.6" width="3.4" height="5.6" rx="1.4" fill="#24242B"/><rect x="${cx + 5.8}" y="10.6" width="3.4" height="5.6" rx="1.4" fill="#24242B"/>`);
    if (ac === 4) out.push(`<rect x="${cx - 5.2}" y="${ey - 1.5}" width="4.4" height="3" rx="1.2" fill="#111"/><rect x="${cx + 0.8}" y="${ey - 1.5}" width="4.4" height="3" rx="1.2" fill="#111"/><path d="M${P2(cx - 0.8, ey - 0.6)}H${cx + 0.8}" stroke="#111" stroke-width=".6"/>`);
    // lanțul de rang (Comandant: argintiu, Împărat: auriu)
    if (r >= 3) out.push(`<path d="M${P2(cx - nk - 0.6, 26)}Q${P2(cx, 34)} ${P2(cx + nk + 0.6, 26)}" fill="none" stroke="${r >= 4 ? '#E8B83A' : '#C9CCD6'}" stroke-width=".8"/><circle cx="${cx}" cy="31.6" r="1.4" fill="${r >= 4 ? '#FFD34D' : '#E3E5EC'}" stroke="${r >= 4 ? '#B07A10' : '#8C8FA0'}" stroke-width=".4"/>`);
    out.push('</g>');
    const vb = o.bust ? '33 -1 54 54' : '0 -4 120 154';
    return `<svg class="hero real${o.still ? ' still' : ''}" viewBox="${vb}" ${o.size ? `width="${o.size}" height="${o.bust ? o.size : Math.round(o.size * 154 / 120)}"` : ''} role="img" aria-label="${o.label || 'Figurina ta'}" style="${o.style || ''}">${out.join('')}</svg>`;
  }

  /* ───────── figurina membrului („luptătorul tău”): se personalizează și crește odată cu rangul ───────── */
  const SKIN = ['#FCE3CF', '#F2C9A5', '#D9A47A', '#A9714B', '#6B4428'];
  const HAIRC = ['#1C1714', '#4A2E1E', '#8A5A2B', '#D9B068', '#B83A2E', '#E3DED6'];
  const TOPC = ['var(--acc, #C8F03C)', '#1E1E24', '#F2F2F5', '#E5484D', '#3E7BFA', '#8B6CFF', '#FF8A3D', '#2BB673'];
  const LIGHT_TOP = [0, 2, 6];
  const LOOK_OPT = {
    body: [['M', 'Băiat'], ['F', 'Fată']],
    skin: SKIN, hairCol: HAIRC, topCol: TOPC,
    hair: ['Scurt', 'Creastă', 'Lung', 'Coc', 'Creț', 'Chel'],
    top: ['Tricou', 'Maieu', 'Hanorac'],
    acc: ['Nimic', 'Bentiță', 'Șapcă', 'Căști', 'Ochelari'],
    build: ['Slab', 'Fit', 'Bodybuilder'],
    style: ['Desen animat', 'Realistă'],
  };
  const pick = (arr, i, d = 0) => arr[i | 0] !== undefined ? arr[i | 0] : arr[d];
  const P2 = (x, y) => `${x.toFixed(1)} ${y.toFixed(1)}`;
  function hero(L, rank, o = {}) {
    L = L || {}; o = o || {};
    if ((L.style | 0) === 1) return heroReal(L, rank, o);
    const r = Math.max(0, Math.min(4, rank | 0)), F = L.body === 'F', sk = pick(SKIN, L.skin, 1), hc = pick(HAIRC, L.hairCol, 0), ti = L.topCol | 0, tc = pick(TOPC, ti, 0);
    const top = L.top | 0, hs = L.hair | 0, ac = L.acc | 0, cx = 60;
    const bd = L.build === undefined || L.build === null ? 1 : Math.max(0, Math.min(2, L.build | 0)), SK = bd === 0, BB = bd === 2;
    // corpul: rangul adaugă mușchi, tipul de corp ales (slab / fit / bodybuilder) dă forma de bază
    const sw = Math.min(27.5, 17 + r * (BB ? 2.6 : SK ? 1.2 : 2.2) - (F ? 4 : 0) + (BB ? (F ? 3.5 : 6) : SK ? -3.5 : 0));
    const aw = Math.min(15.5, 8 + r * (BB ? 1.5 : SK ? 0.6 : 1.35) - (F ? 2 : 0) + (BB ? (F ? 2.2 : 3.6) : SK ? -2.4 : 0));
    const bump = Math.min(11, Math.max(1.2, 4.2 + r * (BB ? 1.8 : SK ? 0.5 : 1.5) - (F ? 1.8 : 0) + (BB ? (F ? 2 : 3.6) : SK ? -2.6 : 0)));
    const waist = F ? (SK ? 9 : BB ? 11 : 9.8) : 13 + r * 0.5 + (BB ? 0.5 : SK ? -2.5 : 0), hip = F ? (SK ? 14.5 : BB ? 17.5 : 17) : (SK ? 11.5 : BB ? 14.5 : 13.5);
    const leg = (F ? 8.6 : 9 + r * 0.6) + (BB ? 3.4 : SK ? -2.6 : 0), lips = '#C24A5A';
    const g = 'hg' + Math.random().toString(36).slice(2, 7), out = [];
    out.push(`<defs><linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset="1" stop-color="#000" stop-opacity=".12"/></linearGradient></defs>`);
    out.push(`<ellipse cx="${cx}" cy="145" rx="30" ry="4.5" fill="#000" opacity=".35"/>`);
    out.push('<g class="hb">');
    // pelerina (Comandant și Împărat)
    if (r >= 3) out.push(`<path d="M${P2(cx - sw + 2, 66)}Q${P2(cx, 60)} ${P2(cx + sw - 2, 66)}L${P2(cx + sw + 9, 134)}Q${P2(cx, 142)} ${P2(cx - sw - 9, 134)}Z" fill="${r >= 4 ? '#8E1426' : '#A61E30'}" stroke="${r >= 4 ? '#FFD34D' : 'none'}" stroke-width="1.6"/>`);
    // părul lung din spate
    if (hs === 2) out.push(`<path d="M${P2(cx - 26, 34)}Q${P2(cx - 33, 70)} ${P2(cx - 19, 84)}L${P2(cx + 19, 84)}Q${P2(cx + 33, 70)} ${P2(cx + 26, 34)}Z" fill="${hc}"/>`);
    // picioare, pantofi, pantaloni scurți
    if (F) {
      // colanți până la gleznă + coapse mai pline
      out.push(`<path d="M${P2(cx - 8.5, 108)}Q${P2(cx - 11.5, 118)} ${P2(cx - 9.5, 130)}L${P2(cx - 9, 136)}M${P2(cx + 8.5, 108)}Q${P2(cx + 11.5, 118)} ${P2(cx + 9.5, 130)}L${P2(cx + 9, 136)}" fill="none" stroke="#2A2A33" stroke-width="${leg}" stroke-linecap="round"/>`);
      out.push(`<path d="M${P2(cx - 9, 134)}L${P2(cx - 9, 138)}M${P2(cx + 9, 134)}L${P2(cx + 9, 138)}" stroke="${sk}" stroke-width="${leg - 1.5}" stroke-linecap="round"/>`);
      out.push(`<path d="M${P2(cx - 12.5, 112)}L${P2(cx - 10, 132)}M${P2(cx + 12.5, 112)}L${P2(cx + 10, 132)}" stroke="var(--acc, #C8F03C)" stroke-width="1.3" stroke-linecap="round" opacity=".8"/>`);
    } else out.push(`<path d="M${P2(cx - 7, 110)}L${P2(cx - 9, 138)}M${P2(cx + 7, 110)}L${P2(cx + 9, 138)}" stroke="${sk}" stroke-width="${leg}" stroke-linecap="round"/>`);
    out.push(`<ellipse cx="${cx - 11}" cy="140.5" rx="8.5" ry="4.6" fill="#F4F4F7"/><ellipse cx="${cx + 11}" cy="140.5" rx="8.5" ry="4.6" fill="#F4F4F7"/><path d="M${P2(cx - 19, 142)}h16M${P2(cx + 3, 142)}h16" stroke="var(--acc, #C8F03C)" stroke-width="2" stroke-linecap="round"/>`);
    if (F) out.push(`<path d="M${P2(cx - waist - 1, 95)}Q${P2(cx - hip - 3, 100)} ${P2(cx - hip - 1, 112)}L${P2(cx - 3, 113)}L${P2(cx, 108)}L${P2(cx + 3, 113)}L${P2(cx + hip + 1, 112)}Q${P2(cx + hip + 3, 100)} ${P2(cx + waist + 1, 95)}Z" fill="#2A2A33"/>`);
    else out.push(`<path d="M${P2(cx - hip - 1, 97)}L${P2(cx + hip + 1, 97)}L${P2(cx + hip + 3, 118)}L${P2(cx + 2.5, 118)}L${P2(cx, 110)}L${P2(cx - 2.5, 118)}L${P2(cx - hip - 3, 118)}Z" fill="#2A2A33"/>`);
    // brațele: poziția de „arată mușchii”
    const arms = [];
    for (const d of [-1, 1]) {
      const S = [cx + d * sw, 70], E = [cx + d * (sw + 17 + r * 0.8), 77], W = [cx + d * (sw + 14 + r * 0.6), 53];
      const mid = [(S[0] + E[0]) / 2, (S[1] + E[1]) / 2 - aw * 0.38];
      const arm = [];
      const skinArm = top === 2 ? tc : sk;
      arm.push(`<path d="M${P2(S[0], S[1])}L${P2(E[0], E[1])}L${P2(W[0], W[1])}" fill="none" stroke="${skinArm}" stroke-width="${aw}" stroke-linecap="round" stroke-linejoin="round"/>`);
      arm.push(`<circle cx="${mid[0].toFixed(1)}" cy="${mid[1].toFixed(1)}" r="${bump.toFixed(1)}" fill="${skinArm}"/>`);
      if (top === 0) arm.push(`<path d="M${P2(S[0], S[1])}L${P2(S[0] + (E[0] - S[0]) * 0.42, S[1] + (E[1] - S[1]) * 0.42)}" stroke="${tc}" stroke-width="${aw + 3}" stroke-linecap="round"/>`);
      if (r >= 1 && top !== 2) arm.push(`<path d="M${P2(E[0] + (W[0] - E[0]) * 0.66, E[1] + (W[1] - E[1]) * 0.66)}L${P2(E[0] + (W[0] - E[0]) * 0.84, E[1] + (W[1] - E[1]) * 0.84)}" stroke="var(--acc, #C8F03C)" stroke-width="${aw + 1.6}"/>`);
      arm.push(`<circle cx="${W[0].toFixed(1)}" cy="${(W[1] - 2).toFixed(1)}" r="${(aw * 0.62 + 1.2).toFixed(1)}" fill="${sk}"/>`);
      arms.push(`<g class="arm" style="transform-origin:${S[0].toFixed(1)}px ${S[1]}px;--d:${d}">${arm.join('')}</g>`);
    }
    out.push(arms.join(''));
    // trunchiul
    // femeie: siluetă de clepsidră (umeri mai înguști, talie, șolduri); bărbat: formă de V
    const torso = F
      ? `M${P2(cx - sw - 2, 71)}Q${P2(cx - sw, 63)} ${P2(cx - 9, 62)}L${P2(cx + 9, 62)}Q${P2(cx + sw, 63)} ${P2(cx + sw + 2, 71)}C${P2(cx + sw + 2.5, 79)} ${P2(cx + waist + 0.5, 82)} ${P2(cx + waist, 88)}C${P2(cx + waist - 0.5, 92)} ${P2(cx + hip - 2, 95)} ${P2(cx + hip - 1, 99)}L${P2(cx - hip + 1, 99)}C${P2(cx - hip + 2, 95)} ${P2(cx - waist + 0.5, 92)} ${P2(cx - waist, 88)}C${P2(cx - waist - 0.5, 82)} ${P2(cx - sw - 2.5, 79)} ${P2(cx - sw - 2, 71)}Z`
      : `M${P2(cx - sw - 3, 71)}Q${P2(cx - sw, 63)} ${P2(cx - 10, 62)}L${P2(cx + 10, 62)}Q${P2(cx + sw, 63)} ${P2(cx + sw + 3, 71)}L${P2(cx + waist + 1, 99)}L${P2(cx - waist - 1, 99)}Z`;
    if (top === 1 && F) {
      out.push(`<path d="${torso}" fill="${sk}"/>`);
      out.push(`<path d="M${P2(cx - sw + 5, 63)}L${P2(cx - 7, 63)}Q${P2(cx, 70)} ${P2(cx + 7, 63)}L${P2(cx + sw - 5, 63)}L${P2(cx + sw + 1.5, 74)}Q${P2(cx + sw, 81)} ${P2(cx + waist + 2, 82)}L${P2(cx - waist - 2, 82)}Q${P2(cx - sw, 81)} ${P2(cx - sw - 1.5, 74)}Z" fill="${tc}"/>`);
      out.push(`<path d="M${P2(cx - 1.2, 86)}v3.5" stroke="#000" stroke-opacity=".2" stroke-width="1.4" stroke-linecap="round"/>`);
    } else if (top === 1) {
      out.push(`<path d="${torso}" fill="${sk}"/>`);
      out.push(`<path d="M${P2(cx - sw + 7, 63)}L${P2(cx - 7, 63)}Q${P2(cx, 71)} ${P2(cx + 7, 63)}L${P2(cx + sw - 7, 63)}L${P2(cx + sw - 3, 76)}L${P2(cx + waist + 1, 99)}L${P2(cx - waist - 1, 99)}L${P2(cx - sw + 3, 76)}Z" fill="${tc}"/>`);
    } else out.push(`<path d="${torso}" fill="${tc}"/>`);
    out.push(`<path d="${torso}" fill="url(#${g})"/>`);
    if (F) out.push(`<path d="M${P2(cx - 11, 72)}Q${P2(cx - 6, 80.5)} ${P2(cx - 0.8, 75)}M${P2(cx + 0.8, 75)}Q${P2(cx + 6, 80.5)} ${P2(cx + 11, 72)}" fill="none" stroke="#000" stroke-opacity=".17" stroke-width="1.5" stroke-linecap="round"/>`);
    else if (r >= 2 || BB) out.push(`<path d="M${P2(cx - 13, 76)}Q${P2(cx - 6, 81)} ${P2(cx, 76)}Q${P2(cx + 6, 81)} ${P2(cx + 13, 76)}" fill="none" stroke="#000" stroke-opacity=".16" stroke-width="1.6" stroke-linecap="round"/>`);
    if (BB && top !== 2) out.push(`<path d="M${P2(cx, 81)}V${F ? 80 : 93}M${P2(cx - 5, 84)}h10M${P2(cx - 5, 89)}h10" stroke="#000" stroke-opacity="${top === 1 && !F ? 0 : 0.13}" stroke-width="1.3" stroke-linecap="round"/>`);
    if (BB && top === 1 && F) out.push(`<path d="M${P2(cx - 4, 85)}h8M${P2(cx - 4, 90)}h8M${P2(cx, 84)}v9" stroke="#000" stroke-opacity=".14" stroke-width="1.2" stroke-linecap="round"/>`);
    if (top === 2) out.push(`<path d="M${P2(cx - 13, 63)}Q${P2(cx, 74)} ${P2(cx + 13, 63)}" fill="none" stroke="#000" stroke-opacity=".28" stroke-width="3"/><path d="M${P2(cx - 4, 69)}v9M${P2(cx + 4, 69)}v9" stroke="#fff" stroke-opacity=".7" stroke-width="1.4" stroke-linecap="round"/><rect x="${cx - 10}" y="88" width="20" height="8" rx="3" fill="#000" opacity=".15"/>`);
    out.push(`<text x="${cx}" y="${top === 2 ? 86 : 89}" text-anchor="middle" font-family="Archivo, Inter, sans-serif" font-weight="900" font-size="9" letter-spacing=".5" fill="${LIGHT_TOP.includes(ti) ? '#111' : '#fff'}" opacity=".85">FE</text>`);
    // centura (de la Gladiator)
    if (r >= 2) out.push(`<rect x="${(cx - waist - 2).toFixed(1)}" y="94" width="${(2 * waist + 4).toFixed(1)}" height="6.5" rx="2" fill="${r >= 4 ? '#E8B83A' : '#24242B'}"/><rect x="${cx - 6}" y="92.5" width="12" height="9.5" rx="2.5" fill="#FFD34D" stroke="#B07A10" stroke-width="1"/>`);
    // gâtul și capul
    const nk = F ? 4.8 : BB ? 8 : SK ? 5 : 6; out.push(`<rect x="${cx - nk}" y="54" width="${2 * nk}" height="11" rx="4" fill="${sk}"/>`);
    out.push(`<circle cx="${cx - 24}" cy="44" r="5" fill="${sk}"/><circle cx="${cx + 24}" cy="44" r="5" fill="${sk}"/><circle cx="${cx}" cy="40" r="24" fill="${sk}"/>`);
    // părul
    const cap = `M${P2(cx - 24, 38)}Q${P2(cx - 25, 14)} ${P2(cx, 14)}Q${P2(cx + 25, 14)} ${P2(cx + 24, 38)}Q${P2(cx + 20, 25)} ${P2(cx + 6, 25)}Q${P2(cx - 6, 30)} ${P2(cx - 16, 26)}Q${P2(cx - 21, 30)} ${P2(cx - 24, 38)}Z`;
    if (hs === 0) out.push(`<path d="${cap}" fill="${hc}"/>`);
    if (hs === 1) out.push(`<path d="${cap}" fill="${hc}" opacity=".35"/><path d="M${P2(cx - 7, 25)}Q${P2(cx - 6, 7)} ${P2(cx, 2)}Q${P2(cx + 6, 7)} ${P2(cx + 7, 25)}Q${P2(cx, 21)} ${P2(cx - 7, 25)}Z" fill="${hc}"/>`);
    if (hs === 2) out.push(`<path d="M${P2(cx - 25, 46)}Q${P2(cx - 28, 13)} ${P2(cx, 13)}Q${P2(cx + 28, 13)} ${P2(cx + 25, 46)}Q${P2(cx + 21, 24)} ${P2(cx + 2, 25)}Q${P2(cx - 18, 26)} ${P2(cx - 25, 46)}Z" fill="${hc}"/>`);
    if (hs === 3) out.push(`<circle cx="${cx}" cy="11" r="9" fill="${hc}"/><path d="${cap}" fill="${hc}"/><path d="M${P2(cx - 7, 18)}Q${P2(cx, 21)} ${P2(cx + 7, 18)}" stroke="var(--acc, #C8F03C)" stroke-width="2.4" fill="none"/>`);
    if (hs === 4) { const c = []; for (let a = -172; a <= -8; a += 23) { const rd = (a * Math.PI) / 180; c.push(`<circle cx="${(cx + Math.cos(rd) * 21).toFixed(1)}" cy="${(37 + Math.sin(rd) * 21).toFixed(1)}" r="7.6" fill="${hc}"/>`); } out.push(`<path d="${cap}" fill="${hc}"/>` + c.join('')); }
    if (hs === 5) out.push(`<ellipse cx="${cx - 9}" cy="24" rx="8" ry="4" fill="#fff" opacity=".28" transform="rotate(-20 ${cx - 9} 24)"/>`);
    // fața
    out.push(`<g class="eyes" style="transform-origin:${cx}px 44px"><ellipse cx="${cx - 9}" cy="44" rx="2.7" ry="3.3" fill="#1A1A1E"/><ellipse cx="${cx + 9}" cy="44" rx="2.7" ry="3.3" fill="#1A1A1E"/><circle cx="${cx - 8}" cy="43" r=".9" fill="#fff"/><circle cx="${cx + 10}" cy="43" r=".9" fill="#fff"/></g>`);
    out.push(`<path d="M${P2(cx - 13, 37)}L${P2(cx - 5, 35.5)}M${P2(cx + 5, 35.5)}L${P2(cx + 13, 37)}" stroke="${hs === 5 ? '#6B4A3A' : hc}" stroke-width="2.2" stroke-linecap="round"/>`);
    out.push(`<circle cx="${cx - 15}" cy="50" r="3.6" fill="#FF6B6B" opacity=".22"/><circle cx="${cx + 15}" cy="50" r="3.6" fill="#FF6B6B" opacity=".22"/>`);
    if (F) out.push(`<path d="M${P2(cx - 12.2, 41.6)}l-2.4-1.6M${P2(cx - 11.6, 40.4)}l-1.6-2M${P2(cx + 12.2, 41.6)}l2.4-1.6M${P2(cx + 11.6, 40.4)}l1.6-2" stroke="#1A1A1E" stroke-width="1.2" stroke-linecap="round"/><circle cx="${cx - 24}" cy="50" r="1.8" fill="var(--acc, #C8F03C)"/><circle cx="${cx + 24}" cy="50" r="1.8" fill="var(--acc, #C8F03C)"/>`);
    out.push(F ? `<path d="M${P2(cx - 6.5, 52)}Q${P2(cx, 58.5)} ${P2(cx + 6.5, 52)}Q${P2(cx, 54.5)} ${P2(cx - 6.5, 52)}Z" fill="${lips}"/>` : r >= 2 ? `<path d="M${P2(cx - 8, 51)}Q${P2(cx, 60)} ${P2(cx + 8, 51)}Z" fill="#5A2A22"/><path d="M${P2(cx - 6.5, 51.6)}H${cx + 6.5}" stroke="#fff" stroke-width="2"/>` : `<path d="M${P2(cx - 7, 52)}Q${P2(cx, 58)} ${P2(cx + 7, 52)}" fill="none" stroke="#5A2A22" stroke-width="2.2" stroke-linecap="round"/>`);
    // accesorii
    if (ac === 1) out.push(`<path d="M${P2(cx - 24, 30)}Q${P2(cx, 21)} ${P2(cx + 24, 30)}L${P2(cx + 24.5, 36)}Q${P2(cx, 27)} ${P2(cx - 24.5, 36)}Z" fill="var(--acc, #C8F03C)"/>`);
    if (ac === 2) out.push(`<path d="M${P2(cx - 24.5, 31)}Q${P2(cx - 25, 11)} ${P2(cx, 11)}Q${P2(cx + 25, 11)} ${P2(cx + 24.5, 31)}Z" fill="${top === 1 || ti === 2 ? '#1E1E24' : tc}"/><ellipse cx="${cx}" cy="31" rx="28" ry="4.5" fill="#15151A"/><circle cx="${cx}" cy="12" r="2" fill="#fff" opacity=".7"/><text x="${cx}" y="26" text-anchor="middle" font-family="Archivo, Inter, sans-serif" font-weight="900" font-size="7" fill="#fff" opacity=".8">FE</text>`);
    if (ac === 3) out.push(`<path d="M${P2(cx - 27, 42)}Q${P2(cx - 28, 7)} ${P2(cx, 7)}Q${P2(cx + 28, 7)} ${P2(cx + 27, 42)}" fill="none" stroke="#24242B" stroke-width="4.5"/><rect x="${cx - 32}" y="35" width="10" height="17" rx="4.5" fill="#24242B"/><rect x="${cx + 22}" y="35" width="10" height="17" rx="4.5" fill="#24242B"/><circle cx="${cx - 27}" cy="43.5" r="2.3" fill="var(--acc, #C8F03C)"/><circle cx="${cx + 27}" cy="43.5" r="2.3" fill="var(--acc, #C8F03C)"/>`);
    if (ac === 4) out.push(`<rect x="${cx - 17}" y="39" width="14" height="10" rx="4" fill="#111"/><rect x="${cx + 3}" y="39" width="14" height="10" rx="4" fill="#111"/><path d="M${P2(cx - 3, 42)}H${cx + 3}M${P2(cx - 17, 41)}L${P2(cx - 24, 39)}M${P2(cx + 17, 41)}L${P2(cx + 24, 39)}" stroke="#111" stroke-width="2"/><path d="M${P2(cx - 14, 41.5)}l4 -1M${P2(cx + 6, 41.5)}l4 -1" stroke="#fff" stroke-opacity=".6" stroke-width="1.4" stroke-linecap="round"/>`);
    // coroana (Împărat)
    if (r >= 4) out.push(`<path d="M${P2(cx - 14, 19)}L${P2(cx - 17, 3)}L${P2(cx - 7, 11)}L${P2(cx, 0)}L${P2(cx + 7, 11)}L${P2(cx + 17, 3)}L${P2(cx + 14, 19)}Z" fill="#FFD34D" stroke="#B07A10" stroke-width="1.2" stroke-linejoin="round"/><circle cx="${cx}" cy="13" r="2.2" fill="#E5484D"/><circle cx="${cx - 9}" cy="15" r="1.6" fill="#3E7BFA"/><circle cx="${cx + 9}" cy="15" r="1.6" fill="#3E7BFA"/>`);
    out.push('</g>');
    const vb = o.bust ? '14 -2 92 92' : '0 -4 120 154';
    return `<svg class="hero${o.still ? ' still' : ''}" viewBox="${vb}" ${o.size ? `width="${o.size}" height="${o.bust ? o.size : Math.round(o.size * 154 / 120)}"` : ''} role="img" aria-label="${o.label || 'Figurina ta'}" style="${o.style || ''}">${out.join('')}</svg>`;
  }

  /* ───────── Robo, mini-robotul antrenor ───────── */
  function robot(size = 80, o = {}) {
    const g = 'rg' + Math.random().toString(36).slice(2, 7);
    return `<svg class="robo${o.talk ? ' talk' : ''}" viewBox="0 0 120 130" width="${size}" height="${Math.round(size * 130 / 120)}" role="img" aria-label="Robo">
      <defs><linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F3F4F8"/><stop offset="1" stop-color="#AEB1BF"/></linearGradient></defs>
      <g class="rb">
        <path d="M60 8V21" stroke="#8C8FA0" stroke-width="3.5" stroke-linecap="round"/><circle class="rb-bulb" cx="60" cy="7" r="5.5" fill="var(--acc, #C8F03C)"/>
        <rect x="10" y="42" width="10" height="20" rx="4" fill="var(--acc, #C8F03C)"/><rect x="100" y="42" width="10" height="20" rx="4" fill="var(--acc, #C8F03C)"/>
        <rect x="17" y="20" width="86" height="64" rx="21" fill="url(#${g})"/>
        <rect x="27" y="31" width="66" height="42" rx="14" fill="#0E0F14"/>
        <g class="rb-eyes" style="transform-origin:60px 50px"><ellipse cx="46" cy="49" rx="6.5" ry="7.5" fill="var(--acc, #C8F03C)"/><ellipse cx="74" cy="49" rx="6.5" ry="7.5" fill="var(--acc, #C8F03C)"/><circle cx="48" cy="46.5" r="2" fill="#fff" opacity=".8"/><circle cx="76" cy="46.5" r="2" fill="#fff" opacity=".8"/></g>
        <path class="rb-mouth" d="M50 61Q60 68 70 61" fill="none" stroke="var(--acc, #C8F03C)" stroke-width="3" stroke-linecap="round" style="transform-origin:60px 63px"/>
        <rect x="51" y="83" width="18" height="8" rx="3" fill="#7C7F8E"/>
        <path d="M37 96L23 112" stroke="#AEB1BF" stroke-width="7" stroke-linecap="round"/>
        <g class="rb-wave" style="transform-origin:84px 96px"><path d="M84 96L99 80" stroke="#AEB1BF" stroke-width="7" stroke-linecap="round"/><circle cx="101" cy="77" r="5.5" fill="#F3F4F8"/></g>
        <circle cx="21" cy="114" r="5.5" fill="#F3F4F8"/>
        <rect x="34" y="88" width="52" height="34" rx="13" fill="url(#${g})"/>
        <circle cx="60" cy="104" r="6.5" fill="var(--acc, #C8F03C)" opacity=".9"/><circle cx="60" cy="104" r="11" fill="var(--acc, #C8F03C)" opacity=".18"/>
      </g></svg>`;
  }
  root.GymFig = { hero, robot, LOOK_OPT, rankBadge, drawFig: (k, t) => drawFig(PAT[k], t), PATS: Object.keys(PAT), icon, figure, animate, muscleMap, musclesOf, MNAME, patFor };
})(this);
