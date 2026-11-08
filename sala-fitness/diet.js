/* Generatorul de dietă: din preferințele membrului (ce-i place, ce nu mănâncă, alergii, câte mese,
   buget) face un plan pe o zi, cu grame, calorii și macronutrienți calculați. Rulează pe server și în demo. */
(function (root, f) { if (typeof module === 'object' && module.exports) module.exports = f(); else root.GymDiet = f(); })(this, function () {
  'use strict';
  // valori la 100 g: p, c, f · g = tip (pr = proteină, cb = carbohidrat, fr = fruct, fat = grăsime, veg = legume, dairy, plant = leguminoase)
  // a = cum e: meat, porc, fish, egg, dairy, plant · al = alergeni · $ = cost (1–3) · u = [grame, singular, plural] · like = cheia din chestionar
  const F = {
    pui: { n: 'piept de pui', p: 31, c: 0, f: 3.6, g: 'pr', a: 'meat', $: 2, like: 'pui', at: ['main'] },
    curcan: { n: 'piept de curcan', p: 29, c: 0, f: 2, g: 'pr', a: 'meat', $: 2, like: 'pui', at: ['main'] },
    vita: { n: 'carne slabă de vită', p: 26, c: 0, f: 8, g: 'pr', a: 'meat', $: 3, like: 'vita', at: ['main'] },
    porc: { n: 'mușchi de porc', p: 27, c: 0, f: 7, g: 'pr', a: 'porc', $: 2, like: 'porc', at: ['main'] },
    peste: { n: 'file de pește (păstrăv, cod sau hering)', p: 21, c: 0, f: 4, g: 'pr', a: 'fish', al: ['peste'], $: 2, like: 'peste', at: ['main'] },
    somon: { n: 'somon', p: 20, c: 0, f: 13, g: 'pr', a: 'fish', al: ['peste'], $: 3, like: 'peste', at: ['main'] },
    ton: { n: 'ton în apă (conservă)', p: 26, c: 0, f: 1, g: 'pr', a: 'fish', al: ['peste'], $: 1, like: 'ton', at: ['main', 'quick'] },
    oua: { n: 'ouă', p: 13, c: 1, f: 10, g: 'pr', a: 'egg', al: ['oua'], $: 1, like: 'oua', at: ['bf', 'main', 'quick'], u: [55, 'ou', 'ouă', ''] },
    vaci: { n: 'brânză de vaci', p: 11, c: 3.4, f: 4, g: 'dairy', a: 'dairy', al: ['lactoza'], $: 1, like: 'lactate', at: ['bf', 'snack', 'quick'] },
    iaurt: { n: 'iaurt grecesc', p: 10, c: 4, f: 2, g: 'dairy', a: 'dairy', al: ['lactoza'], $: 2, like: 'lactate', at: ['bf', 'snack', 'quick'] },
    lapte: { n: 'lapte', p: 3.4, c: 5, f: 1.5, g: 'dairy', a: 'dairy', al: ['lactoza'], $: 1, like: 'lactate', at: [] },
    whey: { n: 'proteină din zer (whey)', p: 80, c: 8, f: 6, g: 'dairy', a: 'dairy', al: ['lactoza'], $: 2, like: 'whey', at: ['snack'] },
    tofu: { n: 'tofu', p: 12, c: 2, f: 6, g: 'pr', a: 'plant', $: 2, like: 'tofu', at: ['main', 'bf'] },
    linte: { n: 'linte fiartă', p: 9, c: 20, f: 0.4, g: 'plant', a: 'plant', $: 1, like: 'leguminoase', at: ['main'] },
    fasole: { n: 'fasole fiartă', p: 8, c: 21, f: 0.5, g: 'plant', a: 'plant', $: 1, like: 'leguminoase', at: ['main'] },
    naut: { n: 'năut fiert', p: 9, c: 27, f: 2.6, g: 'plant', a: 'plant', $: 1, like: 'leguminoase', at: ['main'] },
    orez: { n: 'orez fiert', p: 2.7, c: 28, f: 0.3, g: 'cb', $: 1, like: 'orez', at: ['main'] },
    cartofi: { n: 'cartofi fierți sau la cuptor', p: 2, c: 17, f: 0.1, g: 'cb', $: 1, like: 'cartofi', at: ['main'] },
    paste: { n: 'paste fierte (integrale)', p: 5, c: 30, f: 1, g: 'cb', al: ['gluten'], $: 1, like: 'paste', at: ['main'] },
    mamaliga: { n: 'mămăligă', p: 2, c: 15, f: 0.3, g: 'cb', $: 1, like: 'mamaliga', at: ['main'] },
    quinoa: { n: 'quinoa fiartă', p: 4.4, c: 21, f: 1.9, g: 'cb', $: 3, like: 'quinoa', at: ['main'] },
    cartofdulce: { n: 'cartof dulce la cuptor', p: 1.6, c: 20, f: 0.1, g: 'cb', $: 2, like: 'cartofi', at: ['main'] },
    ovaz: { n: 'fulgi de ovăz', p: 13, c: 60, f: 7, g: 'cb', al: ['gluten'], $: 1, like: 'ovaz', at: ['bf'] },
    paine: { n: 'pâine integrală', p: 9, c: 41, f: 3.4, g: 'cb', al: ['gluten'], $: 1, like: 'paine', at: ['bf', 'snack', 'quick'], u: [35, 'felie', 'felii', 'de pâine integrală'] },
    turte: { n: 'rondele de orez', p: 8, c: 80, f: 3, g: 'cb', $: 1, like: 'paine', at: ['bf', 'snack'], u: [9, 'rondea', 'rondele', 'de orez'] },
    banana: { n: 'banană', p: 1, c: 23, f: 0.3, g: 'fr', $: 1, like: 'fructe', u: [120, 'banană', 'banane'] },
    mar: { n: 'măr', p: 0.3, c: 14, f: 0.2, g: 'fr', $: 1, like: 'fructe', u: [180, 'măr', 'mere'] },
    fructe: { n: 'fructe de pădure', p: 1, c: 12, f: 0.5, g: 'fr', $: 2, like: 'fructe' },
    ulei: { n: 'ulei de măsline', p: 0, c: 0, f: 100, g: 'fat', $: 1, u: [5, 'linguriță', 'lingurițe', 'de ulei de măsline'] },
    nuci: { n: 'nuci sau migdale', p: 21, c: 22, f: 50, g: 'fat', al: ['nuci'], $: 2, like: 'nuci' },
    arahide: { n: 'unt de arahide', p: 25, c: 20, f: 50, g: 'fat', al: ['nuci'], $: 2, like: 'nuci' },
    avocado: { n: 'avocado', p: 2, c: 9, f: 15, g: 'fat', $: 3, like: 'avocado' },
    legume: { n: 'salată sau legume la alegere', p: 1.5, c: 5, f: 0.2, g: 'veg', $: 1, like: 'legume' },
  };
  // opțiunile din chestionar (cheie, etichetă)
  const LIKES = [['pui', '🍗 Pui / curcan'], ['vita', '🥩 Vită'], ['porc', '🐖 Porc'], ['peste', '🐟 Pește'], ['ton', '🥫 Ton'], ['oua', '🥚 Ouă'], ['lactate', '🧀 Brânză, iaurt'], ['whey', '🥤 Shake proteic'], ['tofu', '🌱 Tofu'], ['leguminoase', '🫘 Fasole, linte, năut'], ['orez', '🍚 Orez'], ['cartofi', '🥔 Cartofi'], ['paste', '🍝 Paste'], ['mamaliga', '🌽 Mămăligă'], ['paine', '🍞 Pâine'], ['ovaz', '🥣 Ovăz'], ['legume', '🥦 Legume'], ['fructe', '🍎 Fructe'], ['nuci', '🥜 Nuci, unt de arahide'], ['avocado', '🥑 Avocado']];
  const DIETS = [['omnivor', '🍽️ Mănânc de toate'], ['fara_porc', '🚫🐖 Fără porc'], ['vegetarian', '🥗 Vegetarian (fără carne și pește)'], ['post', '🌿 De post / vegan']];
  const ALLERGIES = [['lactoza', 'Lactoză'], ['gluten', 'Gluten'], ['nuci', 'Nuci / arahide'], ['oua', 'Ouă'], ['peste', 'Pește']];
  const LAYOUT = {
    3: [['Mic dejun', '08:00', 'bf', 0.3], ['Prânz', '13:30', 'main', 0.4], ['Cină', '19:30', 'main', 0.3]],
    4: [['Mic dejun', '08:00', 'bf', 0.25], ['Prânz', '13:00', 'main', 0.35], ['Gustare', '16:30', 'snack', 0.15], ['Cină', '20:00', 'main', 0.25]],
    5: [['Mic dejun', '07:30', 'bf', 0.22], ['Gustare', '10:30', 'snack', 0.12], ['Prânz', '13:30', 'main', 0.3], ['Înainte de sală', '17:00', 'snack', 0.12], ['Cină', '20:30', 'main', 0.24]],
  };
  const KCALS = [1400, 1600, 1800, 2000, 2200, 2400, 2600, 2800, 3000];
  const r5 = (x) => Math.max(0, Math.round(x / 5) * 5), r10 = (x) => Math.max(0, Math.round(x / 10) * 10);

  function allowed(k, P) {
    const x = F[k], al = x.al || [], d = P.diet || 'omnivor';
    if ((P.dislikes || []).includes(x.like)) return false;
    if (al.some((a) => (P.allergies || []).includes(a))) return false;
    if (d === 'fara_porc' && x.a === 'porc') return false;
    if (d === 'vegetarian' && ['meat', 'porc', 'fish'].includes(x.a)) return false;
    if (d === 'post' && ['meat', 'porc', 'fish', 'egg', 'dairy'].includes(x.a)) return false;
    if (P.budget === 'mic' && x.$ >= 3) return false;
    return true;
  }
  // scor: îi place (+3), ieftin dacă bugetul e mic, rapid dacă nu gătește; rotim ca mesele să difere
  function choose(keys, P, used, slot) {
    const ok = keys.filter((k) => F[k] && allowed(k, P));
    if (!ok.length) return null;
    const sc = (k) => ((P.likes || []).includes(F[k].like) ? 3 : 0) + (used.has(k) ? -4 : 0) + (P._avoid && P._avoid.includes(k) ? -9 : 0) + (P.cook === 'drum' && (F[k].at || []).includes('quick') ? 1 : 0) + (P.budget === 'mic' ? (2 - F[k].$) * 0.5 : 0) - keys.indexOf(k) * 0.05;
    return ok.sort((a, b) => sc(b) - sc(a))[0];
  }
  const qty = (k, g) => { const x = F[k]; if (x.u) { const n = Math.max(1, Math.round(g / x.u[0])); return { g: n * x.u[0], txt: `${n} ${n === 1 ? x.u[1] : x.u[2]}${x.u[3] ? ' ' + x.u[3] : ''}` }; } const gg = r10(g); return { g: gg, txt: `${gg} g` }; };
  function mealFrom(parts, name, time) {
    const out = { name, time, items: '', kcal: 0, p: 0, c: 0, f: 0 }, txt = [];
    for (const [k, g0] of parts) {
      if (!k || g0 <= 0) continue; const x = F[k], q = qty(k, g0);
      out.p += (x.p * q.g) / 100; out.c += (x.c * q.g) / 100; out.f += (x.f * q.g) / 100;
      txt.push(x.u ? q.txt : k === 'lapte' ? `lapte ${q.g} ml` : `${x.n} ${q.txt}`);
    }
    out.p = Math.round(out.p); out.c = Math.round(out.c); out.f = Math.round(out.f); out.kcal = Math.round(out.p * 4 + out.c * 4 + out.f * 9);
    out._parts = parts.filter(([k, g]) => k && g > 0);
    out.items = txt.map((s, i) => (i ? s : s.charAt(0).toUpperCase() + s.slice(1))).join(', ');
    return out;
  }
  // grame pentru o țintă de proteine / carbohidrați
  const gFor = (k, need, macro, min, max) => (k && F[k][macro] ? Math.min(max, Math.max(min, (need / F[k][macro]) * 100)) : 0);

  function buildMeal(type, T, P, used, slot, name, time) {
    const has = (k) => k && allowed(k, P);
    if (type === 'bf') {
      // trei variante de mic dejun; o alegem pe cea care îi place cel mai mult
      const opts = [];
      if (has('oua')) opts.push(['oua', (P.likes || []).includes('oua') ? 3 : 1]);
      if (has('ovaz')) opts.push(['ovaz', (P.likes || []).includes('ovaz') ? 3 : 1]);
      if (has('vaci') || has('iaurt')) opts.push(['vaci', (P.likes || []).includes('lactate') ? 2.5 : 0.8]);
      if (has('tofu')) opts.push(['tofu', (P.likes || []).includes('tofu') ? 2 : 0.3]);
      const av = P._avoid || []; opts.forEach((o) => { if (av.includes(o[0]) || (o[0] === 'vaci' && av.includes('iaurt'))) o[1] -= 9; });
      opts.sort((a, b) => b[1] - a[1]);
      const pick = (opts[0] || ['ovaz'])[0];
      if (pick === 'oua') {
        const go = gFor('oua', T.p * 0.75, 'p', 110, 220), bread = choose(['paine', 'turte'], P, used, slot) || choose(['cartofi'], P, used, slot);
        const m0 = mealFrom([['oua', go], ['legume', 150]], name, time), gb = gFor(bread, Math.max(0, T.c - m0.c), 'c', 20, 140);
        const m1 = mealFrom([['oua', go], [bread, gb], ['legume', 150]], name, time), fat = Math.max(0, T.f - m1.f);
        const fatPart = has('avocado') && fat > 6 && (P.likes || []).includes('avocado') ? ['avocado', fat / 0.15] : ['ulei', fat > 4 ? fat : 0];
        used.add('oua'); return withName(mealFrom([['oua', go], [bread, gb], ['legume', 150], fatPart], name, time), (x) => x.replace(/^(\d+ ou\S*)/, 'Omletă din $1'));
      }
      if (pick === 'ovaz') {
        const liquid = has('lapte') ? 'lapte' : null, prot = has('iaurt') ? 'iaurt' : has('whey') ? 'whey' : has('tofu') ? null : null, fr = choose(['banana', 'fructe', 'mar'], P, used, slot);
        const base = [['ovaz', 0], [liquid, 200], [prot, prot === 'whey' ? 30 : 200], [fr, F[fr] && F[fr].u ? F[fr].u[0] : 120]];
        const pre = mealFrom(base, name, time), go = gFor('ovaz', Math.max(10, T.c - pre.c), 'c', 40, 130);
        const nut = has('arahide') ? 'arahide' : has('nuci') ? 'nuci' : null, m1 = mealFrom([['ovaz', go], ...base.slice(1)], name, time), fat = Math.max(0, T.f - m1.f);
        used.add('ovaz'); return withName(mealFrom([['ovaz', go], ...base.slice(1), [nut, nut && fat > 3 ? fat / 0.5 : 0]], name, time), (s) => 'Terci: ' + s.charAt(0).toLowerCase() + s.slice(1));
      }
      if (pick === 'vaci') {
        const d = has('vaci') ? 'vaci' : 'iaurt', bread = choose(['paine', 'turte'], P, used, slot), fr = choose(['fructe', 'mar', 'banana'], P, used, slot);
        const gd = gFor(d, T.p * 0.75, 'p', 150, 350), m0 = mealFrom([[d, gd], [fr, F[fr] && F[fr].u ? F[fr].u[0] : 120]], name, time), gb = gFor(bread, Math.max(0, T.c - m0.c), 'c', 0, 120);
        const m1 = mealFrom([[d, gd], [bread, gb], [fr, F[fr] && F[fr].u ? F[fr].u[0] : 120]], name, time), nut = has('nuci') ? 'nuci' : null, fat = Math.max(0, T.f - m1.f);
        used.add(d); return mealFrom([[d, gd], [bread, gb], [fr, F[fr] && F[fr].u ? F[fr].u[0] : 120], [nut, nut && fat > 4 ? fat / 0.5 : 0]], name, time);
      }
      // tofu „scrambled”
      const gt = gFor('tofu', T.p * 0.8, 'p', 120, 300), bread = choose(['paine', 'turte', 'cartofi'], P, used, slot), m0 = mealFrom([['tofu', gt], ['legume', 150]], name, time), gb = gFor(bread, Math.max(0, T.c - m0.c), 'c', 20, 150);
      used.add('tofu'); return withName(mealFrom([['tofu', gt], [bread, gb], ['legume', 150]], name, time), (s) => s.replace(/^Tofu/, 'Tofu făcut omletă'));
    }
    if (type === 'snack') {
      const pre = /sală/.test(name), fr = choose(pre ? ['banana', 'mar', 'fructe'] : ['mar', 'fructe', 'banana'], P, used, slot + 1);
      const prot = choose(['iaurt', 'vaci', 'whey', 'ton', 'oua'], P, used, slot);
      if (prot) {
        const gp = prot === 'whey' ? 30 : gFor(prot, T.p * 0.8, 'p', prot === 'oua' ? 110 : 100, 300), base = [[prot, gp], [fr, F[fr] && F[fr].u ? F[fr].u[0] : 120]];
        const m0 = mealFrom(base, name, time), extra = Math.max(0, T.c - m0.c), cb = pre ? choose(['paine', 'turte'], P, used, slot) : null;
        const m1 = mealFrom([...base, [cb, cb ? gFor(cb, extra, 'c', 0, 80) : 0]], name, time), nut = choose(['nuci', 'arahide'], P, used, slot), fat = Math.max(0, T.f - m1.f);
        used.add(prot); return mealFrom([...base, [cb, cb ? gFor(cb, extra, 'c', 0, 80) : 0], [nut, nut && fat > 4 ? Math.min(30, fat / 0.5) : 0]], name, time);
      }
      const nut = choose(['nuci', 'arahide'], P, used, slot), m0 = mealFrom([[fr, F[fr] && F[fr].u ? F[fr].u[0] : 150]], name, time);
      return mealFrom([[fr, F[fr] && F[fr].u ? F[fr].u[0] : 150], [nut, nut ? Math.min(35, Math.max(15, (T.f - m0.f) / 0.5)) : 0], ...(nut ? [] : [['naut', 120]])], name, time);
    }
    // masă principală: proteină + carbohidrat + legume + ulei
    const pr = choose(['pui', 'curcan', 'vita', 'porc', 'peste', 'somon', 'ton', 'tofu', 'oua', 'linte', 'fasole', 'naut'], P, used, slot);
    const plant = pr && F[pr].g === 'plant';
    const gp = gFor(pr, T.p * (plant ? 0.6 : 0.8), 'p', 100, plant ? 350 : 250);
    const cb = choose(['orez', 'cartofi', 'paste', 'mamaliga', 'quinoa', 'cartofdulce'], P, used, slot);
    const m0 = mealFrom([[pr, gp], ['legume', 200]], name, time), gc = gFor(cb, Math.max(0, T.c - m0.c), 'c', plant ? 0 : 60, 380);
    const m1 = mealFrom([[pr, gp], [cb, gc], ['legume', 200]], name, time), fat = Math.max(0, T.f - m1.f);
    if (pr) used.add(pr); if (cb) used.add(cb);
    return mealFrom([[pr, gp], [cb, gc], ['legume', 200], ['ulei', fat > 3 ? Math.min(20, fat) : 0]], name, time);
  }
  function withName(m, fn) { m.items = fn(m.items); return m; }

  /* ținta de calorii: din profil (dacă îl avem) sau după sex și obiectiv */
  function target(P, info) {
    let kcal = info.kcal;
    const fixed = KCALS.includes(+P.kcal) ? +P.kcal : 0;
    const goal = P.goal || 'mentinere', F2 = info.sex === 'F';
    if (!kcal) kcal = { slabire: F2 ? 1600 : 2000, mentinere: F2 ? 1900 : 2400, masa: F2 ? 2300 : 2900 }[goal] || 2200;
    else if (info.kcalGoal && info.kcalGoal !== goal) { const base = info.kcalGoal === 'slabire' ? kcal + 450 : info.kcalGoal === 'masa' ? kcal - 300 : kcal; kcal = goal === 'slabire' ? base - 450 : goal === 'masa' ? base + 300 : base; }
    if (fixed) kcal = fixed;
    kcal = Math.round(kcal / 10) * 10;
    const kg = info.kg || (F2 ? 62 : 78);
    const p = Math.round(Math.min(kg * (goal === 'slabire' ? 2 : 1.8), (kcal * 0.4) / 4)), f = Math.round((kcal * 0.27) / 9), c = Math.max(80, Math.round((kcal - p * 4 - f * 9) / 4));
    return { kcal, p, c, f };
  }
  function generate(P, info) {
    let g = gen1(P, info, 1);
    for (let k = 0; k < 3; k++) { const want = g.target.kcal, r = want / g.kcal; if (Math.abs(1 - r) < 0.035) break; g = gen1(P, info, (g._f || 1) * r); }
    delete g._f; return g;
  }
  function gen1(P, info, fac) {
    const T0 = target(P, info), T = { kcal: T0.kcal * fac, p: T0.p * Math.min(1, fac), c: T0.c * fac, f: T0.f * fac }, n = [3, 4, 5].includes(+P.meals) ? +P.meals : 4, used = new Set();
    const meals = LAYOUT[n].map(([name, time, type, share], i) => buildMeal(type, { kcal: T.kcal * share, p: T.p * share, c: T.c * share, f: T.f * share }, P, used, i, name, time));
    // dacă au ieșit prea puține calorii, completăm cu fruct și nuci la gustare sau la micul dejun
    const sum = () => meals.reduce((a, m) => a + m.kcal, 0);
    let miss = T.kcal - sum();
    if (miss > 120) {
      const i = Math.max(0, meals.findIndex((m) => /Gustare|sală/.test(m.name))), m = meals[i], ex = [];
      const fr = ['banana', 'mar', 'fructe'].find((k) => allowed(k, P)); if (fr) { ex.push([fr, F[fr].u ? F[fr].u[0] : 150]); miss -= F[fr].u ? (F[fr].c * F[fr].u[0]) / 25 : 80; }
      const nut = ['nuci', 'arahide', 'avocado'].find((k) => allowed(k, P)); if (nut && miss > 60) ex.push([nut, Math.min(45, miss / (F[nut].f * 9 + (F[nut].p + F[nut].c) * 4) * 100)]);
      meals[i] = withName(mealFrom([...m._parts, ...ex], m.name, m.time), (x) => (/^(Omletă|Terci|Tofu făcut)/.test(m.items) ? m.items.split(',')[0] + x.slice(x.indexOf(',')) : x));
    }
    meals.forEach((m) => { m.k = m._parts.map((x) => x[0]); delete m._parts; });
    const tot = (k) => meals.reduce((a, m) => a + m[k], 0);
    const GL = { slabire: 'Slăbire', mentinere: 'Menținere', masa: 'Masă musculară' };
    const likes = (P.likes || []).map((k) => (LIKES.find((x) => x[0] === k) || [k, k])[1].replace(/^\S+ /, '')).slice(0, 4);
    return {
      name: 'Dieta mea personală', goal: GL[P.goal] || 'Menținere', kcal: tot('kcal'), p: tot('p'), c: tot('c'), f: tot('f'), target: T0, _f: fac,
      desc: `Făcută după ce-ți place${likes.length ? ` (${likes.join(', ').toLowerCase()})` : ''}${(P.allergies || []).length ? `, fără ${P.allergies.map((a) => (ALLERGIES.find((x) => x[0] === a) || [a, a])[1].toLowerCase()).join(', ')}` : ''}. ${n} mese pe zi, ~${T0.kcal} kcal. Poți înlocui o carne cu alta și un carbohidrat cu altul, în cantități asemănătoare.`,
      meals,
    };
  }

  /* altă variantă pentru o singură masă, cu aceleași calorii și macro-uri */
  function mealType(m, i, n) { if (/mic dejun/i.test(m.name)) return 'bf'; if (/gustare|sală|sala/i.test(m.name)) return 'snack'; const L = LAYOUT[n]; return L && L[i] ? L[i][2] : 'main'; }
  function keysOf(m) { if (Array.isArray(m.k) && m.k.length) return m.k; const t = String(m.items || '').toLowerCase(); return Object.keys(F).filter((k) => t.includes(String(F[k].n || k).toLowerCase().split(' ')[0])); }
  function swapMeal(plan, i, P) {
    const old = plan.meals[i]; if (!old) return null;
    const type = mealType(old, i, plan.meals.length), T = { kcal: old.kcal, p: old.p, c: old.c, f: old.f };
    const others = new Set(plan.meals.filter((_, j) => j !== i).flatMap(keysOf)), avoid = [...keysOf(old), ...(old.prev || [])];
    let best = null;
    for (let a = 0; a < 4 && !best; a++) {
      const Q = { ...P, _avoid: avoid.slice(0, a ? avoid.length : avoid.length) };
      const m = buildMeal(type, T, Q, new Set(a < 2 ? others : []), i + a * 3, old.name, old.time);
      if (m && m.items && m.items !== old.items) best = m; else if (m) avoid.push(...(m._parts || []).map((x) => x[0]));
    }
    if (!best) return null;
    if (T.kcal - best.kcal > 120 && type !== 'bf') { const fr = ['banana', 'mar', 'fructe'].find((k) => allowed(k, P)); if (fr) best = mealFrom([...best._parts, [fr, F[fr].u ? F[fr].u[0] : 150]], old.name, old.time); }
    best.k = best._parts.map((x) => x[0]); delete best._parts;
    best.prev = [...new Set([...keysOf(old), ...(old.prev || [])])].slice(-8);
    return best;
  }
  return { generate, target, swapMeal, KCALS, LIKES, DIETS, ALLERGIES, FOODS: F };
});
