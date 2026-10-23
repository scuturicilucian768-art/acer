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
const ctx = { ...baseCtx, push: sendPush, get vapidPublic() { return db.vapid.pub; } };

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

/* ---------- HTTP ---------- */
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' };
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
      if ((p === '/api/login' || p === '/api/admin/login' || p === '/api/setup') && limited(req, p, 12, 15 * 6e4)) return send(res, 429, { error: 'Prea multe încercări. Mai încearcă peste 15 minute.' });
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
      if ((r = /^\/api\/avatar\/([a-f0-9]{24}\.(?:jpg|png|webp))$/.exec(p)) && req.method === 'GET') {
        if (!session) return send(res, 401, { error: 'Intră în cont.' });
        const owner = db.members.find((x) => x.avatar === r[1]);
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
      let body = {};
      if (['POST', 'PUT', 'DELETE'].includes(req.method)) { let raw; try { raw = await readBody(req, 1e6); } catch { return send(res, 413, { error: 'Prea mare.' }); } if (raw.length) { try { body = JSON.parse(raw); } catch { return send(res, 400, { error: 'Date invalide.' }); } } }
      const out = Core.route(db, { method: req.method, path: p, body, query: Object.fromEntries(url.searchParams), session }, ctx);
      if ('session' in out) setCookie(req, res, out.session); else if (session && Date.now() - (session.iat || 0) > 864e5) setCookie(req, res, session);
      for (const f of [].concat(out.data && out.data.files || [], out.data && out.data.removed || [])) if (/^[a-f0-9]{24}\.\w+$/.test(f)) fs.rm(path.join(UPLOADS, f), () => {});
      if (out.data && /^[a-f0-9]{24}\.\w+$/.test(out.data.galleryRemoved || '')) fs.rm(path.join(GALLERY, out.data.galleryRemoved), () => {});
      if (out.data && /^[a-f0-9]{24}\.\w+$/.test(out.data.avatarRemoved || '')) fs.rm(path.join(AVATARS, out.data.avatarRemoved), () => {});
      if (req.method !== 'GET' || p === '/api/me') save();
      return send(res, out.status, out.data);
    }
    if (ENTRY[p]) p = ENTRY[p];
    const file = path.normalize(path.join(PUBLIC, p)); if (!file.startsWith(PUBLIC)) { res.writeHead(403); return res.end(); }
    fs.stat(file, (err, st) => {
      if (err || !st.isFile()) { res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' }); return res.end('<h1>Pagina nu există</h1><a href="/">Înapoi</a>'); }
      const ext = path.extname(file);
      res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream', 'Cache-Control': ['.html', '.js', '.css', '.webmanifest'].includes(ext) ? 'no-cache' : 'public, max-age=604800' });
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
