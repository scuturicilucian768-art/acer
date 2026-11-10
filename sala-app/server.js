'use strict';
/*
 * Aplicația sălii de fitness — membri + panou de administrare.
 * Node.js 18+, fără dependențe.
 *
 * Variabile de mediu:
 *   PORT, DATA_DIR (implicit ./data — pe Railway pune un Volume și DATA_DIR=/data)
 *   ADMIN_PASSWORD   opțional: parola panoului (altfel o alegi la prima deschidere a /admin)
 *   PUSH_CONTACT     email pentru serviciile de notificări (ex: mailto:sala@exemplu.ro)
 *   SEED_DEMO=1      creează membri demonstrativi (doar pentru prezentare)
 *   ANTHROPIC_API_KEY opțional: Robo din Mesaje răspunde cu AI (Claude). Fără cheie, Robo răspunde din baza lui de cunoștințe.
 *   ROBO_MODEL       opțional: modelul folosit (implicit claude-haiku-4-5-20251001)
 *   OPENAI_API_KEY   opțional: membrii își fac „caracterul AI” dintr-o poză (OpenAI, generare de imagini).
 *   AI_IMAGE_MODEL   opțional: modelul de imagini (implicit gpt-image-1.5)
 *   AI_IMAGE_QUALITY opțional: low / medium / high (implicit medium; low e de ~5 ori mai ieftin)
 */
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const Core = require('./public/core.js');
const Seed = require('./public/seed.js');

const PORT = Number(process.env.PORT) || 3000;
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const UPLOADS = path.join(DATA_DIR, 'photos');
const GALLERY = path.join(DATA_DIR, 'gallery');
const AVATARS = path.join(DATA_DIR, 'avatars');
const PUBLIC = path.join(__dirname, 'public');
const TZ = 'Europe/Bucharest';

/* ---------- utilitare ---------- */
function today() { const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date()).map((x) => [x.type, x.value])); return `${p.year}-${p.month}-${p.day}`; }
function hhmm() { return new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date()); }
function hour() { return Number(new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour: '2-digit', hourCycle: 'h23' }).format(new Date())); }
function hash(pw) { const salt = crypto.randomBytes(16); return salt.toString('hex') + ':' + crypto.scryptSync(String(pw), salt, 64).toString('hex'); }
function check(pw, stored) { if (!stored || !pw) return false; const [salt, h] = stored.split(':'); try { return crypto.timingSafeEqual(crypto.scryptSync(String(pw), Buffer.from(salt, 'hex'), 64), Buffer.from(h, 'hex')); } catch { return false; } }
const b64u = (buf) => Buffer.from(buf).toString('base64url');

/* ---------- baza de date (fișier JSON) ---------- */
let db; let timer = null;
const baseCtx = { today, hour, time: hhmm, nowISO: () => new Date().toISOString(), uid: (p) => p + '_' + crypto.randomBytes(6).toString('hex'), rand: () => crypto.randomInt(1e9) / 1e9, hash, check };
function load() {
  fs.mkdirSync(UPLOADS, { recursive: true }); fs.mkdirSync(GALLERY, { recursive: true }); fs.mkdirSync(AVATARS, { recursive: true });
  
  if (fs.existsSync(DB_FILE)) db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  else { db = Seed.base(baseCtx); if (process.env.SEED_DEMO === '1') Seed.demo(db, baseCtx); }
  Seed.upgrade(db);
  if (!db.secret) db.secret = crypto.randomBytes(32).toString('hex');
  if (!db.admin && process.env.ADMIN_PASSWORD) db.admin = hash(process.env.ADMIN_PASSWORD);
  if (!db.vapid) { // chei pentru notificările push (generate o singură dată)
    const ec = crypto.createECDH('prime256v1'); ec.generateKeys();
    db.vapid = { pub: b64u(ec.getPublicKey()), priv: b64u(ec.getPrivateKey()) };
  }
  flush();
}
function flush() { fs.writeFileSync(DB_FILE + '.tmp', JSON.stringify(db)); fs.renameSync(DB_FILE + '.tmp', DB_FILE); }
const save = () => { clearTimeout(timer); timer = setTimeout(flush, 60); };

/* ---------- Web Push (RFC 8291 + VAPID), fără biblioteci ---------- */
function vapidKey() {
  const pub = Buffer.from(db.vapid.pub, 'base64url');
  return crypto.createPrivateKey({ key: { kty: 'EC', crv: 'P-256', d: db.vapid.priv, x: b64u(pub.subarray(1, 33)), y: b64u(pub.subarray(33, 65)) }, format: 'jwk' });
}
function hkdf(salt, ikm, info, len) { return Buffer.from(crypto.hkdfSync('sha256', ikm, salt, info, len)); }
function encryptPush(sub, payload) {
  const uaPub = Buffer.from(sub.keys.p256dh, 'base64url'), auth = Buffer.from(sub.keys.auth, 'base64url');
  const ec = crypto.createECDH('prime256v1'); ec.generateKeys();
  const asPub = ec.getPublicKey(), shared = ec.computeSecret(uaPub), salt = crypto.randomBytes(16);
  const ikm = hkdf(auth, shared, Buffer.concat([Buffer.from('WebPush: info\0'), uaPub, asPub]), 32);
  const cek = hkdf(salt, ikm, Buffer.from('Content-Encoding: aes128gcm\0'), 16);
  const nonce = hkdf(salt, ikm, Buffer.from('Content-Encoding: nonce\0'), 12);
  const c = crypto.createCipheriv('aes-128-gcm', cek, nonce);
  const body = Buffer.concat([c.update(Buffer.concat([Buffer.from(payload), Buffer.from([2])])), c.final(), c.getAuthTag()]);
  const head = Buffer.alloc(21); salt.copy(head, 0); head.writeUInt32BE(4096, 16); head[20] = asPub.length;
  return Buffer.concat([head, asPub, body]);
}
function vapidAuth(endpoint) {
  const aud = new URL(endpoint).origin;
  const h = b64u(JSON.stringify({ typ: 'JWT', alg: 'ES256' })), p = b64u(JSON.stringify({ aud, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: process.env.PUSH_CONTACT || 'mailto:contact@example.com' }));
  const sig = crypto.sign('sha256', Buffer.from(h + '.' + p), { key: vapidKey(), dsaEncoding: 'ieee-p1363' });
  return `vapid t=${h}.${p}.${b64u(sig)}, k=${db.vapid.pub}`;
}
function sendPush(member, data) {
  for (const sub of (member.push || []).slice()) {
    let body; try { body = encryptPush(sub, JSON.stringify(data)); } catch { continue; }
    const u = new URL(sub.endpoint);
    const req = https.request({ method: 'POST', hostname: u.hostname, path: u.pathname + u.search, headers: { TTL: '86400', Urgency: 'normal', 'Content-Encoding': 'aes128gcm', 'Content-Type': 'application/octet-stream', 'Content-Length': body.length, Authorization: vapidAuth(sub.endpoint) } }, (res) => {
      res.resume();
      if (res.statusCode === 404 || res.statusCode === 410) { member.push = (member.push || []).filter((x) => x.endpoint !== sub.endpoint); save(); }
    });
    req.on('error', () => {}); req.setTimeout(15000, () => req.destroy()); req.end(body);
  }
}
const ctx = { ...baseCtx, push: sendPush, aiImg: !!process.env.OPENAI_API_KEY, get vapidPublic() { return db.vapid.pub; } };

/* ---------- sesiuni (cookie semnat) ---------- */
function sign(o) { const b = b64u(JSON.stringify(o)); return b + '.' + crypto.createHmac('sha256', db.secret).update(b).digest('base64url'); }
function readSession(req) {
  const m = /(?:^|;\s*)gid=([^;]+)/.exec(req.headers.cookie || ''); if (!m) return null;
  const [b, sig] = m[1].split('.'); const exp = crypto.createHmac('sha256', db.secret).update(b || '').digest('base64url');
  if (!sig || sig.length !== exp.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(exp))) return null;
  try { const s = JSON.parse(Buffer.from(b, 'base64url').toString()); return s.exp > Date.now() ? s : null; } catch { return null; }
}
function setCookie(req, res, s) {
  const secure = (req.headers['x-forwarded-proto'] || '') === 'https' ? '; Secure' : '';
  const days = 365, v = s ? sign({ role: s.role, id: s.id, iat: Date.now(), exp: Date.now() + days * 864e5 }) : '';
  res.setHeader('Set-Cookie', `gid=${v}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${s ? days * 86400 : 0}${secure}`);
}
const buckets = new Map();
function limited(req, key, max, ms) {
  const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim(), k = key + ip, n = Date.now(), b = buckets.get(k) || { c: 0, t: n + ms };
  if (n > b.t) { b.c = 0; b.t = n + ms; } b.c++; buckets.set(k, b); return b.c > max;
}


/* ---------- Robo cu AI (doar dacă există ANTHROPIC_API_KEY) ---------- */
function askAI(me) {
  const brief = Core.roboBrief(db, me, today(), ctx);
  const system = `Ești Robo, asistentul virtual al sălii de fitness din aplicația membrilor. Vorbești în română, cald, prietenos și încurajator, la persoana a doua, ca un antrenor de încredere. Răspunsuri scurte și clare (maximum 120 de cuvinte), cu liste scurte când ajută, fără markdown complicat (fără titluri, fără asteriscuri).
Răspunzi la orice întrebare despre antrenament, exerciții și tehnică, nutriție generală, recuperare, somn, motivație și despre sală. Folosește datele de mai jos; dacă nu ai o informație despre sală, spune că o află de la recepție.
Siguranță: nu pui diagnostice. La durere puternică, amorțeli, furnicături, umflături sau după o lovitură recomanzi medic sau kinetoterapeut. La durere în piept, respirație grea sau leșin spui să oprească efortul și să sune la 112. Nu recomanzi steroizi, substanțe interzise sau diete extreme. La întrebări fără legătură cu sala sau sănătatea, spui politicos că te ocupi de fitness.
Date:
${brief}`;
  const hist = (me.robo || []).slice(-10).map((x) => ({ role: x.from === 'u' ? 'user' : 'assistant', content: String(x.text || '').slice(0, 1500) }));
  return (messages) => new Promise((resolve, reject) => {
    const body = JSON.stringify({ model: process.env.ROBO_MODEL || 'claude-haiku-4-5-20251001', max_tokens: 500, system, messages: [...hist, ...messages].filter((m, i, a) => !(i === 0 && m.role === 'assistant')) });
    const rq = https.request({ method: 'POST', hostname: 'api.anthropic.com', path: '/v1/messages', headers: { 'content-type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'content-length': Buffer.byteLength(body) } }, (rs) => {
      const ch = []; rs.on('data', (c) => ch.push(c)); rs.on('end', () => { try { const j = JSON.parse(Buffer.concat(ch).toString()); const t = (j.content || []).filter((c) => c.type === 'text').map((c) => c.text).join('').trim(); t && rs.statusCode < 300 ? resolve(t) : reject(new Error(j.error ? j.error.message : 'fără răspuns')); } catch (e) { reject(e); } });
    });
    rq.on('error', reject); rq.setTimeout(20000, () => rq.destroy(new Error('timeout'))); rq.end(body);
  });
}
/* ---------- Caracterul AI din poză (doar dacă există OPENAI_API_KEY) ---------- */
const AI_LOOK = {
  style: ['a high-quality stylized 3D animated movie character', 'a bold comic-book superhero illustration', 'a clean, modern anime character', 'a realistic, cinematic fitness photo'],
  build: ['a lean, slim and toned physique', 'a fit, athletic physique with visible muscle tone', 'a very muscular bodybuilder physique'],
  rank: ['', ' Wearing gold champion wrist bands.', ' Wearing a gold champion belt.', ' Wearing a gold champion belt and a short dark red commander cape.', ' Wearing a gold champion belt, a dark red cape and a small golden crown.'],
};
function aiPrompt(style, build, rank) {
  return `Turn the person in this photo into ${AI_LOOK.style[style] || AI_LOOK.style[0]}, as their personal character in a gym app. Keep them clearly recognizable: same face shape, eyes, nose, skin tone, hairstyle, hair color, and beard or glasses if they have them. Full body from head to shoes, standing in a confident heroic pose, facing the viewer, centered, with some space around. Give them ${AI_LOOK.build[build] ?? AI_LOOK.build[1]}. Wearing a modest black athletic gym outfit with gold accents and sneakers.${AI_LOOK.rank[rank] || ''} Background: a dark, moody gym with soft golden rim light from behind. One person only, no text, no logos, no watermark.`;
}
async function aiCharacter(buf, type, prompt) {
  const fd = new FormData();
  fd.append('model', process.env.AI_IMAGE_MODEL || 'gpt-image-1.5');
  fd.append('image', new Blob([buf], { type }), 'poza.' + (type.split('/')[1] || 'jpg'));
  fd.append('prompt', prompt); fd.append('n', '1'); fd.append('size', '1024x1536');
  fd.append('quality', process.env.AI_IMAGE_QUALITY || 'medium'); fd.append('output_format', 'jpeg'); fd.append('output_compression', '85');
  const r = await fetch((process.env.AI_IMAGE_URL || 'https://api.openai.com/v1') + '/images/edits', { method: 'POST', headers: { Authorization: 'Bearer ' + process.env.OPENAI_API_KEY }, body: fd, signal: AbortSignal.timeout(170000) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.data || !j.data[0] || !j.data[0].b64_json) { const e = new Error((j.error && j.error.message) || 'HTTP ' + r.status); e.code = (j.error && (j.error.code || j.error.type)) || ''; e.status = r.status; throw e; }
  return Buffer.from(j.data[0].b64_json, 'base64');
}
const aiBusy = new Set();

/* ---------- HTTP ---------- */
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.mp4': 'video/mp4' };
function send(res, status, data, headers = {}) { const b = JSON.stringify(data); res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers }); res.end(b); }
function readBody(req, max) {
  return new Promise((resolve, reject) => { const chunks = []; let n = 0; req.on('data', (c) => { n += c.length; if (n > max) { reject(new Error('big')); req.destroy(); } else chunks.push(c); }); req.on('end', () => resolve(Buffer.concat(chunks))); req.on('error', reject); });
}
const ENTRY = { '/': '/index.html', '/app': '/app.html', '/admin': '/admin.html' };

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x'); let p = decodeURIComponent(url.pathname);
  res.setHeader('X-Content-Type-Options', 'nosniff'); res.setHeader('Referrer-Policy', 'same-origin');
  try {
    if (p.startsWith('/api/')) {
      const session = readSession(req);
      if ((p === '/api/login' || p === '/api/admin/login' || p === '/api/setup' || p === '/api/register') && limited(req, p, 12, 15 * 6e4)) return send(res, 429, { error: 'Prea multe încercări. Mai încearcă peste 15 minute.' });
      // poze de progres: private, doar pentru proprietar sau admin
      let r;
      if (p === '/api/me/photo' && req.method === 'POST') {
        if (!session || session.role !== 'member') return send(res, 401, { error: 'Intră în cont.' });
        const type = (req.headers['content-type'] || '').split(';')[0];
        const ext = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' }[type]; if (!ext) return send(res, 400, { error: 'Doar poze JPG, PNG sau WEBP.' });
        let buf; try { buf = await readBody(req, 12e6); } catch { return send(res, 413, { error: 'Poza e prea mare (maxim 12 MB).' }); }
        const file = crypto.randomBytes(12).toString('hex') + ext; fs.writeFileSync(path.join(UPLOADS, file), buf);
        const out = Core.route(db, { method: 'POST', path: p, body: { file }, query: {}, session }, ctx); save(); return send(res, out.status, out.data);
      }
      // poza de profil: o vede membrul și personalul sălii
      if (p === '/api/me/avatar' && req.method === 'POST' && (req.headers['content-type'] || '').startsWith('image/')) {
        if (!session || session.role !== 'member') return send(res, 401, { error: 'Intră în cont.' });
        const ext = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' }[(req.headers['content-type'] || '').split(';')[0]]; if (!ext) return send(res, 400, { error: 'Doar poze JPG, PNG sau WEBP.' });
        let buf; try { buf = await readBody(req, 5e6); } catch { return send(res, 413, { error: 'Poza e prea mare.' }); }
        const file = crypto.randomBytes(12).toString('hex') + ext; fs.writeFileSync(path.join(AVATARS, file), buf);
        const out = Core.route(db, { method: 'POST', path: p, body: { file }, query: {}, session }, ctx);
        if (out.data && /^[a-f0-9]{24}\.\w+$/.test(out.data.avatarRemoved || '')) fs.rm(path.join(AVATARS, out.data.avatarRemoved), () => {});
        save(); return send(res, out.status, out.data);
      }
      // caracterul AI: poza merge la AI, nu se salvează; se păstrează doar caracterul creat
      if (p === '/api/me/aichar' && req.method === 'POST' && (req.headers['content-type'] || '').startsWith('image/')) {
        if (!session || session.role !== 'member') return send(res, 401, { error: 'Intră în cont.' });
        const me = db.members.find((x) => x.id === session.id); if (!me) return send(res, 401, { error: 'Intră în cont.' });
        const type = (req.headers['content-type'] || '').split(';')[0]; if (!['image/jpeg', 'image/png', 'image/webp'].includes(type)) return send(res, 400, { error: 'Doar poze JPG, PNG sau WEBP.' });
        if (url.searchParams.get('ok') !== '1') return send(res, 400, { error: 'Bifează acordul pentru poză.' });
        const info = Core.aiCharInfo(db, me, today(), ctx);
        if (!info.ready) return send(res, 503, { error: 'Caracterul AI nu e pornit încă la sală.' });
        if (info.left <= 0) return send(res, 429, { error: `Ai folosit cele ${info.per} caractere AI din luna asta. Revino luna viitoare!` });
        if (aiBusy.has(me.id)) return send(res, 409, { error: 'Caracterul tău se desenează deja. Mai așteaptă puțin.' });
        if (limited(req, 'aichar', 6, 30 * 6e4)) return send(res, 429, { error: 'Prea multe încercări. Mai încearcă peste o jumătate de oră.' });
        let buf; try { buf = await readBody(req, 8e6); } catch { return send(res, 413, { error: 'Poza e prea mare.' }); }
        const L = me.look || {}, style = Math.min(3, Math.max(0, parseInt(url.searchParams.get('style'), 10) || 0));
        const mine = Core.route(db, { method: 'GET', path: '/api/me', body: {}, query: {}, session }, ctx).data, rank = (mine && mine.me && mine.me.rank && mine.me.rank.idx) || 0;
        aiBusy.add(me.id); let img;
        try { img = await aiCharacter(buf, type, aiPrompt(style, ['0', '1', '2'].includes(url.searchParams.get('build')) ? +url.searchParams.get('build') : L.build === undefined ? 1 : L.build, rank)); }
        catch (e) {
          console.warn('Caracter AI:', e.status || '', e.code || '', e.message);
          const safety = /safety|moderation|content_policy/i.test(e.code + ' ' + e.message);
          return send(res, safety ? 422 : 502, { error: safety ? 'Poza n-a putut fi folosită. Încearcă un selfie simplu, doar cu tine, cu fața bine luminată.' : 'AI-ul nu a răspuns acum. Încearcă din nou peste câteva minute (nu ți s-a consumat nicio încercare).' });
        } finally { aiBusy.delete(me.id); buf = null; }
        const file = crypto.randomBytes(12).toString('hex') + '.jpg'; fs.writeFileSync(path.join(AVATARS, file), img);
        const out = Core.route(db, { method: 'POST', path: p, body: {}, query: {}, session }, { ...ctx, aiFile: file });
        if (out.status >= 300) fs.rm(path.join(AVATARS, file), () => {});
        if (out.data && /^[a-f0-9]{24}\.\w+$/.test(out.data.avatarRemoved || '')) fs.rm(path.join(AVATARS, out.data.avatarRemoved), () => {});
        save(); return send(res, out.status, out.data);
      }
      if ((r = /^\/api\/avatar\/([a-f0-9]{24}\.(?:jpg|png|webp))$/.exec(p)) && req.method === 'GET') {
        if (!session) return send(res, 401, { error: 'Intră în cont.' });
        const owner = db.members.find((x) => x.avatar === r[1] || x.aiChar === r[1]);
        if (!owner || (session.role !== 'admin' && session.id !== owner.id)) return send(res, 403, { error: 'Privat.' });
        res.writeHead(200, { 'Content-Type': MIME[path.extname(r[1])], 'Cache-Control': 'private, max-age=604800' }); return fs.createReadStream(path.join(AVATARS, r[1])).pipe(res);
      }
      // galeria sălii: încărcare de către admin, vizualizare publică
      if (p === '/api/admin/gallery' && req.method === 'POST' && (req.headers['content-type'] || '').startsWith('image/')) {
        if (!session || session.role !== 'admin') return send(res, 401, { error: 'Intră ca administrator.' });
        const ext = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' }[(req.headers['content-type'] || '').split(';')[0]]; if (!ext) return send(res, 400, { error: 'Doar poze JPG, PNG sau WEBP.' });
        let buf; try { buf = await readBody(req, 12e6); } catch { return send(res, 413, { error: 'Poza e prea mare (maxim 12 MB).' }); }
        const file = crypto.randomBytes(12).toString('hex') + ext; fs.writeFileSync(path.join(GALLERY, file), buf);
        const out = Core.route(db, { method: 'POST', path: p, body: { file, cat: url.searchParams.get('cat'), caption: url.searchParams.get('caption') || '' }, query: {}, session }, ctx); save(); return send(res, out.status, out.data);
      }
      if ((r = /^\/api\/gallery\/([a-f0-9]{24}\.(?:jpg|png|webp))$/.exec(p)) && req.method === 'GET') {
        const f = path.join(GALLERY, r[1]); if (!fs.existsSync(f)) { res.writeHead(404); return res.end(); }
        res.writeHead(200, { 'Content-Type': MIME[path.extname(r[1])], 'Cache-Control': 'public, max-age=2592000, immutable' }); return fs.createReadStream(f).pipe(res);
      }
      if ((r = /^\/api\/photo\/([a-f0-9]{24}\.(?:jpg|png|webp))$/.exec(p)) && req.method === 'GET') {
        if (!session) return send(res, 401, { error: 'Intră în cont.' });
        const owner = db.members.find((m) => (m.photos || []).some((x) => x.file === r[1]));
        if (!owner || session.id !== owner.id) return send(res, 403, { error: 'Poză privată.' }); // doar membrul își vede pozele
        res.writeHead(200, { 'Content-Type': MIME[path.extname(r[1])], 'Cache-Control': 'private, max-age=86400' }); return fs.createReadStream(path.join(UPLOADS, r[1])).pipe(res);
      }
      // Robo din Mesaje: cu AI dacă e configurat, altfel răspunde din baza lui de cunoștințe
      if (p === '/api/me/robo' && req.method === 'POST' && process.env.ANTHROPIC_API_KEY && session && session.role === 'member') {
        if (limited(req, 'robo', 20, 6e4)) return send(res, 429, { error: 'Prea multe întrebări deodată. Mai încearcă peste un minut.' });
        let raw; try { raw = await readBody(req, 2e4); } catch { return send(res, 413, { error: 'Mesaj prea lung.' }); }
        let b = {}; try { b = JSON.parse(raw || '{}'); } catch { return send(res, 400, { error: 'Date invalide.' }); }
        const me = db.members.find((x) => x.id === session.id); let aiReply = null;
        if (me && String(b.text || '').trim()) { try { aiReply = await askAI(me)([{ role: 'user', content: String(b.text).slice(0, 600) }]); } catch (e) { console.warn('Robo AI:', e.message); } }
        const out = Core.route(db, { method: 'POST', path: p, body: { text: b.text }, query: {}, session }, { ...ctx, aiReply });
        save(); return send(res, out.status, out.data);
      }
      // încărcările de fișiere trec doar prin rutele de mai sus (nu se pot „lipi” nume de fișiere străine)
      if (req.method === 'POST' && ['/api/me/photo', '/api/me/avatar', '/api/me/aichar', '/api/admin/gallery'].includes(p)) return send(res, 400, { error: 'Trimite poza ca imagine.' });
      let body = {};
      if (['POST', 'PUT', 'DELETE'].includes(req.method)) { let raw; try { raw = await readBody(req, 1e6); } catch { return send(res, 413, { error: 'Prea mare.' }); } if (raw.length) { try { body = JSON.parse(raw); } catch { return send(res, 400, { error: 'Date invalide.' }); } } }
      const out = Core.route(db, { method: req.method, path: p, body, query: Object.fromEntries(url.searchParams), session }, ctx);
      if ('session' in out) setCookie(req, res, out.session); else if (session && Date.now() - (session.iat || 0) > 864e5) setCookie(req, res, session);
      for (const f of [].concat(out.data && out.data.files || [], out.data && out.data.removed || [])) if (/^[a-f0-9]{24}\.\w+$/.test(f)) fs.rm(path.join(UPLOADS, f), () => {});
      if (out.data && /^[a-f0-9]{24}\.\w+$/.test(out.data.galleryRemoved || '')) fs.rm(path.join(GALLERY, out.data.galleryRemoved), () => {});
      for (const k of ['avatarRemoved', 'aiRemoved']) if (out.data && /^[a-f0-9]{24}\.\w+$/.test(out.data[k] || '')) fs.rm(path.join(AVATARS, out.data[k]), () => {});
      if (req.method !== 'GET' || p === '/api/me') save();
      return send(res, out.status, out.data);
    }
    if (ENTRY[p]) p = ENTRY[p];
    const file = path.normalize(path.join(PUBLIC, p)); if (!file.startsWith(PUBLIC)) { res.writeHead(403); return res.end(); }
    fs.stat(file, (err, st) => {
      if (err || !st.isFile()) { res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' }); return res.end('<h1>Pagina nu există</h1><a href="/">Înapoi</a>'); }
      const ext = path.extname(file);
      const head = { 'Content-Type': MIME[ext] || 'application/octet-stream', 'Cache-Control': ['.html', '.js', '.css', '.webmanifest'].includes(ext) ? 'no-cache' : 'public, max-age=604800', 'Accept-Ranges': 'bytes' };
      const rg = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || '');
      if (rg && (rg[1] || rg[2])) {
        let a = rg[1] ? +rg[1] : Math.max(0, st.size - +rg[2]), b = rg[1] && rg[2] ? Math.min(+rg[2], st.size - 1) : st.size - 1;
        if (a > b || a >= st.size) { res.writeHead(416, { 'Content-Range': `bytes */${st.size}` }); return res.end(); }
        res.writeHead(206, { ...head, 'Content-Range': `bytes ${a}-${b}/${st.size}`, 'Content-Length': b - a + 1 }); return fs.createReadStream(file, { start: a, end: b }).pipe(res);
      }
      res.writeHead(200, { ...head, 'Content-Length': st.size });
      fs.createReadStream(file).pipe(res);
    });
  } catch (e) { console.error(e); send(res, 500, { error: 'Eroare pe server. Încearcă din nou.' }); }
});

load();
if (!db.admin) console.warn('Sala nu e configurată încă: deschide /admin și alege parola de administrator.');
setInterval(() => { try { if (Core.jobs(db, ctx)) save(); } catch (e) { console.error(e); } }, 60e3);
setTimeout(() => { try { if (Core.jobs(db, ctx)) save(); } catch (e) { console.error(e); } }, 3000);
server.listen(PORT, () => console.log(`Aplicația sălii rulează pe portul ${PORT}`));
module.exports = { encryptPush };
