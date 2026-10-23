/* Elemente comune pentru aplicația membrilor și panoul de administrare. */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const MONTHS = ['ian.', 'feb.', 'mar.', 'apr.', 'mai', 'iun.', 'iul.', 'aug.', 'sept.', 'oct.', 'nov.', 'dec.'];
const MONTHS_L = ['Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie', 'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie'];
const DAYS = ['duminică', 'luni', 'marți', 'miercuri', 'joi', 'vineri', 'sâmbătă'];
const pd = (d) => new Date(d + 'T12:00:00');
const fdate = (d, year) => { if (!d) return '–'; const x = pd(d); return `${x.getDate()} ${MONTHS[x.getMonth()]}${year ? ' ' + x.getFullYear() : ''}`; };
const fday = (d) => { const x = pd(d); return `${DAYS[x.getDay()]}, ${x.getDate()} ${MONTHS[x.getMonth()]}`; };
const lei = (n) => `${Number(n || 0).toLocaleString('ro-RO')} lei`;
const todayStr = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const avUrl = (f) => (String(f).startsWith('data:') ? f : 'api/avatar/' + f);
/* avatar: poza de profil sau inițialele */
const avatarHtml = (name, file, cls = 'av') => file ? `<span class="${cls}" style="padding:0;overflow:hidden"><img src="${esc(avUrl(file))}" alt="" style="width:100%;height:100%;object-fit:cover;display:block"></span>` : `<span class="${cls}">${esc(String(name || '?').split(' ').map((x) => x[0]).join('').slice(0, 2).toUpperCase())}</span>`;
const galUrl = (f) => (String(f).startsWith('data:') ? f : 'api/gallery/' + f);
const photoUrl = (f) => (String(f).startsWith('data:') ? f : 'api/photo/' + f);
const waLink = (num, text) => `https://wa.me/${String(num || '').replace(/\D/g, '')}${text ? '?text=' + encodeURIComponent(text) : ''}`;

async function api(path, opt = {}) {
  if (window.GymDemo) return window.GymDemo.call(path, opt);
  const headers = {}; let body;
  if (opt.raw) { body = opt.raw; headers['Content-Type'] = opt.type || 'application/octet-stream'; }
  else if (opt.body !== undefined) { body = JSON.stringify(opt.body); headers['Content-Type'] = 'application/json'; }
  let r;
  try { r = await fetch(path, { method: opt.method || (body ? 'POST' : 'GET'), headers, body, credentials: 'same-origin' }); }
  catch { const e = new Error('Nu există conexiune la internet.'); e.status = 0; throw e; }
  const d = await r.json().catch(() => ({}));
  if (!r.ok) { const e = new Error(d.error || 'A apărut o eroare.'); e.status = r.status; throw e; }
  return d;
}

/* mesaj scurt jos pe ecran */
function toast(msg, kind) {
  let t = $('#toast'); if (!t) { t = document.createElement('div'); t.id = 'toast'; document.body.appendChild(t); }
  t.className = 'toast show ' + (kind || ''); t.innerHTML = msg; clearTimeout(toast._h); toast._h = setTimeout(() => (t.className = 'toast'), 2800);
}
/* fereastră care urcă de jos */
function sheet(html, opts = {}) {
  closeSheet();
  const w = document.createElement('div'); w.className = 'sheet-wrap'; w.id = 'sheet';
  w.innerHTML = `<div class="sheet-bg"></div><div class="sheet ${opts.wide ? 'wide' : ''}" role="dialog" aria-modal="true"><button class="sheet-x" aria-label="Închide">✕</button><div class="sheet-in">${html}</div></div>`;
  document.body.appendChild(w); document.body.classList.add('noscroll');
  requestAnimationFrame(() => w.classList.add('on'));
  $('.sheet-bg', w).onclick = closeSheet; $('.sheet-x', w).onclick = closeSheet;
  return $('.sheet-in', w);
}
function closeSheet() { const w = $('#sheet'); if (!w) return; w.classList.remove('on'); document.body.classList.remove('noscroll'); setTimeout(() => w.remove(), 250); }

/* confetti */
function confetti() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const c = document.createElement('canvas'); c.className = 'confetti'; document.body.appendChild(c);
  const x = c.getContext('2d'), W = (c.width = innerWidth * devicePixelRatio), H = (c.height = innerHeight * devicePixelRatio);
  const col = [getComputedStyle(document.documentElement).getPropertyValue('--acc') || '#D4FF3A', '#fff', '#7C5CFF', '#FF5A7A', '#FFC23D'];
  const P = Array.from({ length: 140 }, () => ({ x: W / 2, y: H * 0.35, vx: (Math.random() - 0.5) * 26, vy: -Math.random() * 26 - 8, r: 5 + Math.random() * 7, c: col[Math.floor(Math.random() * col.length)], a: Math.random() * 6, s: (Math.random() - 0.5) * 0.4 }));
  let n = 0; (function f() { x.clearRect(0, 0, W, H); P.forEach((p) => { p.vy += 0.8; p.x += p.vx; p.y += p.vy; p.vx *= 0.99; p.a += p.s; x.save(); x.translate(p.x, p.y); x.rotate(p.a); x.fillStyle = p.c; x.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2); x.restore(); }); if (++n < 110) requestAnimationFrame(f); else c.remove(); })();
}

/* grafic linie (SVG) */
function lineChart(points, o = {}) {
  if (!points.length) return `<div class="empty-chart">${o.empty || 'Încă nu sunt date'}</div>`;
  const W = 600, H = o.h || 220, P = { l: 44, r: 16, t: 18, b: 30 };
  const vals = points.map((p) => p.v).concat(o.target != null ? [o.target] : []);
  let min = Math.min(...vals), max = Math.max(...vals); if (min === max) { min -= 1; max += 1; } const pad = (max - min) * 0.15; min -= pad; max += pad; if (o.min != null) min = Math.max(min, o.min);
  const X = (i) => P.l + (points.length === 1 ? (W - P.l - P.r) / 2 : (i / (points.length - 1)) * (W - P.l - P.r)), Y = (v) => P.t + (1 - (v - min) / (max - min)) * (H - P.t - P.b);
  const d = points.map((p, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)},${Y(p.v).toFixed(1)}`).join(' ');
  const area = `${d} L${X(points.length - 1)},${H - P.b} L${X(0)},${H - P.b} Z`;
  const ticks = [0, 0.5, 1].map((k) => min + (max - min) * k);
  const lab = points.length > 1 ? [0, Math.floor((points.length - 1) / 2), points.length - 1] : [0];
  const id = 'g' + Math.random().toString(36).slice(2, 7);
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(o.label || 'grafic')}">
    <defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--acc)" stop-opacity=".35"/><stop offset="1" stop-color="var(--acc)" stop-opacity="0"/></linearGradient></defs>
    ${ticks.map((v) => `<line x1="${P.l}" x2="${W - P.r}" y1="${Y(v)}" y2="${Y(v)}" class="grid"/><text x="${P.l - 8}" y="${Y(v) + 4}" class="ax" text-anchor="end">${Math.round(v * 10) / 10}</text>`).join('')}
    ${o.target != null ? `<line x1="${P.l}" x2="${W - P.r}" y1="${Y(o.target)}" y2="${Y(o.target)}" class="target"/><text x="${W - P.r}" y="${Y(o.target) - 6}" class="ax tgt" text-anchor="end">obiectiv ${o.target}</text>` : ''}
    <path d="${area}" fill="url(#${id})"/><path d="${d}" class="line"/>
    ${points.map((p, i) => `<circle cx="${X(i)}" cy="${Y(p.v)}" r="${i === points.length - 1 ? 6 : 3.5}" class="dot${i === points.length - 1 ? ' last' : ''}"><title>${esc(p.l)}: ${p.v}</title></circle>`).join('')}
    ${lab.map((i) => `<text x="${X(i)}" y="${H - 8}" class="ax" text-anchor="${i === 0 && points.length > 1 ? 'start' : i === points.length - 1 && points.length > 1 ? 'end' : 'middle'}">${esc(points[i].l)}</text>`).join('')}
  </svg>`;
}
/* grafic bare (SVG) */
function barChart(items, o = {}) {
  const W = 600, H = o.h || 220, P = { l: 10, r: 10, t: 26, b: 30 }, max = Math.max(1, ...items.map((x) => x.v)), bw = (W - P.l - P.r) / items.length;
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(o.label || 'grafic')}">${items.map((x, i) => { const h = ((H - P.t - P.b) * x.v) / max, X = P.l + i * bw + bw * 0.18, last = i === items.length - 1; return `<rect x="${X}" y="${H - P.b - h}" width="${bw * 0.64}" height="${Math.max(h, 2)}" rx="8" class="${last ? 'bar last' : 'bar'}"><title>${esc(x.l)}: ${x.v}</title></rect><text x="${X + bw * 0.32}" y="${H - P.b - h - 8}" class="ax val" text-anchor="middle">${esc(o.fmt ? o.fmt(x.v) : x.v)}</text><text x="${X + bw * 0.32}" y="${H - 8}" class="ax" text-anchor="middle">${esc(x.l)}</text>`; }).join('')}</svg>`;
}
/* inel de progres */
function ring(pct, label, sub, size = 120) {
  const r = 50, c = 2 * Math.PI * r, v = Math.max(0, Math.min(1, pct));
  return `<div class="ring" style="width:${size}px;height:${size}px"><svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="${r}" class="ring-bg"/><circle cx="60" cy="60" r="${r}" class="ring-fg" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - v)}"/></svg><div class="ring-t"><b>${label}</b>${sub ? `<small>${sub}</small>` : ''}</div></div>`;
}
/* aplică culoarea sălii */
function applyAccent(hex) { if (/^#[0-9a-f]{6}$/i.test(hex || '')) document.documentElement.style.setProperty('--acc', hex); }
/* stocare locală sigură (în unele browsere poate fi blocată) */
const LS = { get(k) { try { return localStorage.getItem(k); } catch { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch {} }, del(k) { try { localStorage.removeItem(k); } catch {} } };
/* iconiță SVG (din fig.js) */
const IC = (n, s, c) => (window.GymFig ? GymFig.icon(n, s, c) : '');
/* confirmare în pagină (confirm() nu merge peste tot) */
function ask(title, text, ok = 'Da', o = {}) {
  return new Promise((res) => {
    let done = false; const fin = (v) => { if (done) return; done = true; res(v); closeSheet(); };
    const el = sheet(`<div class="ask"><div class="big ${o.danger ? 'bad' : ''}">${IC(o.icon || (o.danger ? 'trash' : 'info'), 30)}</div><h2 style="padding:0">${esc(title)}</h2>${text ? `<p class="muted">${esc(text)}</p>` : ''}<div class="row"><button class="btn btn-ghost" id="askN">Renunță</button><button class="btn ${o.danger ? 'btn-red' : 'btn-acc'}" id="askY">${esc(ok)}</button></div></div>`);
    $('#askY', el).onclick = () => fin(true); $('#askN', el).onclick = () => fin(false);
    const w = $('#sheet'); $('.sheet-bg', w).onclick = () => fin(false); $('.sheet-x', w).onclick = () => fin(false);
  });
}
/* numerele cresc animat până la valoarea finală */
function countUp(root) {
  const red = matchMedia('(prefers-reduced-motion: reduce)').matches;
  $$('[data-count]', root || document).forEach((el) => {
    const to = Number(el.dataset.count), dec = String(el.dataset.count).includes('.') ? 1 : 0; if (!Number.isFinite(to)) return;
    if (red || to === 0) { el.textContent = to.toLocaleString('ro-RO', { minimumFractionDigits: dec, maximumFractionDigits: dec }); return; }
    const t0 = performance.now(), dur = 900;
    const step = (now) => { const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3); el.textContent = (to * e).toLocaleString('ro-RO', { minimumFractionDigits: dec, maximumFractionDigits: dec }); if (k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  });
}
/* grafic inel (donut) pentru împărțiri */
function donut(items, o = {}) {
  const tot = items.reduce((a, x) => a + x.v, 0) || 1, R = 46, C = 2 * Math.PI * R; let acc = 0;
  const cols = o.colors || ['var(--acc)', 'var(--vio)', 'var(--amber)', 'var(--green)', 'var(--red)', '#5E5E6B'];
  return `<div class="donut"><svg viewBox="0 0 120 120" role="img" aria-label="${esc(o.label || 'împărțire')}"><circle cx="60" cy="60" r="${R}" fill="none" stroke="var(--card2)" stroke-width="16"/>${items.map((x, i) => { const len = (x.v / tot) * C, s = `<circle cx="60" cy="60" r="${R}" fill="none" stroke="${cols[i % cols.length]}" stroke-width="16" stroke-dasharray="${Math.max(0, len - 2)} ${C}" stroke-dashoffset="${-acc}" transform="rotate(-90 60 60)"><title>${esc(x.l)}: ${x.v}</title></circle>`; acc += len; return s; }).join('')}<text x="60" y="58" text-anchor="middle" class="dn-v">${o.center != null ? o.center : tot}</text><text x="60" y="74" text-anchor="middle" class="dn-l">${esc(o.sub || '')}</text></svg>
    <div class="dn-leg">${items.map((x, i) => `<div><i style="background:${cols[i % cols.length]}"></i><span>${esc(x.l)}</span><b>${x.v}</b></div>`).join('')}</div></div>`;
}
