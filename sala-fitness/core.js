/* Logica aplicației de sală. Rulează pe server (Node) și în demo-ul din browser.
   route(db, req, ctx) -> { status, data, session? }  ·  jobs(db, ctx) rulează la fiecare minut pe server. */
(function (root, f) { if (typeof module === 'object' && module.exports) module.exports = f(); else root.GymCore = f(); })(this, function () {
  'use strict';
  const clean = (s, n = 200) => String(s == null ? '' : s).replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, n);
  const text = (s, n = 2000) => String(s == null ? '' : s).replace(/\r/g, '').trim().slice(0, n);
  const num = (v, min = -1e9, max = 1e9) => { const x = Number(String(v).replace(',', '.')); return Number.isFinite(x) ? Math.min(max, Math.max(min, x)) : null; };
  const add = (d, n) => { const x = new Date(d + 'T12:00:00Z'); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); };
  const diff = (a, b) => Math.round((Date.parse(a + 'T12:00:00Z') - Date.parse(b + 'T12:00:00Z')) / 864e5);
  const isDate = (d) => /^\d{4}-\d{2}-\d{2}$/.test(String(d || ''));
  const phoneKey = (p) => String(p || '').replace(/\D/g, '').replace(/^40/, '0').replace(/^(?!0)/, '0');
  const ok = (data, status = 200, extra) => Object.assign({ status, data }, extra || {});
  const no = (status, error) => ({ status, data: { error } });
  const monthOf = (d) => d.slice(0, 7);
  const mondayOf = (d) => { const x = new Date(d + 'T12:00:00Z'); const w = (x.getUTCDay() + 6) % 7; return add(d, -w); };
  const hashStr = (s) => { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; };

  /* ---------- abonament ---------- */
  function subOf(db, m, t) {
    const s = m.sub || {}, plan = db.plans.find((p) => p.id === s.planId) || null;
    if (!s.end) return { state: 'none', daysLeft: null, plan, start: null, end: null };
    const left = diff(s.end, t);
    return { state: left < 0 ? 'expired' : left <= 3 ? 'expiring' : 'active', daysLeft: left, plan, start: s.start, end: s.end };
  }
  /* ---------- activitate, serii, insigne, puncte ---------- */
  function activeDays(m) { const s = new Set([...(m.checkins || []), ...(m.workouts || []).map((w) => w.date), ...Object.keys(m.challenges || {}).filter((k) => m.challenges[k])]); return s; }
  function lastActive(m) { const all = [...(m.checkins || []), ...(m.workouts || []).map((w) => w.date)].sort(); return all[all.length - 1] || null; }
  function streak(m, t) { const s = activeDays(m); let d = s.has(t) ? t : add(t, -1), n = 0; while (s.has(d)) { n++; d = add(d, -1); } return n; }
  function maxStreak(m) { const days = [...activeDays(m)].sort(); let best = 0, cur = 0, prev = null; for (const d of days) { cur = prev && diff(d, prev) === 1 ? cur + 1 : 1; best = Math.max(best, cur); prev = d; } return best; }
  function trainDays(m) { return new Set([...(m.checkins || []), ...(m.workouts || []).map((w) => w.date)]); }
  function weekCount(m, t) { const mon = mondayOf(t); return [...trainDays(m)].filter((d) => d >= mon && d <= t).length; }
  function goalWeeks(m) { const g = m.weekGoal || 3, by = {}; for (const d of trainDays(m)) { const k = mondayOf(d); by[k] = (by[k] || 0) + 1; } return Object.values(by).filter((n) => n >= g).length; }
  const BADGES = [
    ['first', '🔥', 'Primul pas', 'Primul antrenament înregistrat', (m) => trainDays(m).size >= 1],
    ['w10', '💪', '10 antrenamente', 'Ai venit de 10 ori', (m) => trainDays(m).size >= 10],
    ['w50', '🏋️', '50 antrenamente', 'Jumătate de sută!', (m) => trainDays(m).size >= 50],
    ['w100', '👑', '100 antrenamente', 'Legendă a sălii', (m) => trainDays(m).size >= 100],
    ['s3', '⚡', '3 zile la rând', 'Activ 3 zile consecutive', (m) => maxStreak(m) >= 3],
    ['s7', '🌟', 'O săptămână fără pauză', 'Activ 7 zile consecutive', (m) => maxStreak(m) >= 7],
    ['week', '🎯', 'Săptămâna perfectă', 'Ai atins obiectivul săptămânal', (m) => goalWeeks(m) >= 1],
    ['month', '🏆', 'Lună de foc', 'Obiectivul atins 4 săptămâni', (m) => goalWeeks(m) >= 4],
    ['ch10', '✅', '10 provocări', '10 provocări zilnice bifate', (m) => Object.values(m.challenges || {}).filter(Boolean).length >= 10],
    ['weigh', '⚖️', 'Prima cântărire', 'Ți-ai notat greutatea', (m) => (m.weights || []).length >= 1],
    ['photo', '📸', 'Primul progres foto', 'Ai salvat o poză de progres', (m) => (m.photos || []).length >= 1],
    ['loyal', '💎', 'Membru fidel', '3 luni cu noi', (m, t) => m.createdAt && diff(t, m.createdAt) >= 90],
  ];
  function badgesOf(m, t) { return BADGES.map(([id, icon, name, desc, fn]) => ({ id, icon, name, desc, earned: !!fn(m, t) })); }
  function pointsOf(db, m, t) {
    const earned = (m.workouts || []).length * 10 + (m.checkins || []).length * 5 + Object.values(m.challenges || {}).filter(Boolean).length * 5 + badgesOf(m, t).filter((b) => b.earned).length * 50;
    const spent = db.redemptions.filter((r) => r.memberId === m.id && r.status !== 'refuzat').reduce((a, r) => a + r.points, 0);
    return { earned, spent, balance: Math.max(0, earned - spent) };
  }
  function dailyFor(db, d) { return db.daily[d] || db.dailyLib[hashStr(d) % db.dailyLib.length]; }
  function weeklyGoals(m, t) {
    const mon = mondayOf(t), inWeek = (d) => d >= mon && d <= t;
    const wk = [...trainDays(m)].filter(inWeek).length, ch = Object.keys(m.challenges || {}).filter((d) => m.challenges[d] && inWeek(d)).length;
    const weighed = (m.weights || []).some((w) => inWeek(w.date));
    return [
      { id: 'train', title: `${m.weekGoal || 3} antrenamente săptămâna asta`, done: wk, target: m.weekGoal || 3, pts: 50 },
      { id: 'chal', title: '5 provocări zilnice bifate', done: Math.min(ch, 5), target: 5, pts: 30 },
      { id: 'weigh', title: 'Cântărește-te o dată', done: weighed ? 1 : 0, target: 1, pts: 10 },
    ];
  }
  /* calorii recomandate (Mifflin-St Jeor) */
  function kcalTarget(m, t) {
    const w = (m.weights || []).slice(-1)[0], kg = w ? w.kg : null;
    if (!kg || !m.height || !m.birth) return null;
    const age = Math.floor(diff(t, m.birth) / 365.25), bmr = 10 * kg + 6.25 * m.height - 5 * age + (m.sex === 'F' ? -161 : 5);
    const tdee = bmr * 1.5, g = (m.goal || '').toLowerCase();
    return Math.round((/slăb|slab|defin/.test(g) ? tdee - 450 : /mas|crest|creșt/.test(g) ? tdee + 300 : tdee) / 10) * 10;
  }

  /* ---------- clasament lunar ---------- */
  const shortName = (n) => { const p = String(n || '').trim().split(/\s+/); return p[0] + (p[1] ? ' ' + p[1][0] + '.' : ''); };
  function monthPts(m, mo) {
    const inM = (d) => d && d.slice(0, 7) === mo;
    return (m.workouts || []).filter((w) => inM(w.date)).length * 10 + (m.checkins || []).filter(inM).length * 5 + Object.keys(m.challenges || {}).filter((d) => m.challenges[d] && inM(d)).length * 5;
  }
  function boardFor(db, me, t) {
    const mo = monthOf(t);
    const rows = db.members.filter((x) => !x.hideBoard || x.id === me.id).map((x) => ({ id: x.id, name: shortName(x.name), pts: monthPts(x, mo), streak: streak(x, t), hidden: !!x.hideBoard })).filter((x) => x.pts > 0 || x.id === me.id).sort((a, b) => b.pts - a.pts || a.name.localeCompare(b.name));
    rows.forEach((x, i) => (x.rank = i + 1));
    const mine = rows.find((x) => x.id === me.id);
    return { month: mo, top: rows.filter((x) => !x.hidden).slice(0, 10).map(({ id, ...x }) => ({ ...x, me: id === me.id })), me: mine ? { rank: mine.hidden ? null : mine.rank, pts: mine.pts } : null, total: rows.length };
  }
  /* ---------- cât de aglomerat e ---------- */
  const hm = (s) => { const [h, mi] = String(s || '0:0').split(':').map(Number); return h * 60 + (mi || 0); };
  function crowdFor(db, t, now) {
    const nowM = hm(now), cur = db.members.filter((m) => (m.ciAt || {})[t] && nowM - hm(m.ciAt[t]) >= 0 && nowM - hm(m.ciAt[t]) <= 90).length;
    const wd = new Date(t + 'T12:00:00Z').getUTCDay(), hours = Array.from({ length: 17 }, (_, i) => ({ h: 6 + i, n: 0 }));
    let weeks = 0;
    for (let k = 1; k <= 8; k++) { const d = add(t, -7 * k); let any = false; for (const m of db.members) { const x = (m.ciAt || {})[d]; if (x) { any = true; const h = Math.floor(hm(x) / 60) - 6; if (hours[h]) hours[h].n++; } } if (any) weeks++; }
    hours.forEach((x) => (x.n = weeks ? Math.round((x.n / weeks) * 10) / 10 : 0));
    const peak = Math.max(1, ...hours.map((x) => x.n)), level = cur === 0 ? 0 : cur < Math.max(5, peak * 0.4) ? 1 : cur < Math.max(10, peak * 0.75) ? 2 : 3;
    return { now: cur, level, hours, weekday: wd };
  }
  /* ---------- generatorul de program ---------- */
  // rolul fiecărui exercițiu în antrenament: [slot, regiune]
  const EXMETA = {
    ex_squat: ['quad', 'legs'], ex_goblet: ['quad', 'legs'], ex_legpress: ['quad', 'legs'], ex_lunge: ['quad2', 'legs'], ex_rdl: ['hinge', 'legs'], ex_hipthrust: ['glute', 'legs'],
    ex_bench: ['pushH', 'chest'], ex_dbpress: ['pushH', 'chest'], ex_pushup: ['pushH', 'chest'], ex_fly: ['chestIso', 'chest'], ex_dips: ['tri', 'arms'],
    ex_pullup: ['pullV', 'back'], ex_latpull: ['pullV', 'back'], ex_row: ['pullH', 'back'], ex_cablerow: ['pullH', 'back'],
    ex_ohp: ['pushV', 'shoulders'], ex_lateral: ['delt', 'shoulders'], ex_curl: ['bi', 'arms'], ex_triceps: ['tri', 'arms'],
    ex_plank: ['core', 'core'], ex_crunch: ['core', 'core'], ex_legraise: ['core', 'core'], ex_bike: ['cardio', 'cardio'], ex_treadmill: ['cardio', 'cardio'], ex_rowerg: ['cardio', 'cardio'],
  };
  const SPLITS = {
    full: [['Corp întreg A', ['quad', 'pushH', 'pullV', 'hinge', 'delt', 'core']], ['Corp întreg B', ['hinge', 'pushV', 'pullH', 'quad2', 'chestIso', 'core']], ['Corp întreg C', ['quad', 'pushH', 'pullH', 'glute', 'bi', 'tri']]],
    upper: ['Partea de sus', ['pushH', 'pullV', 'pushV', 'pullH', 'bi', 'tri', 'delt']], lower: ['Picioare și abdomen', ['quad', 'hinge', 'quad2', 'glute', 'core', 'core']],
    push: ['Împins: piept, umeri, triceps', ['pushH', 'pushV', 'chestIso', 'delt', 'tri']], pull: ['Tras: spate și biceps', ['pullV', 'pullH', 'pullH', 'bi', 'core']], legs: ['Picioare și fesieri', ['quad', 'hinge', 'quad2', 'glute', 'core']],
  };
  const FOCUS = { legs: ['glute', 'quad2'], chest: ['pushH', 'tri'], back: ['pullH', 'delt'], core: ['core', 'core'] };
  function generateProgram(db, me, b) {
    const goal = ['slabire', 'masa', 'forta', 'tonifiere', 'sanatate'].includes(b.goal) ? b.goal : 'tonifiere';
    const days = Math.round(num(b.days, 2, 6) || 3), level = ['incepator', 'mediu', 'avansat'].includes(b.level) ? b.level : 'incepator';
    const home = b.place === 'acasa', minutes = num(b.minutes, 20, 120) || 45, focus = FOCUS[b.focus] ? b.focus : '';
    const fits = (e) => EXMETA[e.id] && (!home || ['Fără echipament', 'Gantere'].includes(e.equipment)) && (level !== 'incepator' || e.level !== 'greu');
    const pool = db.exercises.filter(fits), bySlot = {};
    for (const e of pool) { const k = EXMETA[e.id][0]; (bySlot[k] = bySlot[k] || []).push(e); }
    const alt = { quad2: 'quad', glute: 'hinge', chestIso: 'pushH', pullV: 'pullH', delt: 'pushV', tri: 'pushH', bi: 'pullH', hinge: 'glute', pushV: 'pushH' };
    const pick = (slot, i, used) => { let list = bySlot[slot] || bySlot[alt[slot]] || []; const fresh = list.filter((e) => !used.has(e.id)); if (fresh.length) list = fresh; return list.length ? list[i % list.length] : null; };
    let plan;
    if (days === 2) plan = [SPLITS.full[0], SPLITS.full[1]];
    else if (days === 3) plan = goal === 'masa' && level !== 'incepator' ? [SPLITS.push, SPLITS.pull, SPLITS.legs] : SPLITS.full;
    else if (days === 4) plan = [SPLITS.upper, SPLITS.lower, SPLITS.upper, SPLITS.lower];
    else if (days === 5) plan = [SPLITS.push, SPLITS.pull, SPLITS.legs, SPLITS.upper, SPLITS.lower];
    else plan = [SPLITS.push, SPLITS.pull, SPLITS.legs, SPLITS.push, SPLITS.pull, SPLITS.legs];
    const R = { forta: [5, '5', 150], masa: [4, '8–10', 90], tonifiere: [3, '12–15', 60], slabire: [3, '12–15', 45], sanatate: [3, '10–12', 75] }[goal];
    const sets = Math.min(5, Math.max(2, R[0] - (level === 'incepator' ? 1 : 0) + (level === 'avansat' ? 1 : 0)));
    const nEx = Math.max(3, Math.min(8, Math.round((minutes - (goal === 'slabire' ? 15 : 5)) / (sets * 2.6))));
    const lastKg = (id) => { const ws = (me.workouts || []).slice().reverse(); for (const w of ws) { const s2 = (w.sets || []).filter((x) => x.ex === id && x.kg); if (s2.length) return Math.max(...s2.map((x) => x.kg)); } return 0; };
    const cardio = (bySlot.cardio || [])[0];
    const outDays = plan.map(([name, slots], di) => {
      const used = new Set(), list = slots.slice();
      if (focus) list.splice(2, 0, FOCUS[focus][di % 2]);
      const items = [];
      if (cardio) items.push({ ex: cardio.id, sets: 1, reps: '5 min', kg: 0, rest: 0 });
      for (const slot of list) { if (items.length - 1 >= nEx) break; const e = pick(slot, di + items.length, used); if (!e || used.has(e.id)) continue; used.add(e.id); const core = EXMETA[e.id][0] === 'core'; items.push({ ex: e.id, sets, reps: e.id === 'ex_plank' ? '30–45 s' : core ? '12–15' : R[1], kg: lastKg(e.id), rest: core ? 45 : R[2] }); }
      if (goal === 'slabire' && cardio) items.push({ ex: (bySlot.cardio[di % bySlot.cardio.length] || cardio).id, sets: 1, reps: '15 min', kg: 0, rest: 0 });
      return { name: `${name}`, items };
    });
    const GL = { slabire: 'Slăbire', masa: 'Masă musculară', forta: 'Forță', tonifiere: 'Tonifiere', sanatate: 'Sănătate și energie' }, LV = { incepator: 'începător', mediu: 'mediu', avansat: 'avansat' };
    const id = 'pr_my_' + me.id;
    const prog = { id, owner: me.id, name: 'Programul meu personal', goal: GL[goal], level: LV[level], daysPerWeek: days, desc: `${days} antrenamente pe săptămână, ~${minutes} min, ${home ? 'acasă' : 'la sală'}. ${sets} serii × ${R[1]} repetări, pauză ${R[2]} s.${focus ? ' Accent pe zona aleasă.' : ''}`, days: outDays, generated: b };
    db.programs = db.programs.filter((x) => x.id !== id); db.programs.push(prog); me.programId = id;
    return prog;
  }

  /* ---------- vederi ---------- */
  const pubSettings = (s) => { const { checkinCode, checkinDate, dailySent, ...r } = s; return r; };
  function memberRow(db, m, t) {
    const s = subOf(db, m, t), la = lastActive(m);
    return { id: m.id, name: m.name, phone: m.phone, tags: m.tags || [], plan: s.plan ? s.plan.name : '', state: s.state, end: s.end, daysLeft: s.daysLeft, lastActive: la, idle: la ? diff(t, la) : null, createdAt: m.createdAt, visits: trainDays(m).size, pushOn: (m.push || []).length > 0, ciToday: (m.ciAt || {})[t] || null };
  }
  function memberFull(db, m, t) {
    const { pass, push, ...r } = m;
    return { ...r, pushOn: (push || []).length > 0, subscription: subOf(db, m, t), streak: streak(m, t), maxStreak: maxStreak(m), weekCount: weekCount(m, t), points: pointsOf(db, m, t), badges: badgesOf(m, t), lastActive: lastActive(m) };
  }
  function homeFor(db, m, t, ctx) {
    const full = memberFull(db, m, t), d = dailyFor(db, t);
    const program = db.programs.find((p) => p.id === m.programId) || null, nutrition = db.nutrition.find((n) => n.id === m.nutritionId) || null;
    // următoarea zi din program: după ultimul antrenament din programul curent
    let nextDay = 0;
    if (program) { const last = (m.workouts || []).filter((w) => w.programId === program.id).slice(-1)[0]; nextDay = last ? (last.dayIdx + 1) % program.days.length : 0; }
    const month = monthOf(t), cal = {};
    for (const x of m.checkins || []) cal[x] = (cal[x] || '') + 'c';
    for (const w of m.workouts || []) cal[w.date] = (cal[w.date] || '') + 'w';
    for (const k of Object.keys(m.challenges || {})) if (m.challenges[k]) cal[k] = (cal[k] || '') + 'p';
    return {
      me: full, today: t, daily: { ...d, done: !!(m.challenges || {})[t] }, program, nextDay, nutrition, kcal: kcalTarget(m, t), weekly: weeklyGoals(m, t), calendar: cal,
      announcements: db.announcements.filter((a) => !a.until || a.until >= t).sort((a, b) => (b.pinned - a.pinned) || b.date.localeCompare(a.date)),
      bookings: db.bookings.filter((b) => b.memberId === m.id).sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time)).slice(0, 20),
      services: db.services, rewards: db.rewards, redemptions: db.redemptions.filter((r) => r.memberId === m.id).slice(-20).reverse(),
      programs: db.programs.filter((p) => !p.owner || p.owner === m.id).map(({ days, ...p }) => ({ ...p, nDays: days.length })), plans: db.plans.filter((p) => p.active),
      board: boardFor(db, m, t), crowd: crowdFor(db, t, ctx.time ? ctx.time() : '12:00'), water: (m.water || {})[t] || 0, chatUnread: (m.chat || []).filter((x) => x.from === 'g' && !x.read).length,
      memberCode: 'GYM:' + m.id, checkinTime: (m.ciAt || {})[t] || null,
      nutritionPlans: db.nutrition.map(({ meals, ...n }) => n), unread: (m.notifs || []).filter((n) => !n.read).length, checkedInToday: (m.checkins || []).includes(t),
    };
  }
  function stats(db, t) {
    const month = monthOf(t), rows = db.members.map((m) => memberRow(db, m, t));
    const pays = db.members.flatMap((m) => (m.payments || []).map((p) => ({ ...p, memberId: m.id, name: m.name })));
    const months = []; for (let i = 5; i >= 0; i--) { const d = new Date(t + 'T12:00:00Z'); d.setUTCDate(1); d.setUTCMonth(d.getUTCMonth() - i); months.push(d.toISOString().slice(0, 7)); }
    const revenue = months.map((mo) => ({ month: mo, total: pays.filter((p) => monthOf(p.date) === mo).reduce((a, p) => a + Number(p.amount || 0), 0), count: pays.filter((p) => monthOf(p.date) === mo).length }));
    const renewals = db.members.filter((m) => (m.payments || []).some((p) => monthOf(p.date) === month) && (m.payments || []).some((p) => monthOf(p.date) < month)).length;
    const lost = rows.filter((r) => r.state === 'expired' && r.daysLeft >= -30).length;
    const activeStart = rows.filter((r) => r.state !== 'none').length || 1;
    const visitsToday = db.members.filter((m) => (m.checkins || []).includes(t)).length;
    return {
      total: rows.length, active: rows.filter((r) => r.state === 'active' || r.state === 'expiring').length, expiring: rows.filter((r) => r.state === 'expiring').length, expired: rows.filter((r) => r.state === 'expired').length,
      newThisMonth: rows.filter((r) => r.createdAt && monthOf(r.createdAt) === month).length, renewals, churn: lost, churnRate: Math.round((lost / activeStart) * 100),
      revenue, revenueMonth: revenue[revenue.length - 1].total, visitsToday,
      visits14: Array.from({ length: 14 }, (_, i) => { const d = add(t, i - 13); return { date: d, n: db.members.filter((m) => (m.checkins || []).includes(d)).length }; }),
    };
  }
  function targetMembers(db, t, target, ids) {
    const rows = db.members.map((m) => [m, memberRow(db, m, t)]);
    const pick = {
      all: () => true, active: (r) => r.state === 'active' || r.state === 'expiring', expiring: (r) => r.state === 'expiring', expired: (r) => r.state === 'expired',
      inactive: (r) => r.idle === null || r.idle >= 7, ids: (r) => (ids || []).includes(r.id),
    };
    const fn = target && target.startsWith('tag:') ? (r) => r.tags.includes(target.slice(4)) : pick[target] || pick.all;
    return rows.filter(([, r]) => fn(r)).map(([m]) => m);
  }
  function notify(db, ctx, members, title, body, kind = 'mesaj', url = '/app.html') {
    const at = ctx.nowISO(); let pushed = 0;
    for (const m of members) {
      m.notifs = m.notifs || [];
      m.notifs.push({ id: ctx.uid('nt'), title, body, kind, at, read: false });
      if (m.notifs.length > 80) m.notifs.splice(0, m.notifs.length - 80);
      if (ctx.push && (m.push || []).length) { ctx.push(m, { title, body, url, tag: kind }); pushed++; }
    }
    return { count: members.length, pushed };
  }
  function addPayment(db, m, t, ctx, body) {
    const plan = db.plans.find((p) => p.id === body.planId);
    if (!plan) return 'Alege tipul de abonament.';
    const amount = num(body.amount === '' || body.amount == null ? plan.price : body.amount, 0, 1e6);
    const date = isDate(body.date) ? body.date : t;
    const cur = m.sub && m.sub.end && m.sub.end >= t ? m.sub.end : null;
    const start = cur ? add(cur, 1) : date;
    m.sub = { planId: plan.id, start: cur ? m.sub.start : start, end: add(start, plan.days - 1) };
    m.payments = m.payments || [];
    m.payments.push({ id: ctx.uid('pa'), date, amount, planId: plan.id, method: ['numerar', 'card', 'transfer'].includes(body.method) ? body.method : 'numerar', note: clean(body.note, 120) });
    m.expiryNotified = {};
    return null;
  }
  function memberInput(body, m) {
    if (body.name !== undefined) { const n = clean(body.name, 80); if (n.length < 2) return 'Scrie numele.'; m.name = n; }
    if (body.phone !== undefined) { const p = clean(body.phone, 20); if (phoneKey(p).length < 10) return 'Numărul de telefon nu e corect.'; m.phone = p; }
    if (body.email !== undefined) m.email = clean(body.email, 120);
    if (body.birth !== undefined) m.birth = isDate(body.birth) ? body.birth : '';
    if (body.sex !== undefined) m.sex = body.sex === 'F' ? 'F' : body.sex === 'M' ? 'M' : '';
    if (body.height !== undefined) m.height = num(body.height, 100, 230);
    if (body.goal !== undefined) m.goal = clean(body.goal, 80);
    if (body.targetWeight !== undefined) m.targetWeight = num(body.targetWeight, 30, 250);
    if (body.weekGoal !== undefined) m.weekGoal = num(body.weekGoal, 1, 7) || 3;
    if (body.level !== undefined) m.level = clean(body.level, 20);
    return null;
  }
  const crud = (list, idPrefix, map) => ({ list, idPrefix, map });

  /* ---------- rapoarte pentru admin ---------- */
  function reports(db, t) {
    const months = []; for (let i = 11; i >= 0; i--) { const d = new Date(t + 'T12:00:00Z'); d.setUTCDate(1); d.setUTCMonth(d.getUTCMonth() - i); months.push(d.toISOString().slice(0, 7)); }
    const growth = months.map((mo) => ({ month: mo, total: db.members.filter((m) => m.createdAt && monthOf(m.createdAt) <= mo).length, added: db.members.filter((m) => m.createdAt && monthOf(m.createdAt) === mo).length }));
    const mix = {}; db.members.forEach((m) => { const s = subOf(db, m, t); if (s.state === 'active' || s.state === 'expiring') { const k = s.plan ? s.plan.name : 'Altul'; mix[k] = (mix[k] || 0) + 1; } });
    const heat = Array.from({ length: 7 }, () => Array(17).fill(0)), wd = Array(7).fill(0), from = add(t, -56);
    for (const m of db.members) for (const [d, x] of Object.entries(m.ciAt || {})) { if (d < from || d > t || !x) continue; const w = (new Date(d + 'T12:00:00Z').getUTCDay() + 6) % 7, h = Math.floor(hm(x) / 60) - 6; wd[w]++; if (h >= 0 && h < 17) heat[w][h]++; }
    const visits30 = Array.from({ length: 30 }, (_, i) => { const d = add(t, i - 29); return { date: d, n: db.members.filter((m) => (m.checkins || []).includes(d)).length }; });
    const top = db.members.map((m) => ({ id: m.id, name: m.name, n: (m.checkins || []).filter((d) => d >= add(t, -30)).length })).sort((a, b) => b.n - a.n).slice(0, 5);
    const ltv = db.members.length ? Math.round(db.members.reduce((a, m) => a + (m.payments || []).reduce((x, p) => x + Number(p.amount || 0), 0), 0) / db.members.length) : 0;
    return { growth, mix: Object.entries(mix).map(([name, n]) => ({ name, n })).sort((a, b) => b.n - a.n), heat, weekday: wd, visits30, top, ltv };
  }

  /* ---------- rute ---------- */
  function route(db, req, ctx) {
    const { method: m, path: p, body = {}, query: q = {}, session: s } = req, t = ctx.today();
    let r;
    if (p === '/api/config' && m === 'GET') return ok({ settings: pubSettings(db.settings), plans: db.plans.filter((x) => x.active), services: db.services, pushKey: ctx.vapidPublic || null, demo: !!ctx.demo });
    if (p === '/api/whoami' && m === 'GET') return ok({ role: s ? s.role : null });
    if (p === '/api/logout' && m === 'POST') return ok({ ok: true }, 200, { session: null });
    if (p === '/api/login' && m === 'POST') {
      const k = phoneKey(body.phone), mem = db.members.find((x) => phoneKey(x.phone) === k);
      if (!mem || !ctx.check(String(body.password || ''), mem.pass)) return no(401, 'Telefonul sau parola nu sunt corecte. Parola ți-o dă recepția sălii.');
      return ok({ ok: true }, 200, { session: { role: 'member', id: mem.id } });
    }
    if (p === '/api/admin/login' && m === 'POST') {
      if (!db.admin) return no(400, 'Parola de administrator nu e setată pe server.');
      if (!ctx.check(String(body.password || ''), db.admin)) return no(401, 'Parolă greșită.');
      return ok({ ok: true }, 200, { session: { role: 'admin' } });
    }
    if (p === '/api/exercises' && m === 'GET') { if (!s) return no(401, 'Intră în cont.'); return ok({ exercises: db.exercises }); }

    /* ======== MEMBRU ======== */
    if (p.startsWith('/api/me')) {
      if (!s || s.role !== 'member') return no(401, 'Intră în cont.');
      const me = db.members.find((x) => x.id === s.id);
      if (!me) return no(401, 'Contul nu mai există. Vorbește cu recepția.');
      if (p === '/api/me' && m === 'GET') return ok(homeFor(db, me, t, ctx));
      if (p === '/api/me' && m === 'PUT') { if (body.hideBoard !== undefined) me.hideBoard = !!body.hideBoard; const e = memberInput({ ...body, phone: undefined }, me); return e ? no(400, e) : ok(homeFor(db, me, t, ctx)); }
      if (p === '/api/me/water' && m === 'POST') { me.water = me.water || {}; me.water[t] = num(body.n, 0, 20) || 0; return ok(homeFor(db, me, t, ctx)); }
      if (p === '/api/me/generate' && m === 'POST') { const prog = generateProgram(db, me, body); return ok({ ...homeFor(db, me, t, ctx), generated: prog.id }); }
      if (p === '/api/me/chat' && m === 'GET') { (me.chat || []).forEach((x) => { if (x.from === 'g') x.read = true; }); return ok({ messages: me.chat || [] }); }
      if (p === '/api/me/chat' && m === 'POST') {
        const tx = text(body.text, 1000); if (!tx) return no(400, 'Scrie mesajul.');
        me.chat = me.chat || []; me.chat.push({ id: ctx.uid('ms'), from: 'm', text: tx, at: ctx.nowISO(), read: false }); if (me.chat.length > 300) me.chat.splice(0, me.chat.length - 300);
        return ok({ messages: me.chat }, 201);
      }
      if (p === '/api/me/password' && m === 'PUT') {
        if (!ctx.check(String(body.old || ''), me.pass)) return no(400, 'Parola actuală nu e corectă.');
        if (String(body.new || '').length < 4) return no(400, 'Parola nouă trebuie să aibă minim 4 caractere.');
        me.pass = ctx.hash(String(body.new)); return ok({ ok: true });
      }
      if (p === '/api/me/challenge' && m === 'POST') { me.challenges = me.challenges || {}; me.challenges[t] = !!body.done; return ok(homeFor(db, me, t, ctx)); }
      if (p === '/api/me/checkin' && m === 'POST') {
        if (String(body.code || '').trim() !== String(db.settings.checkinCode)) return no(400, 'Codul nu e corect. Îl găsești la recepție.');
        me.checkins = me.checkins || []; if (!me.checkins.includes(t)) { me.checkins.push(t); me.ciAt = me.ciAt || {}; me.ciAt[t] = ctx.time ? ctx.time() : ''; }
        return ok(homeFor(db, me, t, ctx));
      }
      if (p === '/api/me/workout' && m === 'POST') {
        const prog = db.programs.find((x) => x.id === body.programId);
        const sets = (Array.isArray(body.sets) ? body.sets : []).slice(0, 200).map((x) => ({ ex: clean(x.ex, 40), set: num(x.set, 1, 20), reps: num(x.reps, 0, 500), kg: num(x.kg, 0, 1000) })).filter((x) => x.ex);
        me.workouts = me.workouts || [];
        me.workouts.push({ id: ctx.uid('wo'), date: isDate(body.date) ? body.date : t, programId: prog ? prog.id : '', dayIdx: num(body.dayIdx, 0, 20) || 0, title: clean(body.title, 80), duration: num(body.duration, 0, 600) || 0, sets, note: clean(body.note, 300) });
        me.workouts.sort((a, b) => a.date.localeCompare(b.date));
        return ok(homeFor(db, me, t, ctx), 201);
      }
      if ((r = /^\/api\/me\/workout\/(\w+)$/.exec(p)) && m === 'DELETE') { me.workouts = (me.workouts || []).filter((w) => w.id !== r[1]); return ok(homeFor(db, me, t, ctx)); }
      if (p === '/api/me/weight' && m === 'POST') {
        const kg = num(body.kg, 25, 300); if (!kg) return no(400, 'Scrie greutatea în kg.');
        const d = isDate(body.date) ? body.date : t; me.weights = (me.weights || []).filter((w) => w.date !== d); me.weights.push({ date: d, kg }); me.weights.sort((a, b) => a.date.localeCompare(b.date));
        return ok(homeFor(db, me, t, ctx));
      }
      if (p === '/api/me/measure' && m === 'POST') {
        const x = { date: isDate(body.date) ? body.date : t }; let any = false;
        for (const k of ['chest', 'waist', 'hips', 'arm', 'thigh', 'bodyFat']) { const v = num(body[k], 1, 300); if (v) { x[k] = v; any = true; } }
        if (!any) return no(400, 'Completează cel puțin o măsurătoare.');
        me.measures = (me.measures || []).filter((w) => w.date !== x.date); me.measures.push(x); me.measures.sort((a, b) => a.date.localeCompare(b.date));
        return ok(homeFor(db, me, t, ctx));
      }
      if (p === '/api/me/photo' && m === 'POST') {
        if (!body.file) return no(400, 'Alege o poză.');
        me.photos = me.photos || []; me.photos.push({ id: ctx.uid('ph'), date: t, file: String(body.file), note: clean(body.note, 80) });
        return ok(homeFor(db, me, t, ctx), 201);
      }
      if ((r = /^\/api\/me\/photo\/(\w+)$/.exec(p)) && m === 'DELETE') { const ph = (me.photos || []).find((x) => x.id === r[1]); me.photos = (me.photos || []).filter((x) => x.id !== r[1]); return ok({ ...homeFor(db, me, t, ctx), removed: ph ? ph.file : null }); }
      if (p === '/api/me/meal' && m === 'POST') {
        me.meals = me.meals || {}; const d = isDate(body.date) ? body.date : t, i = num(body.idx, 0, 20);
        const set = new Set(me.meals[d] || []); body.done ? set.add(i) : set.delete(i); me.meals[d] = [...set];
        return ok(homeFor(db, me, t, ctx));
      }
      if (p === '/api/me/program' && m === 'POST') { if (!db.programs.some((x) => x.id === body.programId && (!x.owner || x.owner === me.id))) return no(400, 'Program inexistent.'); me.programId = body.programId; return ok(homeFor(db, me, t, ctx)); }
      if (p === '/api/me/nutrition' && m === 'POST') { if (!db.nutrition.some((x) => x.id === body.nutritionId)) return no(400, 'Plan inexistent.'); me.nutritionId = body.nutritionId; return ok(homeFor(db, me, t, ctx)); }
      if (p === '/api/me/notifs' && m === 'GET') return ok({ notifs: (me.notifs || []).slice().reverse() });
      if (p === '/api/me/notifs/read' && m === 'POST') { (me.notifs || []).forEach((n) => (n.read = true)); return ok({ ok: true }); }
      if (p === '/api/me/push' && m === 'POST') {
        const sub = body.subscription; if (!sub || !sub.endpoint || !sub.keys) return no(400, 'Abonare invalidă.');
        me.push = (me.push || []).filter((x) => x.endpoint !== sub.endpoint); me.push.push({ endpoint: String(sub.endpoint).slice(0, 600), keys: { p256dh: String(sub.keys.p256dh).slice(0, 200), auth: String(sub.keys.auth).slice(0, 60) } });
        if (me.push.length > 5) me.push.shift();
        return ok({ ok: true });
      }
      if (p === '/api/me/push' && m === 'DELETE') { me.push = (me.push || []).filter((x) => x.endpoint !== body.endpoint); return ok({ ok: true }); }
      if (p === '/api/me/booking' && m === 'POST') {
        const sv = db.services.find((x) => x.id === body.serviceId); if (!sv) return no(400, 'Alege serviciul.');
        if (!isDate(body.date) || body.date < t) return no(400, 'Alege o dată de azi încolo.');
        if (!/^\d{2}:\d{2}$/.test(body.time || '')) return no(400, 'Alege ora.');
        if (db.bookings.some((b) => b.date === body.date && b.time === body.time && b.status !== 'anulat')) return no(409, 'Ora asta e deja ocupată. Alege alta.');
        db.bookings.push({ id: ctx.uid('bk'), memberId: me.id, serviceId: sv.id, date: body.date, time: body.time, status: 'pending', note: clean(body.note, 200), createdAt: t });
        return ok(homeFor(db, me, t, ctx), 201);
      }
      if ((r = /^\/api\/me\/booking\/(\w+)$/.exec(p)) && m === 'DELETE') { const b = db.bookings.find((x) => x.id === r[1] && x.memberId === me.id); if (b) b.status = 'anulat'; return ok(homeFor(db, me, t, ctx)); }
      if (p === '/api/me/redeem' && m === 'POST') {
        const rw = db.rewards.find((x) => x.id === body.rewardId); if (!rw) return no(400, 'Premiu inexistent.');
        if (pointsOf(db, me, t).balance < rw.points) return no(400, 'Nu ai încă destule puncte.');
        db.redemptions.push({ id: ctx.uid('rd'), memberId: me.id, rewardId: rw.id, name: rw.name, points: rw.points, at: t, status: 'nou' });
        return ok(homeFor(db, me, t, ctx), 201);
      }
      return no(404, 'Nu există.');
    }

    /* ======== ADMIN ======== */
    if (!p.startsWith('/api/admin')) return no(404, 'Nu există.');
    if (!s || s.role !== 'admin') return no(401, 'Intră ca administrator.');
    const A = '/api/admin';
    if (p === A + '/overview' && m === 'GET') {
      const rows = db.members.map((x) => memberRow(db, x, t));
      return ok({
        stats: stats(db, t), checkinCode: db.settings.checkinCode, settings: db.settings,
        expiring: rows.filter((x) => x.state === 'expiring').sort((a, b) => a.daysLeft - b.daysLeft),
        expired: rows.filter((x) => x.state === 'expired' && x.daysLeft >= -60).sort((a, b) => b.daysLeft - a.daysLeft),
        idle7: rows.filter((x) => (x.state === 'active' || x.state === 'expiring') && x.idle !== null && x.idle >= 7 && x.idle <= 14).sort((a, b) => b.idle - a.idle),
        idle14: rows.filter((x) => (x.state === 'active' || x.state === 'expiring') && (x.idle === null || x.idle > 14)).sort((a, b) => (b.idle || 999) - (a.idle || 999)),
        todayVisits: rows.filter((x) => x.ciToday || x.lastActive === t).sort((a, b) => String(b.ciToday || '').localeCompare(String(a.ciToday || ''))),
        chatUnread: db.members.reduce((a, x) => a + (x.chat || []).filter((y) => y.from === 'm' && !y.read).length, 0),
        reports: reports(db, t),
        bookings: db.bookings.filter((b) => b.date >= t && b.status !== 'anulat').sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)).slice(0, 20).map((b) => ({ ...b, member: (db.members.find((x) => x.id === b.memberId) || {}).name, service: (db.services.find((x) => x.id === b.serviceId) || {}).name })),
        redemptions: db.redemptions.filter((x) => x.status === 'nou').map((x) => ({ ...x, member: (db.members.find((y) => y.id === x.memberId) || {}).name })),
        daily: dailyFor(db, t), dailyScheduled: Object.keys(db.daily).filter((d) => d >= t).length,
      });
    }
    if (p === A + '/members' && m === 'GET') {
      const qq = clean(q.q, 60).toLowerCase(), rows = db.members.map((x) => memberRow(db, x, t)).filter((x) => !qq || x.name.toLowerCase().includes(qq) || phoneKey(x.phone).includes(qq.replace(/\D/g, '') || '§'));
      const f = q.filter; const fl = f === 'active' ? rows.filter((x) => x.state === 'active' || x.state === 'expiring') : f === 'expiring' ? rows.filter((x) => x.state === 'expiring') : f === 'expired' ? rows.filter((x) => x.state === 'expired' || x.state === 'none') : f === 'idle' ? rows.filter((x) => x.idle === null || x.idle >= 7) : rows;
      return ok({ members: fl.sort((a, b) => a.name.localeCompare(b.name, 'ro')), tags: [...new Set(db.members.flatMap((x) => x.tags || []))] });
    }
    if (p === A + '/members' && m === 'POST') {
      const k = phoneKey(body.phone); if (db.members.some((x) => phoneKey(x.phone) === k)) return no(409, 'Există deja un membru cu acest telefon.');
      const mem = { id: ctx.uid('mb'), name: '', phone: '', email: '', pass: '', birth: '', sex: '', height: null, goal: '', targetWeight: null, level: 'începător', notes: '', tags: [], createdAt: t, programId: db.programs[0] ? db.programs[0].id : '', nutritionId: '', sub: {}, payments: [], weights: [], measures: [], photos: [], workouts: [], checkins: [], challenges: {}, meals: {}, push: [], notifs: [], redeemed: [], weekGoal: 3 };
      const e = memberInput(body, mem); if (e) return no(400, e);
      const pw = String(body.password || '').trim() || phoneKey(mem.phone).slice(-4);
      mem.pass = ctx.hash(pw); mem.tags = (Array.isArray(body.tags) ? body.tags : String(body.tags || '').split(',')).map((x) => clean(x, 30)).filter(Boolean);
      if (body.planId) { const e2 = addPayment(db, mem, t, ctx, body); if (e2) return no(400, e2); }
      if (body.weight) { const kg = num(body.weight, 25, 300); if (kg) mem.weights.push({ date: t, kg }); }
      db.members.push(mem);
      notify(db, ctx, [mem], `Bine ai venit la ${db.settings.name}! 💪`, 'Aici îți vezi abonamentul, antrenamentele, progresul și provocarea zilei.', 'bun-venit');
      return ok({ member: memberFull(db, mem, t), password: pw }, 201);
    }
    if ((r = /^\/api\/admin\/members\/(\w+)(\/.*)?$/.exec(p))) {
      const mem = db.members.find((x) => x.id === r[1]); if (!mem) return no(404, 'Membrul nu există.');
      const sub = r[2] || '';
      if (!sub && m === 'GET') return ok({ member: memberFull(db, mem, t), bookings: db.bookings.filter((b) => b.memberId === mem.id) });
      if (!sub && m === 'PUT') {
        if (body.phone && phoneKey(body.phone) !== phoneKey(mem.phone) && db.members.some((x) => phoneKey(x.phone) === phoneKey(body.phone))) return no(409, 'Telefonul e folosit de alt membru.');
        const e = memberInput(body, mem); if (e) return no(400, e);
        if (body.notes !== undefined) mem.notes = text(body.notes, 1000);
        if (body.tags !== undefined) mem.tags = (Array.isArray(body.tags) ? body.tags : String(body.tags).split(',')).map((x) => clean(x, 30)).filter(Boolean);
        if (body.programId !== undefined) mem.programId = body.programId;
        if (body.nutritionId !== undefined) mem.nutritionId = body.nutritionId;
        if (body.subEnd !== undefined && isDate(body.subEnd)) { mem.sub = { ...(mem.sub || {}), end: body.subEnd, start: (mem.sub && mem.sub.start) || t }; mem.expiryNotified = {}; }
        let pw = null; if (body.resetPassword) { pw = String(body.password || '').trim() || phoneKey(mem.phone).slice(-4); mem.pass = ctx.hash(pw); }
        return ok({ member: memberFull(db, mem, t), password: pw });
      }
      if (!sub && m === 'DELETE') { db.members = db.members.filter((x) => x.id !== mem.id); db.bookings = db.bookings.filter((b) => b.memberId !== mem.id); return ok({ ok: true, files: (mem.photos || []).map((x) => x.file) }); }
      if (sub === '/payment' && m === 'POST') { const e = addPayment(db, mem, t, ctx, body); if (e) return no(400, e); notify(db, ctx, [mem], 'Abonament activ ✅', `Abonamentul tău e valabil până pe ${mem.sub.end.split('-').reverse().join('.')}. Spor la antrenamente!`, 'abonament'); return ok({ member: memberFull(db, mem, t) }, 201); }
      if ((r = /^\/payment\/(\w+)$/.exec(sub)) && m === 'DELETE') { mem.payments = (mem.payments || []).filter((x) => x.id !== r[1]); return ok({ member: memberFull(db, mem, t) }); }
      if (sub === '/checkin' && m === 'POST') { mem.checkins = mem.checkins || []; const already = mem.checkins.includes(t); if (!already) { mem.checkins.push(t); mem.ciAt = mem.ciAt || {}; mem.ciAt[t] = ctx.time ? ctx.time() : ''; } return ok({ member: memberFull(db, mem, t), already }); }
      if (sub === '/notify' && m === 'POST') { const title = clean(body.title, 80), b = text(body.body, 500); if (!title || !b) return no(400, 'Scrie titlul și mesajul.'); return ok(notify(db, ctx, [mem], title, b)); }
      return no(404, 'Nu există.');
    }
    if (p === A + '/chats' && m === 'GET') {
      const th = db.members.filter((x) => (x.chat || []).length).map((x) => { const last = x.chat[x.chat.length - 1]; return { id: x.id, name: x.name, phone: x.phone, last: last.text, from: last.from, at: last.at, unread: x.chat.filter((y) => y.from === 'm' && !y.read).length }; }).sort((a, b) => b.at.localeCompare(a.at));
      return ok({ threads: th });
    }
    if ((r = /^\/api\/admin\/chats\/(\w+)$/.exec(p))) {
      const mem = db.members.find((x) => x.id === r[1]); if (!mem) return no(404, 'Membrul nu există.');
      if (m === 'GET') { (mem.chat || []).forEach((x) => { if (x.from === 'm') x.read = true; }); return ok({ messages: mem.chat || [], member: memberRow(db, mem, t) }); }
      if (m === 'POST') {
        const tx = text(body.text, 1000); if (!tx) return no(400, 'Scrie mesajul.');
        mem.chat = mem.chat || []; mem.chat.push({ id: ctx.uid('ms'), from: 'g', text: tx, at: ctx.nowISO(), read: false });
        if (ctx.push && (mem.push || []).length) ctx.push(mem, { title: `Mesaj de la ${db.settings.name}`, body: tx.slice(0, 160), url: '/app.html#chat', tag: 'chat' });
        return ok({ messages: mem.chat }, 201);
      }
    }
    if (p === A + '/payments' && m === 'GET') {
      const mo = /^\d{4}-\d{2}$/.test(q.month || '') ? q.month : monthOf(t);
      const list = db.members.flatMap((x) => (x.payments || []).map((pa) => ({ ...pa, memberId: x.id, name: x.name, plan: (db.plans.find((pl) => pl.id === pa.planId) || {}).name }))).filter((pa) => monthOf(pa.date) === mo).sort((a, b) => b.date.localeCompare(a.date));
      const unpaid = db.members.map((x) => memberRow(db, x, t)).filter((x) => x.state === 'expired').sort((a, b) => b.daysLeft - a.daysLeft);
      const byMethod = {}; list.forEach((pa) => (byMethod[pa.method] = (byMethod[pa.method] || 0) + Number(pa.amount)));
      return ok({ month: mo, payments: list, total: list.reduce((a, x) => a + Number(x.amount), 0), byMethod, unpaid });
    }
    if (p === A + '/settings' && m === 'PUT') {
      const st = db.settings;
      for (const k of ['name', 'tagline', 'phone', 'email', 'address', 'mapsUrl', 'instagram', 'facebook']) if (body[k] !== undefined) st[k] = clean(body[k], 200);
      if (body.whatsapp !== undefined) st.whatsapp = String(body.whatsapp).replace(/\D/g, '').replace(/^0/, '40');
      if (body.accent && /^#[0-9a-f]{6}$/i.test(body.accent)) st.accent = body.accent;
      if (body.dailyHour !== undefined) st.dailyHour = num(body.dailyHour, 0, 23) || 0;
      if (Array.isArray(body.hours)) st.hours = body.hours.slice(0, 7).map((h) => ({ d: clean(h.d, 40), h: clean(h.h, 40) })).filter((h) => h.d);
      return ok({ settings: st });
    }
    if (p === A + '/checkin-code' && m === 'POST') { db.settings.checkinCode = String(1000 + Math.floor(ctx.rand() * 9000)); db.settings.checkinDate = t; return ok({ code: db.settings.checkinCode }); }
    if (p === A + '/password' && m === 'PUT') {
      if (!ctx.check(String(body.old || ''), db.admin)) return no(400, 'Parola actuală e greșită.');
      if (String(body.new || '').length < 6) return no(400, 'Minim 6 caractere.');
      db.admin = ctx.hash(String(body.new)); return ok({ ok: true });
    }
    if (p === A + '/notify' && m === 'POST') {
      const title = clean(body.title, 80), b = text(body.body, 500);
      if (!title || !b) return no(400, 'Scrie titlul și mesajul.');
      const list = targetMembers(db, t, body.target || 'all', body.ids);
      if (!list.length) return no(400, 'Niciun membru în grupul ales.');
      const res = notify(db, ctx, list, title, b, 'mesaj');
      db.sent.unshift({ id: ctx.uid('sn'), title, body: b, target: body.target || 'all', count: res.count, pushed: res.pushed, at: ctx.nowISO() }); db.sent = db.sent.slice(0, 100);
      return ok(res);
    }
    if (p === A + '/notify' && m === 'GET') return ok({ sent: db.sent, tags: [...new Set(db.members.flatMap((x) => x.tags || []))], counts: Object.fromEntries(['all', 'active', 'expiring', 'expired', 'inactive'].map((k) => [k, targetMembers(db, t, k).length])) });
    if (p === A + '/daily' && m === 'GET') {
      const days = Math.min(120, num(q.days, 7, 120) || 45), from = isDate(q.from) ? q.from : t;
      return ok({ days: Array.from({ length: days }, (_, i) => { const d = add(from, i); return { date: d, custom: !!db.daily[d], ...dailyFor(db, d) }; }), library: db.dailyLib.length });
    }
    if ((r = /^\/api\/admin\/daily\/(\d{4}-\d{2}-\d{2})$/.exec(p))) {
      if (m === 'DELETE') { delete db.daily[r[1]]; return ok({ ok: true }); }
      if (m === 'PUT') { const quote = text(body.quote, 300), challenge = text(body.challenge, 200); if (!quote || !challenge) return no(400, 'Completează citatul și provocarea.'); db.daily[r[1]] = { quote, author: clean(body.author, 60), challenge }; return ok({ ok: true }); }
    }
    if (p === A + '/daily/fill' && m === 'POST') {
      const n = Math.min(120, num(body.days, 1, 120) || 30); let made = 0;
      for (let i = 0; i < n; i++) { const d = add(t, i); if (!db.daily[d]) { db.daily[d] = { ...dailyFor(db, d) }; made++; } }
      return ok({ made });
    }
    if (p === A + '/daily/lib' && m === 'POST') { const quote = text(body.quote, 300), challenge = text(body.challenge, 200); if (!quote || !challenge) return no(400, 'Completează citatul și provocarea.'); db.dailyLib.push({ quote, author: clean(body.author, 60), challenge }); return ok({ library: db.dailyLib.length }); }
    if (p === A + '/bookings' && m === 'GET') return ok({ bookings: db.bookings.slice().sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time)).map((b) => ({ ...b, member: (db.members.find((x) => x.id === b.memberId) || {}).name, phone: (db.members.find((x) => x.id === b.memberId) || {}).phone, service: (db.services.find((x) => x.id === b.serviceId) || {}).name })) });
    if ((r = /^\/api\/admin\/bookings\/(\w+)$/.exec(p)) && m === 'PUT') {
      const b = db.bookings.find((x) => x.id === r[1]); if (!b) return no(404, 'Nu există.');
      if (['pending', 'confirmed', 'anulat', 'done'].includes(body.status)) b.status = body.status;
      const mem = db.members.find((x) => x.id === b.memberId), sv = db.services.find((x) => x.id === b.serviceId);
      if (mem && body.status === 'confirmed') notify(db, ctx, [mem], 'Programare confirmată ✅', `${sv ? sv.name : 'Antrenament'} · ${b.date.split('-').reverse().join('.')} la ${b.time}. Te așteptăm!`, 'programare');
      if (mem && body.status === 'anulat') notify(db, ctx, [mem], 'Programare anulată', `Programarea din ${b.date.split('-').reverse().join('.')} la ${b.time} a fost anulată. Scrie-ne pentru altă oră.`, 'programare');
      return ok({ ok: true });
    }
    if ((r = /^\/api\/admin\/redemptions\/(\w+)$/.exec(p)) && m === 'PUT') { const x = db.redemptions.find((y) => y.id === r[1]); if (!x) return no(404, 'Nu există.'); if (['nou', 'acordat', 'refuzat'].includes(body.status)) x.status = body.status; return ok({ ok: true }); }

    /* liste simple: abonamente, anunțuri, servicii, premii, exerciții, programe, nutriție */
    const LISTS = {
      plans: ['pl', (b, x) => { x.name = clean(b.name, 60); x.price = num(b.price, 0, 1e6) || 0; x.days = num(b.days, 1, 3650) || 30; x.desc = clean(b.desc, 120); x.active = b.active !== false; if (!x.name) return 'Scrie numele.'; }],
      announcements: ['an', (b, x) => { x.title = clean(b.title, 100); x.body = text(b.body, 1500); x.type = ['program', 'noutate', 'oferta', 'eveniment'].includes(b.type) ? b.type : 'noutate'; x.date = isDate(b.date) ? b.date : x.date || ctx.today(); x.until = isDate(b.until) ? b.until : ''; x.pinned = !!b.pinned; if (!x.title || !x.body) return 'Completează titlul și textul.'; }],
      services: ['sv', (b, x) => { x.name = clean(b.name, 80); x.price = num(b.price, 0, 1e6) || 0; x.duration = num(b.duration, 10, 300) || 60; x.desc = clean(b.desc, 160); if (!x.name) return 'Scrie numele.'; }],
      rewards: ['rw', (b, x) => { x.name = clean(b.name, 80); x.points = num(b.points, 1, 1e6) || 100; x.desc = clean(b.desc, 120); if (!x.name) return 'Scrie numele.'; }],
      exercises: ['ex', (b, x) => { x.name = clean(b.name, 80); x.muscle = clean(b.muscle, 40); x.equipment = clean(b.equipment, 40); x.level = clean(b.level, 20); x.steps = (Array.isArray(b.steps) ? b.steps : String(b.steps || '').split('\n')).map((y) => clean(y, 300)).filter(Boolean).slice(0, 12); x.tip = clean(b.tip, 300); x.video = /^https?:\/\//.test(b.video || '') ? clean(b.video, 400) : 'https://www.youtube.com/results?search_query=' + encodeURIComponent(x.name + ' executie corecta'); if (!x.name) return 'Scrie numele.'; }],
      programs: ['pr', (b, x) => { x.name = clean(b.name, 80); x.goal = clean(b.goal, 60); x.level = clean(b.level, 20); x.desc = text(b.desc, 500); x.days = (Array.isArray(b.days) ? b.days : []).slice(0, 7).map((d) => ({ name: clean(d.name, 60), items: (Array.isArray(d.items) ? d.items : []).slice(0, 20).filter((i) => db.exercises.some((e) => e.id === i.ex)).map((i) => ({ ex: i.ex, sets: num(i.sets, 1, 20) || 3, reps: clean(i.reps, 20) || '10', kg: num(i.kg, 0, 1000) || 0, rest: num(i.rest, 0, 600) || 90 })) })).filter((d) => d.name); x.daysPerWeek = x.days.length; if (!x.name || !x.days.length) return 'Scrie numele și cel puțin o zi.'; }],
      nutrition: ['nu', (b, x) => { x.name = clean(b.name, 80); x.goal = clean(b.goal, 60); x.desc = text(b.desc, 400); x.meals = (Array.isArray(b.meals) ? b.meals : []).slice(0, 8).map((y) => ({ name: clean(y.name, 40), time: clean(y.time, 10), items: text(y.items, 300), kcal: num(y.kcal, 0, 5000) || 0, p: num(y.p, 0, 500) || 0, c: num(y.c, 0, 800) || 0, f: num(y.f, 0, 400) || 0 })).filter((y) => y.name); ['kcal', 'p', 'c', 'f'].forEach((k) => (x[k] = x.meals.reduce((a, y) => a + y[k], 0))); if (!x.name || !x.meals.length) return 'Scrie numele și cel puțin o masă.'; }],
    };
    if ((r = /^\/api\/admin\/(plans|announcements|services|rewards|exercises|programs|nutrition)(?:\/(\w+))?$/.exec(p))) {
      const [, key, id] = r, [pref, fill] = LISTS[key], list = db[key];
      if (!id && m === 'GET') return ok({ [key]: list });
      if (!id && m === 'POST') { const x = { id: ctx.uid(pref) }; const e = fill(body, x); if (e) return no(400, e); list.push(x); if (key === 'announcements' && body.notify) notify(db, ctx, targetMembers(db, t, 'active'), x.title, x.body.slice(0, 180), 'anunt'); return ok({ item: x }, 201); }
      const x = list.find((y) => y.id === id); if (!x) return no(404, 'Nu există.');
      if (m === 'PUT') { const e = fill({ ...x, ...body }, x); return e ? no(400, e) : ok({ item: x }); }
      if (m === 'DELETE') { db[key] = list.filter((y) => y.id !== id); return ok({ ok: true }); }
    }
    return no(404, 'Nu există.');
  }

  /* ---------- sarcini automate (pe server, la fiecare minut) ---------- */
  function jobs(db, ctx) {
    const t = ctx.today(), hour = ctx.hour(), st = db.settings; let dirty = false;
    // cod nou de check-in în fiecare zi
    if (st.checkinDate !== t) { st.checkinCode = String(1000 + Math.floor(ctx.rand() * 9000)); st.checkinDate = t; dirty = true; }
    // motivația zilei, ca notificare, la ora aleasă
    st.dailySent = st.dailySent || '';
    if (hour >= (st.dailyHour || 8) && st.dailySent !== t) {
      st.dailySent = t; dirty = true; const d = dailyFor(db, t);
      for (const m of db.members) if ((m.push || []).length && subOf(db, m, t).state !== 'expired' && ctx.push) ctx.push(m, { title: 'Motivația zilei 💪', body: `„${d.quote}” · Provocarea de azi: ${d.challenge}`, url: '/app.html', tag: 'daily' });
    }
    // reamintiri de expirare: cu 3 zile înainte și în ziua expirării
    if (hour >= 10) for (const m of db.members) {
      const s = subOf(db, m, t); if (!s.end) continue; m.expiryNotified = m.expiryNotified || {};
      const key = s.daysLeft === 3 ? 'd3' : s.daysLeft === 0 ? 'd0' : null;
      if (key && !m.expiryNotified[key + s.end]) {
        m.expiryNotified[key + s.end] = true; dirty = true;
        notify(db, ctx, [m], key === 'd3' ? 'Abonamentul expiră în 3 zile ⏳' : 'Abonamentul expiră azi', key === 'd3' ? `Abonamentul tău expiră pe ${s.end.split('-').reverse().join('.')}. Reînnoiește la recepție ca să nu pierzi seria!` : 'Treci pe la recepție să-l reînnoiești și continuă antrenamentele. 💪', 'abonament');
      }
    }
    return dirty;
  }
  return { route, jobs, subOf, add, diff, phoneKey, dailyFor };
});
