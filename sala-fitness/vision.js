/* Robo te vede: camera telefonului urmărește corpul (MediaPipe Pose, rulează local în telefon),
   numără repetările și corectează forma cu voce. Imaginea nu pleacă de pe telefon. */
(function (root) {
  'use strict';
  const MP_VER = '0.10.14';
  const MP_URL = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MP_VER}`;
  const MODEL = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';
  // punctele corpului (indicii MediaPipe)
  const P = { nose: 0, ls: 11, rs: 12, le: 13, re: 14, lw: 15, rw: 16, lh: 23, rh: 24, lk: 25, rk: 26, la: 27, ra: 28, lf: 31, rf: 32 };
  const BONES = [[11, 12], [11, 13], [13, 15], [12, 14], [14, 16], [11, 23], [12, 24], [23, 24], [23, 25], [25, 27], [24, 26], [26, 28], [27, 31], [28, 32]];

  const EXV = {
    squat: { name: 'Genuflexiuni', ex: 'ex_squat', icon: '🦵', target: 12, view: 'Pune telefonul jos, la 2–3 metri, din față sau din lateral. Trebuie să se vadă tot corpul, de la cap la tălpi.', need: ['h', 'k', 'a', 's'] },
    pushup: { name: 'Flotări', ex: 'ex_pushup', icon: '💪', target: 10, view: 'Pune telefonul pe jos, din lateral, la 1,5–2 metri. Trebuie să se vadă tot corpul.', need: ['s', 'e', 'w', 'h', 'a'] },
    lunge: { name: 'Fandări', ex: 'ex_lunge', icon: '🚶', target: 10, view: 'Telefonul din lateral, la 2–3 metri, să se vadă tot corpul. Numără fiecare fandare, pe orice picior.', need: ['h', 'k', 'a', 's'] },
    curl: { name: 'Flexii pentru biceps', ex: 'ex_curl', icon: '🏋️', target: 12, view: 'Telefonul din față sau din lateral, să se vadă de la cap până la șold. Merge cu gantere sau cu o sticlă de apă.', need: ['s', 'e', 'w', 'h'] },
    plank: { name: 'Planșă', ex: 'ex_plank', icon: '🧘', target: 30, hold: true, view: 'Telefonul pe jos, din lateral, la 1,5–2 metri, să se vadă tot corpul.', need: ['s', 'h', 'a'] },
  };

  /* ───────── geometrie ───────── */
  let ASPECT = 4 / 3;
  const pt = (L, i) => ({ x: L[i].x * ASPECT, y: L[i].y, v: L[i].visibility == null ? 1 : L[i].visibility });
  function ang(a, b, c) { const v1 = [a.x - b.x, a.y - b.y], v2 = [c.x - b.x, c.y - b.y]; const d = Math.hypot(...v1) * Math.hypot(...v2) || 1; return (Math.acos(Math.max(-1, Math.min(1, (v1[0] * v2[0] + v1[1] * v2[1]) / d))) * 180) / Math.PI; }
  const fromVertical = (low, high) => (Math.atan2(Math.abs(high.x - low.x), Math.abs(low.y - high.y) || 1e-6) * 180) / Math.PI;
  function side(L) {
    const s = (ids) => ids.reduce((a, i) => a + (L[i].visibility == null ? 1 : L[i].visibility), 0);
    return s([11, 13, 15, 23, 25, 27]) >= s([12, 14, 16, 24, 26, 28]) ? 'l' : 'r';
  }
  const J = (L, sd, k) => pt(L, P[sd + k]);
  function visible(L, sd, need) { return need.every((k) => J(L, sd, k).v > 0.5); }

  /* ───────── analizorul: primește punctele corpului la fiecare cadru ───────── */
  function analyzer(kind) {
    const cfg = EXV[kind];
    const S = { reps: 0, good: 0, state: 'up', minA: 180, maxA: 0, issues: new Set(), counts: {}, sm: null, holdMs: 0, lastT: null, baseTorso: null, seen: 0 };
    const smooth = (a) => (S.sm = S.sm == null ? a : S.sm * 0.45 + a * 0.55);
    const flag = (k) => S.issues.add(k);
    const MSG = {
      deep: 'Coboară mai jos', chest: 'Pieptul sus, spatele drept', knees: 'Împinge genunchii în afară', sag: 'Nu lăsa șoldurile jos', pike: 'Coboară șoldurile, corpul drept',
      pdepth: 'Coboară pieptul mai aproape de sol', elbow: 'Ține cotul lipit de corp', swing: 'Nu te balansa', top: 'Urcă până sus', ext: 'Întinde brațul complet', torso: 'Trunchiul drept',
    };
    function finishRep(goodNow) {
      S.reps++; const list = [...S.issues];
      if (!list.length && goodNow) S.good++;
      list.forEach((k) => (S.counts[k] = (S.counts[k] || 0) + 1));
      S.issues = new Set(); S.minA = 180; S.maxA = 0;
      return { rep: S.reps, fix: list.length ? MSG[list[0]] : null };
    }
    function step(L, tMs) {
      const out = { reps: S.reps, good: S.good, visible: false, angle: null, cue: null, rep: null, hold: Math.round(S.holdMs / 1000), bad: [] };
      if (!L || L.length < 33) { S.lastT = tMs; return out; }
      const sd = side(L); if (!visible(L, sd, cfg.need)) { S.lastT = tMs; out.cue = 'Nu te văd tot. Depărtează telefonul ca să intri tot în cadru.'; return out; }
      out.visible = true; S.seen++;
      const sh = J(L, sd, 's'), hp = J(L, sd, 'h');
      if (kind === 'squat' || kind === 'lunge') {
        const kn = J(L, sd, 'k'), an = J(L, sd, 'a');
        let a = ang(hp, kn, an);
        if (kind === 'lunge') { const o = sd === 'l' ? 'r' : 'l'; const b = ang(J(L, o, 'h'), J(L, o, 'k'), J(L, o, 'a')); if (J(L, o, 'k').v > 0.5) a = Math.min(a, b); }
        a = smooth(a); out.angle = Math.round(a);
        const torso = fromVertical(hp, sh);
        if (S.state === 'up' && a < 145) { S.state = 'down'; S.minA = a; }
        if (S.state === 'down') {
          S.minA = Math.min(S.minA, a);
          if (a < 120 && torso > (kind === 'lunge' ? 30 : 55)) { flag(kind === 'lunge' ? 'torso' : 'chest'); out.bad.push('torso'); }
          if (kind === 'squat' && a < 120) {
            const lk = pt(L, P.lk), rk = pt(L, P.rk), la = pt(L, P.la), ra = pt(L, P.ra), ls = pt(L, P.ls), rs = pt(L, P.rs);
            const frontal = Math.abs(ls.x - rs.x) > 0.45 * Math.abs(ls.y - pt(L, P.lh).y) && lk.v > 0.6 && rk.v > 0.6;
            if (frontal && Math.abs(lk.x - rk.x) < 0.72 * Math.abs(la.x - ra.x)) { flag('knees'); out.bad.push('knees'); }
          }
          if (a > 160) {
            if (S.minA <= 125) { if (S.minA > (kind === 'lunge' ? 110 : 105)) flag('deep'); out.rep = finishRep(true); }
            S.state = 'up';
          }
        }
      } else if (kind === 'pushup') {
        const el = J(L, sd, 'e'), wr = J(L, sd, 'w'), an = J(L, sd, 'a');
        const horiz = Math.abs(sh.y - an.y) < 0.6 * Math.abs(sh.x - an.x);
        if (!horiz) { out.cue = 'Treci în poziția de flotare, din lateral față de telefon.'; return out; }
        const a = smooth(ang(sh, el, wr)); out.angle = Math.round(a);
        // linia corpului: șoldul față de dreapta umăr–gleznă
        const tt = (hp.x - sh.x) / ((an.x - sh.x) || 1e-6), lineY = sh.y + (an.y - sh.y) * tt, dev = (hp.y - lineY) / (Math.hypot(an.x - sh.x, an.y - sh.y) || 1);
        if (dev > 0.09) { flag('sag'); out.bad.push('hips'); } else if (dev < -0.11) { flag('pike'); out.bad.push('hips'); }
        if (S.state === 'up' && a < 140) { S.state = 'down'; S.minA = a; }
        if (S.state === 'down') { S.minA = Math.min(S.minA, a); if (a > 150) { if (S.minA <= 120) { if (S.minA > 100) flag('pdepth'); out.rep = finishRep(true); } S.state = 'up'; } }
      } else if (kind === 'curl') {
        const el = J(L, sd, 'e'), wr = J(L, sd, 'w');
        const a = smooth(ang(sh, el, wr)); out.angle = Math.round(a);
        const torso = fromVertical(hp, sh); if (S.baseTorso == null && a > 140) S.baseTorso = torso;
        if (fromVertical(el, sh) > 32 && a < 120) { flag('elbow'); out.bad.push('elbow'); }
        if (S.baseTorso != null && Math.abs(torso - S.baseTorso) > 14) { flag('swing'); out.bad.push('torso'); }
        if (S.state === 'up' && a < 110) { S.state = 'down'; S.minA = a; S.maxA = 0; }
        if (S.state === 'down') { S.minA = Math.min(S.minA, a); if (a > 140) { if (S.minA <= 80) { if (S.minA > 62) flag('top'); out.rep = finishRep(true); } S.state = 'up'; } }
        if (S.state === 'up') { S.maxA = Math.max(S.maxA, a); }
      } else if (kind === 'plank') {
        const an = J(L, sd, 'a');
        const horiz = Math.abs(sh.y - an.y) < 0.6 * Math.abs(sh.x - an.x);
        const tt = (hp.x - sh.x) / ((an.x - sh.x) || 1e-6), lineY = sh.y + (an.y - sh.y) * tt, dev = (hp.y - lineY) / (Math.hypot(an.x - sh.x, an.y - sh.y) || 1);
        const ok = horiz && Math.abs(dev) < 0.09;
        if (!horiz) out.cue = 'Treci în poziția de planșă, din lateral față de telefon.';
        else if (dev >= 0.09) { out.cue = MSG.sag; out.bad.push('hips'); S.counts.sag = (S.counts.sag || 0) + 1; }
        else if (dev <= -0.09) { out.cue = MSG.pike; out.bad.push('hips'); S.counts.pike = (S.counts.pike || 0) + 1; }
        if (ok && S.lastT != null) S.holdMs += Math.min(250, tMs - S.lastT);
        out.hold = Math.floor(S.holdMs / 1000); out.angle = Math.round(dev * 100);
      }
      S.lastT = tMs; out.reps = S.reps; out.good = S.good;
      return out;
    }
    function summary() {
      const top = Object.entries(S.counts).sort((a, b) => b[1] - a[1])[0];
      return { reps: S.reps, good: S.good, holdSec: Math.floor(S.holdMs / 1000), topFix: top ? MSG[top[0]] : null, counts: S.counts };
    }
    return { step, summary, cfg };
  }

  /* ───────── voce ───────── */
  const NUM = ['zero', 'unu', 'doi', 'trei', 'patru', 'cinci', 'șase', 'șapte', 'opt', 'nouă', 'zece', 'unsprezece', 'doisprezece', 'treisprezece', 'paisprezece', 'cincisprezece', 'șaisprezece', 'șaptesprezece', 'optsprezece', 'nouăsprezece', 'douăzeci'];
  const numRo = (n) => (n <= 20 ? NUM[n] : n < 100 ? ['', '', 'douăzeci', 'treizeci', 'patruzeci', 'cincizeci', 'șaizeci', 'șaptezeci', 'optzeci', 'nouăzeci'][Math.floor(n / 10)] + (n % 10 ? ' și ' + (n % 10 === 1 ? 'unu' : n % 10 === 2 ? 'doi' : NUM[n % 10]) : '') : String(n));
  const Voice = {
    on: true, last: {}, lastAny: 0, voice: null,
    pick() { try { const v = speechSynthesis.getVoices(); this.voice = v.find((x) => /^ro/i.test(x.lang)) || null; } catch {} },
    say(t, { urgent = false, key = t, gap = 3500 } = {}) {
      if (!this.on || !('speechSynthesis' in window)) return;
      const now = Date.now(); if (!urgent && (now - (this.last[key] || 0) < 6000 || now - this.lastAny < gap)) return;
      this.last[key] = now; this.lastAny = now;
      try { if (urgent) speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(t); u.lang = 'ro-RO'; if (this.voice) u.voice = this.voice; u.rate = 1.05; speechSynthesis.speak(u); } catch {}
    },
    stop() { try { speechSynthesis.cancel(); } catch {} },
  };
  if ('speechSynthesis' in window) { Voice.pick(); try { speechSynthesis.onvoiceschanged = () => Voice.pick(); } catch {} }

  /* ───────── modelul (o singură dată) ───────── */
  let landmarker = null, loading = null;
  async function loadModel() {
    if (landmarker) return landmarker;
    if (loading) return loading;
    loading = (async () => {
      // versiunea fixată; dacă CDN-ul n-o mai are, folosim ultima versiune
      let mod = null, base = MP_URL;
      for (const u of [MP_URL, 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision']) { try { mod = await import(/* webpackIgnore: true */ `${u}/vision_bundle.mjs`); base = u; break; } catch (e) { mod = null; } }
      if (!mod) throw new Error('model');
      const { PoseLandmarker, FilesetResolver } = mod;
      const fs = await FilesetResolver.forVisionTasks(`${base}/wasm`);
      const mk = (delegate) => PoseLandmarker.createFromOptions(fs, { baseOptions: { modelAssetPath: MODEL, delegate }, runningMode: 'VIDEO', numPoses: 1, minPoseDetectionConfidence: 0.5, minTrackingConfidence: 0.5 });
      try { landmarker = await mk('GPU'); } catch { landmarker = await mk('CPU'); }
      return landmarker;
    })();
    try { return await loading; } catch (e) { loading = null; throw e; }
  }

  /* ───────── interfața ───────── */
  const $ = (s, el = document) => el.querySelector(s), esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  function picker(opts = {}) {
    const el = document.createElement('div'); el.className = 'rv'; el.id = 'rv';
    el.innerHTML = `<div class="rv-pick"><div class="rv-top"><button class="iconbtn" id="rvX" aria-label="Închide">✕</button></div>
      <div class="rv-hero">${root.GymFig ? root.GymFig.robot(86, { talk: true }) : '🤖'}<div><span class="rv-k">NOU · ROBO TE VEDE</span><h1>Robo îți numără repetările și îți corectează forma</h1><p>Pune telefonul jos, cu camera spre tine. Robo te urmărește, numără cu voce și îți spune pe loc ce să corectezi.</p></div></div>
      <div class="rv-list">${Object.entries(EXV).map(([k, x]) => `<button class="rv-ex" data-k="${k}"><span class="i">${x.icon}</span><span class="grow"><b>${esc(x.name)}</b><small>${x.hold ? `Ține ${x.target} de secunde` : `${x.target} repetări`} · ${k === 'pushup' || k === 'plank' ? 'telefonul din lateral' : 'tot corpul în cadru'}</small></span><span class="go">›</span></button>`).join('')}</div>
      <p class="rv-priv">🔒 Imaginea de la cameră rămâne în telefonul tău. Nu se filmează, nu se salvează și nu se trimite nicăieri.</p></div>`;
    document.body.appendChild(el); document.body.classList.add('noscroll');
    const close = () => { el.remove(); document.body.classList.remove('noscroll'); };
    $('#rvX', el).onclick = close;
    el.querySelectorAll('[data-k]').forEach((b) => (b.onclick = () => { Voice.say('Pornesc camera', { urgent: true, key: 'unlock' }); close(); open(b.dataset.k, opts); }));
    if (opts.kind) { Voice.say('Pornesc camera', { urgent: true, key: 'unlock' }); close(); open(opts.kind, opts); }
  }

  async function open(kind, opts = {}) {
    const cfg = EXV[kind]; if (!cfg) return;
    const el = document.createElement('div'); el.className = 'rv'; el.id = 'rv';
    el.innerHTML = `<div class="rv-cam">
      <canvas id="rvC"></canvas><video id="rvV" playsinline muted></video>
      <div class="rv-bar"><button class="iconbtn" id="rvB" aria-label="Înapoi">‹</button><b>${cfg.icon} ${esc(cfg.name)}</b><span class="grow"></span><button class="iconbtn" id="rvM" aria-label="Sunet">🔊</button><button class="iconbtn" id="rvF" aria-label="Schimbă camera">🔄</button></div>
      <div class="rv-cue" id="rvQ" aria-live="polite">Robo își pregătește ochii…</div>
      <div class="rv-count"><svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="52" class="bg"/><circle cx="60" cy="60" r="52" class="fg" id="rvR" pathLength="100" stroke-dasharray="0 100"/></svg><div><b id="rvN">0</b><small id="rvT">din ${cfg.target}${cfg.hold ? ' s' : ''}</small></div></div>
      <div class="rv-form" id="rvG"><span>Formă</span><i><em id="rvGF"></em></i></div>
      <div class="rv-guide" id="rvH"><div class="sil">🧍</div><p>${esc(cfg.view)}</p></div>
      <div class="rv-cd" id="rvD"></div>
      <button class="btn btn-acc rv-done" id="rvO">Gata</button></div>`;
    document.body.appendChild(el); document.body.classList.add('noscroll');
    const V = $('#rvV', el), C = $('#rvC', el), X = C.getContext('2d'), Q = $('#rvQ', el);
    let stream = null, facing = 'user', raf = 0, alive = true, started = false, lastVT = -1, goodFrames = 0, lastL = null, bad = [];
    const A = analyzer(kind);
    const setCue = (t, kind2) => { Q.textContent = t; Q.className = 'rv-cue ' + (kind2 || ''); };
    const stopAll = () => { alive = false; cancelAnimationFrame(raf); Voice.stop(); if (stream) stream.getTracks().forEach((t) => t.stop()); };
    const close = () => { stopAll(); el.remove(); document.body.classList.remove('noscroll'); };
    $('#rvB', el).onclick = () => { close(); picker({ ...opts, kind: null }); };
    $('#rvM', el).onclick = (e) => { Voice.on = !Voice.on; e.currentTarget.textContent = Voice.on ? '🔊' : '🔇'; if (!Voice.on) Voice.stop(); };
    $('#rvF', el).onclick = async () => { facing = facing === 'user' ? 'environment' : 'user'; await startCam(); };
    $('#rvO', el).onclick = () => finish();
    async function startCam() {
      if (stream) stream.getTracks().forEach((t) => t.stop());
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: facing, width: { ideal: 960 }, height: { ideal: 720 } }, audio: false });
      V.srcObject = stream; await V.play();
      el.classList.toggle('mirror', facing === 'user');
    }
    function fit() { const r = C.getBoundingClientRect(), d = Math.min(2, devicePixelRatio || 1); C.width = r.width * d; C.height = r.height * d; }
    function draw(L) {
      const W = C.width, H2 = C.height, vw = V.videoWidth || 4, vh = V.videoHeight || 3, s = Math.max(W / vw, H2 / vh), dw = vw * s, dh = vh * s, ox = (W - dw) / 2, oy = (H2 - dh) / 2;
      X.save(); X.clearRect(0, 0, W, H2);
      if (facing === 'user') { X.translate(W, 0); X.scale(-1, 1); }
      X.drawImage(V, ox, oy, dw, dh);
      if (L) {
        const acc = getComputedStyle(document.documentElement).getPropertyValue('--acc').trim() || '#C8F03C';
        const badSet = new Set(bad), isBad = (i) => (badSet.has('hips') && [23, 24].includes(i)) || (badSet.has('knees') && [25, 26].includes(i)) || (badSet.has('torso') && [11, 12, 23, 24].includes(i)) || (badSet.has('elbow') && [13, 14].includes(i));
        X.lineCap = 'round'; X.lineWidth = Math.max(4, W / 110);
        for (const [a, b] of BONES) { if ((L[a].visibility || 1) < 0.4 || (L[b].visibility || 1) < 0.4) continue; X.strokeStyle = isBad(a) || isBad(b) ? '#FF5A5A' : acc; X.globalAlpha = 0.9; X.beginPath(); X.moveTo(ox + L[a].x * dw, oy + L[a].y * dh); X.lineTo(ox + L[b].x * dw, oy + L[b].y * dh); X.stroke(); }
        X.globalAlpha = 1;
        for (const i of [0, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28]) { if ((L[i].visibility || 1) < 0.4) continue; X.fillStyle = isBad(i) ? '#FF5A5A' : '#fff'; X.beginPath(); X.arc(ox + L[i].x * dw, oy + L[i].y * dh, Math.max(5, W / 90), 0, 7); X.fill(); }
      }
      X.restore();
    }
    function ui(o) {
      const n = cfg.hold ? o.hold : o.reps, pct = Math.min(100, (n / cfg.target) * 100);
      $('#rvN', el).textContent = n; $('#rvR', el).setAttribute('stroke-dasharray', `${pct} 100`);
      const q = o.reps ? Math.round((o.good / o.reps) * 100) : 100; $('#rvGF', el).style.width = (cfg.hold ? (o.bad.length ? 40 : 100) : q) + '%';
    }
    async function countdown() {
      const D = $('#rvD', el); $('#rvH', el).classList.add('hide');
      for (const [n, w] of [[3, 'trei'], [2, 'doi'], [1, 'unu']]) { if (!alive) return; D.textContent = n; D.className = 'rv-cd on'; Voice.say(w, { urgent: true, key: 'cd' + n }); await new Promise((r) => setTimeout(r, 900)); }
      D.textContent = 'Start!'; Voice.say(cfg.hold ? 'Start! Ține poziția.' : 'Start!', { urgent: true, key: 'start' }); await new Promise((r) => setTimeout(r, 700)); D.className = 'rv-cd';
      started = true; setCue(cfg.hold ? 'Ține corpul drept' : 'Hai! Eu număr.', 'ok');
    }
    let ended = false, lastHoldSaid = 0;
    function onResult(L, t) {
      lastL = L;
      if (!started) {
        const sd = L ? side(L) : 'l';
        if (L && visible(L, sd, cfg.need)) { if (++goodFrames === 8) { setCue('Te văd! Pregătește-te…', 'ok'); countdown(); } }
        else { goodFrames = 0; setCue(L ? 'Nu te văd tot. Depărtează telefonul.' : 'Intră în cadru, cu tot corpul.'); }
        bad = []; return;
      }
      const o = A.step(L, t); bad = o.bad; ui(o);
      if (o.rep) {
        Voice.say(numRo(o.rep.rep), { urgent: true, key: 'rep' + o.rep.rep });
        if (o.rep.fix) setTimeout(() => Voice.say(o.rep.fix, { key: 'fix' + o.rep.fix, gap: 600 }), 650);
        setCue(o.rep.fix ? '⚠️ ' + o.rep.fix : ['Perfect!', 'Așa da! 💪', 'Foarte bine!', 'Formă excelentă!'][o.rep.rep % 4], o.rep.fix ? 'warn' : 'ok');
        if (o.rep.rep === cfg.target - 2 && !cfg.hold) setTimeout(() => Voice.say('Încă două!', { key: 'last2', gap: 800 }), 1500);
        if (o.reps >= cfg.target && !ended) { ended = true; setTimeout(() => finish(true), 900); }
      } else if (o.cue && cfg.hold) { setCue('⚠️ ' + o.cue, 'warn'); Voice.say(o.cue, { key: 'h' + o.cue }); }
      else if (o.cue && !o.visible) setCue(o.cue);
      else if (cfg.hold && o.visible && !o.cue) setCue('Ține așa! ' + o.hold + ' s', 'ok');
      if (cfg.hold && o.hold >= lastHoldSaid + 10 && o.hold < cfg.target) { lastHoldSaid = o.hold - (o.hold % 10); Voice.say(numRo(lastHoldSaid) + ' secunde', { urgent: true, key: 'hs' + lastHoldSaid }); }
      if (cfg.hold && o.hold >= cfg.target && !ended) { ended = true; finish(true); }
    }
    function loop() {
      if (!alive) return;
      raf = requestAnimationFrame(loop);
      if (V.readyState < 2) return;
      ASPECT = (V.videoWidth || 4) / (V.videoHeight || 3);
      if (landmarker && V.currentTime !== lastVT) { lastVT = V.currentTime; const now = performance.now(); try { const r = landmarker.detectForVideo(V, now); onResult(r && r.landmarks && r.landmarks[0], now); } catch {} }
      draw(lastL);
    }
    function finish(auto) {
      if (!alive && !auto) return;
      stopAll(); const s = A.summary();
      const n = cfg.hold ? s.holdSec : s.reps, q = s.reps ? Math.round((s.good / s.reps) * 100) : null;
      if (auto) setTimeout(() => Voice.say(cfg.hold ? 'Gata! Bravo!' : 'Gata! Bravo, ai terminat seria!', { urgent: true, key: 'end' }), 50);
      el.innerHTML = `<div class="rv-pick rv-sum"><div class="rv-hero" style="text-align:center;display:block">${root.GymFig ? root.GymFig.robot(80) : '🤖'}<h1 style="margin-top:8px">${n ? (auto ? 'Bravo! 🎉' : 'Seria s-a încheiat') : 'Hai să mai încercăm'}</h1></div>
        <div class="rv-stats"><div><b>${n}</b><small>${cfg.hold ? 'secunde' : 'repetări'}</small></div>${q != null ? `<div><b>${q}%</b><small>repetări corecte</small></div>` : ''}<div><b>${cfg.icon}</b><small>${esc(cfg.name)}</small></div></div>
        ${s.topFix ? `<div class="rv-tip">💡 <span>Data viitoare: <b>${esc(s.topFix.toLowerCase())}</b>.</span></div>` : n ? '<div class="rv-tip ok">✅ <span>Formă foarte bună. Robo e mândru de tine!</span></div>' : '<div class="rv-tip">💡 <span>Asigură-te că se vede tot corpul și că telefonul stă nemișcat.</span></div>'}
        ${n && opts.onSave ? `<button class="btn btn-acc btn-block" id="rvS">💾 Salvează în antrenamente</button>` : ''}
        <button class="btn btn-block" id="rvA" style="margin-top:10px">🔁 Încă o serie</button>
        <button class="btn btn-ghost btn-block" id="rvE" style="margin-top:8px">Închide</button></div>`;
      if (n && root.confetti && auto) root.confetti();
      const done = () => { el.remove(); document.body.classList.remove('noscroll'); };
      if ($('#rvS', el)) $('#rvS', el).onclick = async (e) => { e.currentTarget.disabled = true; try { await opts.onSave({ kind, ex: cfg.ex, name: cfg.name, reps: s.reps, holdSec: s.holdSec }); done(); } catch { e.currentTarget.disabled = false; } };
      $('#rvA', el).onclick = () => { done(); open(kind, opts); };
      $('#rvE', el).onclick = done;
    }
    addEventListener('resize', fit);
    fit();
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw Object.assign(new Error('nocam'), { name: 'NoCam' });
      await startCam(); fit();
      setCue('Robo își pregătește ochii… (prima dată durează câteva secunde)');
      loop();
      await loadModel();
      if (!alive) return;
      setCue('Intră în cadru, cu tot corpul.');
      Voice.say('Salut! Pune telefonul jos și intră în cadru, cu tot corpul.', { key: 'hello' });
    } catch (e) {
      stopAll();
      const denied = e && (e.name === 'NotAllowedError' || e.name === 'SecurityError'), nocam = e && (e.name === 'NoCam' || e.name === 'NotFoundError');
      $('.rv-cam', el).innerHTML = `<div class="rv-pick"><div class="rv-top"><button class="iconbtn" id="rvX2" aria-label="Închide">✕</button></div><div class="rv-hero" style="display:block;text-align:center">${root.GymFig ? root.GymFig.robot(80) : '🤖'}<h1>${denied ? 'Robo are nevoie de cameră' : nocam ? 'Nu găsesc camera' : 'Robo n-a putut porni'}</h1>
        <p>${denied ? 'Ai refuzat accesul la cameră. Apasă pe iconița de lângă adresa site-ului (sau în Setări → Safari/Chrome → Cameră) și permite camera, apoi încearcă din nou.' : nocam ? 'Dispozitivul ăsta nu are cameră sau browserul nu o poate folosi. Încearcă de pe telefon, în Chrome sau Safari.' : 'Verifică dacă ai internet (prima dată Robo își descarcă „ochii”, cam 5 MB) și încearcă din nou.'}</p></div>
        <button class="btn btn-acc btn-block" id="rvR2">Încearcă din nou</button></div>`;
      $('#rvX2', el).onclick = close; $('#rvR2', el).onclick = () => { close(); open(kind, opts); };
    }
  }

  root.GymVision = { open: (o) => picker(o || {}), start: open, analyzer, EXV, setAspect: (a) => (ASPECT = a), numRo, _useLandmarker: (l) => { landmarker = l; loading = Promise.resolve(l); } };
})(this);
