/* Demo: toată aplicația rulează în browser, fără server.
   Aplicația membrului și panoul de administrare (două iframe-uri) folosesc aceeași bază de date din pagina-mamă,
   ca proprietarul să vadă imediat cum o acțiune din admin ajunge la membru. */
(function () {
  const pad = (n) => String(n).padStart(2, '0');
  const today = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
  let n = 0;
  const ctx = {
    today, hour: () => new Date().getHours(), time: () => { const d = new Date(); return pad(d.getHours()) + ':' + pad(d.getMinutes()); }, nowISO: () => new Date().toISOString(),
    uid: (p) => p + '_' + Date.now().toString(36) + (n++).toString(36) + Math.random().toString(36).slice(2, 6),
    rand: Math.random, hash: (pw) => 'demo:' + pw, check: (pw, h) => !!h && h === 'demo:' + pw, demo: true, vapidPublic: 'demo',
  };

  let top = window;
  try { if (window.parent !== window && window.parent.document) top = window.parent; } catch (e) {}
  let host = top.GymHost;
  // pe tot ecranul (nu în pagina de prezentare): datele rămân salvate pe telefon între deschideri
  const solo = top === window, KEY = 'gymDemoDB_v3';
  const ls = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };
  if (!host) {
    host = { db: null, listeners: [] };
    let saved = null; if (solo) try { saved = JSON.parse(ls.get(KEY) || 'null'); } catch (e) {}
    if (saved && saved.members) host.db = saved;
    else { host.db = GymSeed.base(ctx); GymSeed.demo(host.db, ctx); host.db.admin = ctx.hash('admin'); }
    top.GymHost = host;
  }
  const persist = () => { if (solo) ls.set(KEY, JSON.stringify(host.db)); };
  const db = host.db;
  host.wins = (host.wins || []).filter((w) => { try { return !w.closed && w.document; } catch (e) { return false; } }); host.wins.push(window);
  ctx.push = (m, data) => host.listeners.slice().forEach((f) => { try { f(m.id, data); } catch (e) {} });
  if (!host.jobsOn) { host.jobsOn = true; GymCore.jobs(db, ctx); persist(); setInterval(() => { if (GymCore.jobs(db, ctx)) persist(); }, 60e3); }
  // aplicația și panoul deschise în taburi diferite pe același dispozitiv se văd între ele
  if (solo) addEventListener('storage', (e) => { if (e.key !== KEY || !e.newValue) return; try { const nd = JSON.parse(e.newValue); Object.keys(db).forEach((k) => delete db[k]); Object.assign(db, nd); } catch (er) { return; } if (window.GymDemoRefresh) window.GymDemoRefresh(); });

  // fiecare fereastră are sesiunea ei; în demo intrăm direct (membru sau admin)
  const as = new URLSearchParams(location.search).get('as');
  const SK = 'gymDemoSess_' + (/admin/.test(location.pathname) ? 'admin' : 'member');
  let session = null;
  if (solo) try { session = JSON.parse(ls.get(SK) || 'null'); } catch (e) {}
  if (as === 'admin') session = { role: 'admin' };
  if (as === 'member') { const m = db.members.find((x) => x.phone === '0740000000'); if (m) session = { role: 'member', id: m.id }; }

  const clone = (o) => (o === undefined ? o : JSON.parse(JSON.stringify(o)));
  window.GymDemo = {
    async call(path, opt = {}) {
      await new Promise((r) => setTimeout(r, 60));
      const [p, qs] = path.split('?');
      let body = opt.body;
      const out = GymCore.route(db, { method: opt.method || (body !== undefined ? 'POST' : 'GET'), path: p, body: clone(body) || {}, query: Object.fromEntries(new URLSearchParams(qs || '')), session }, ctx);
      if ('session' in out) { session = out.session; if (solo) ls.set(SK, JSON.stringify(session)); }
      if (out.status >= 400) { const e = new Error((out.data && out.data.error) || 'A apărut o eroare.'); e.status = out.status; throw e; }
      if ((opt.method || (body !== undefined ? 'POST' : 'GET')) !== 'GET') persist();
      // celelalte ferestre (membru / admin) se actualizează singure, ca în realitate
      if ((opt.method || (body !== undefined ? 'POST' : 'GET')) !== 'GET') setTimeout(() => host.wins.forEach((w) => { if (w !== window) try { w.GymDemoRefresh && w.GymDemoRefresh(); } catch (e) {} }), 250);
      return clone(out.data);
    },
    pushOn() { const m = session && db.members.find((x) => x.id === session.id); if (m && !(m.push || []).length) m.push = [{ endpoint: 'demo' }]; persist(); },
    reset() { try { localStorage.removeItem(KEY); } catch (e) {} location.reload(); },
  };

  // notificare push simulată: apare sus, ca pe telefon
  host.listeners.push((memberId, data) => {
    if (!session || session.role !== 'member' || session.id !== memberId) return;
    const show = () => {
      const el = document.createElement('div');
      el.setAttribute('role', 'status');
      el.style.cssText = 'position:fixed;left:10px;right:10px;top:10px;z-index:400;background:rgba(40,40,46,.96);backdrop-filter:blur(10px);color:#fff;border-radius:18px;padding:12px 14px;display:flex;gap:11px;align-items:flex-start;box-shadow:0 14px 40px rgba(0,0,0,.6);transform:translateY(-130%);transition:transform .45s cubic-bezier(.2,.9,.3,1);font-family:Inter,system-ui,sans-serif;cursor:pointer';
      el.innerHTML = '<img src="img/icon-192.png" alt="" style="width:38px;height:38px;border-radius:10px;flex:none"><div style="min-width:0"><div style="font-size:.72rem;color:#aaa;font-weight:600">' + (db.settings.name || 'Sala').replace(/</g, '') + ' · acum</div><b style="display:block;font-size:.95rem;margin:1px 0 2px"></b><div style="font-size:.86rem;color:#ddd;line-height:1.35"></div></div>';
      el.querySelector('b').textContent = data.title || ''; el.querySelector('div div:last-child').textContent = data.body || '';
      document.body.appendChild(el); requestAnimationFrame(() => requestAnimationFrame(() => (el.style.transform = 'none')));
      const hide = () => { el.style.transform = 'translateY(-130%)'; setTimeout(() => el.remove(), 500); };
      el.onclick = () => { hide(); if (window.GymDemoRefresh) window.GymDemoRefresh(); };
      setTimeout(hide, 6000);
      if (window.GymDemoRefresh) setTimeout(window.GymDemoRefresh, 300);
    };
    setTimeout(show, 700);
  });
})();
