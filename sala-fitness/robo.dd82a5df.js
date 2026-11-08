/* Robo: asistentul din secțiunea Mesaje. Răspunde pe loc, fără internet, la întrebări despre
   sală, exerciții, tehnică, dureri, nutriție, recuperare și motivație. Rulează pe server și în demo.
   answer(text, C) -> { text, actions: [{ l, a }], chips: [] } ; C = contextul membrului și al sălii */
(function (root, f) { if (typeof module === 'object' && module.exports) module.exports = f(); else root.GymRobo = f(); })(this, function () {
  'use strict';
  const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9%+ ]+/g, ' ').replace(/\s+/g, ' ').trim();
  const has = (t, re) => re.test(t);
  const pick = (arr, seed) => arr[Math.abs(seed | 0) % arr.length];
  const R = (text, actions = [], chips = []) => ({ text, actions, chips });
  const EXA = (C, id, l) => (C.exercises.some((e) => e.id === id) ? [{ l: l || 'Vezi ' + C.exName(id), a: 'ex:' + id }] : []);

  // cuvinte după care recunoaștem exercițiile (fără diacritice)
  const ALIAS = {
    ex_squat: ['genuflexiuni cu bara', 'genuflexiuni', 'genoflexiuni', 'squat', 'kniebeuge', 'ghemuiri'], ex_goblet: ['goblet'], ex_legpress: ['presa pentru picioare', 'presa de picioare', 'leg press', 'presa picioare', 'presa'],
    ex_lunge: ['fandari', 'fandare', 'lunge', 'lunges'], ex_rdl: ['indreptari romanesti', 'indreptari', 'rdl', 'deadlift', 'romanian'], ex_hipthrust: ['hip thrust', 'thrust'],
    ex_bench: ['impins la piept', 'impins cu bara', 'bench press', 'bench', 'impins orizontal'], ex_dbpress: ['banca inclinata', 'inclinat', 'incline'], ex_pushup: ['flotari', 'flotare', 'push up', 'pushup', 'push-up'],
    ex_fly: ['fluturari la cablu', 'fluturari', 'fly', 'crossover', 'pec deck'], ex_pullup: ['tractiuni la bara', 'tractiuni', 'pull up', 'pullup', 'bara fixa'], ex_latpull: ['helcometru', 'lat pulldown', 'lat pull', 'pulldown', 'scripete sus'],
    ex_row: ['ramat cu gantera', 'ramat', 'row'], ex_cablerow: ['ramat la cablu', 'cable row', 'ramat la aparat'], ex_ohp: ['impins deasupra capului', 'impins deasupra', 'military press', 'ohp', 'presa pentru umeri', 'shoulder press'],
    ex_lateral: ['ridicari laterale', 'laterale', 'lateral raise'], ex_curl: ['flexii biceps', 'flexii', 'curl', 'biceps'], ex_triceps: ['extensii triceps', 'extensii', 'triceps', 'pushdown'], ex_dips: ['paralele', 'dips'],
    ex_plank: ['plansa', 'plank'], ex_crunch: ['abdomene la cablu', 'abdomene', 'crunch'], ex_legraise: ['ridicari de picioare', 'leg raise', 'ridicari picioare'],
    ex_bike: ['bicicleta', 'bike'], ex_treadmill: ['banda de alergare', 'banda', 'treadmill', 'mers inclinat'], ex_rowerg: ['aparat de vaslit', 'vaslit', 'canotaj', 'rower'],
    ex_catcow: ['pisica camila', 'pisica', 'camila', 'cat cow'], ex_birddog: ['bird dog', 'birddog', 'caine pasare'], ex_deadbug: ['dead bug', 'deadbug'], ex_bridge: ['pod fesier', 'glute bridge', 'bridge', 'podul'],
    ex_childpose: ['pozitia copilului', 'child pose'], ex_hipflexor: ['flexorii soldului', 'flexori', 'hip flexor'], ex_chintuck: ['retractia barbiei', 'chin tuck', 'barbie'], ex_wallangel: ['ingerul pe perete', 'wall angel', 'ingerul'],
    ex_facepull: ['face pull', 'facepull'], ex_wallsit: ['scaunul la perete', 'wall sit', 'scaunul'],
  };
  function findExercise(t, C) {
    let best = null, bl = 0;
    for (const e of C.exercises) {
      const keys = [norm(e.name), ...(ALIAS[e.id] || [])];
      for (const k of keys) { if (k.length < 3) continue; const re = new RegExp('(^| )' + k.split(' ').map((w) => w + (w.length >= 4 ? '[a-z]{0,4}' : '')).join(' ') + '( |$)'); if (re.test(t) && k.length > bl) { best = e; bl = k.length; } }
    }
    findExercise.len = bl; return best;
  }
  const GROUPS = [
    ['Piept', /\bpiept|pectoral/], ['Spate', /\bspate(le)?\b|dorsal/], ['Picioare', /\bpicioare|coaps|cvadriceps|gambe/], ['Fesieri', /fesier|funda|fese|glute/],
    ['Umeri', /\bumeri|\bumar/], ['Brațe', /\bbrate|biceps|triceps/], ['Abdomen', /abdomen|abdominal|burta|core\b|patratele|six pack/], ['Cardio', /cardio/], ['Recuperare', /mobilitate|recuperare|stretching|intinder/],
  ];

  const QUOTES = ['Disciplina te duce acolo unde motivația nu mai ajunge.', 'Nu trebuie să fii grozav ca să începi, dar trebuie să începi ca să devii grozav.', 'Cel mai greu antrenament e cel pe care nu-l faci. Restul trec.', 'Progresul mic, făcut zilnic, bate mereu progresul mare făcut o dată.', 'Corpul tău poate aproape orice. Mintea trebuie convinsă.', 'Peste o lună o să-ți mulțumești că n-ai renunțat azi.'];

  function encourage(C, seed) {
    const m = C.me, first = C.first, L = [];
    L.push(pick([`${first}, e normal să ai zile așa. Toți campionii le au. Diferența e că vin oricum.`, `Te înțeleg, ${first}. Nu trebuie să fie un antrenament perfect, doar să fie.`, `${first}, ascultă-mă: azi nu-ți cer să dai 100%. Dă 60%, dar vino.`], seed));
    if (m.streak >= 2) L.push(`Ai deja ${m.streak} zile la rând. Ar fi păcat să rupi seria acum! 🔥`);
    else if (m.weekCount < (m.weekGoal || 3)) L.push(`Săptămâna asta ai ${m.weekCount} din ${m.weekGoal || 3} antrenamente. Încă unul și ești mai aproape de obiectiv.`);
    if (m.rank && m.rank.next && m.rank.toNext <= 300) L.push(`Mai ai doar ${m.rank.toNext} puncte până la rangul ${m.rank.next.name}. Un antrenament îți dă 10, check-in-ul încă 5.`);
    if (C.coach && C.coach.answers && C.coach.answers.why) L.push(`Nu uita de ce ai început: „${C.coach.answers.why}”. 💪`);
    L.push('Truc simplu: îți pui hainele de sală și faci doar încălzirea. 10 minute. De obicei, după asta vrei să continui.');
    L.push('„' + pick(QUOTES, seed + 3) + '”');
    return R(L.join('\n\n'), [{ l: 'Antrenamentul de azi', a: 'tab:train' }, { l: 'Check-in', a: 'checkin' }], ['Nu văd rezultate', 'Ce fac azi?', 'Cât să dorm?']);
  }

  function pain(t, C) {
    if (has(t, /piept.*(doare|durere|apas|strans)|(doare|durere|apasare).*piept|nu pot respira|respir greu|lesin|ameteal.*(puternic|tare)/) && !has(t, /dupa (antrenament|sala)|ieri|febra|muschi|muscul|impins|flotari|fluturari/)) return R('⚠️ Oprește efortul acum și stai jos. Dacă durerea în piept e puternică, se întinde spre braț, gât sau spate, sau ai respirație grea ori amețeală, sună imediat la 112.\n\nNu e ceva de rezolvat cu exerciții. Spune-i și cuiva din sală ce simți.', [{ l: 'Sună la recepție', a: 'call' }], []);
    const red = has(t, /amorte|furnic|iradiaz|coboara in picior|in mana|slabiciune|nu pot (sa )?merg|accident|cazut|umflat|vanat|pocnit|trosnit si doare/);
    if (has(t, /piept|pectoral/) && !red) return R('Dacă te doare pieptul ca mușchi, după flotări sau împins, e de obicei febră musculară sau o mică întindere: trece în câteva zile. Mergi mai ușor la piept până atunci.\n\nDacă simți durerea în fața umărului sau e ascuțită când împingi, redu greutatea și coboară mai puțin.\n\n⚠️ Durerea în piept care nu are legătură cu mușchii, mai ales cu respirație grea, amețeală sau care se întinde în braț, înseamnă 112, imediat.', [], ['Am febră musculară']);
    let z = has(t, /spate|lombar|sale|hernie|sciatic|coloana/) ? 'spate' : has(t, /gat|ceafa|cervical/) ? 'gat' : has(t, /umar|umeri/) ? 'umar' : has(t, /genunch|menisc|rotul/) ? 'genunchi' : has(t, /cot|incheietur|pumn|tendinit/) ? 'cot' : '';
    const intro = red ? '⚠️ Amorțeala, furnicăturile, durerea care coboară în mână sau picior, umflătura sau o lovitură trebuie văzute de un medic sau kinetoterapeut înainte să te antrenezi pe zona aceea.\n\nPână atunci evită efortul care o provoacă. Eu nu pot pune diagnostice, dar te pot ajuta cu ce e sigur:\n\n' : '';
    const T = {
      spate: ['Pentru spatele de jos, mișcarea potrivită ajută de obicei mai mult decât repausul complet:', '• Pisica–cămila și bird-dog, zilnic, 2×10', '• Pod fesier: fesierii puternici iau din efortul spatelui', '• Mers 20–30 de minute pe zi', '• Evită pe moment genuflexiunile cu bara și îndreptările grele', '• Când ridici ceva, îndoaie genunchii și ține spatele drept', ['ex_catcow', 'ex_birddog', 'ex_bridge']],
      gat: ['Pentru gât și partea de sus a spatelui:', '• Retracția bărbiei: 10 repetări de câteva ori pe zi', '• Îngerul pe perete, 2×10', '• Ține telefonul la nivelul ochilor', '• Ia pauze scurte dacă stai mult la calculator', '• Evită pe moment împinsul deasupra capului cu greutăți mari', ['ex_chintuck', 'ex_wallangel']],
      umar: ['Pentru umăr:', '• Lucrează doar în amplitudinea fără durere', '• Face pull cu greutate mică, 3×15, întărește spatele umărului', '• Evită pe moment paralelele, împinsul deasupra capului și împinsul greu la piept', '• Încălzește-te bine cu benzi sau greutăți mici înainte', ['ex_facepull', 'ex_wallangel']],
      genunchi: ['Pentru genunchi:', '• Bicicleta e cel mai prietenos cardio', '• Scaunul la perete și podul fesier întăresc fără să încarce articulația', '• La genuflexiuni, coboară doar cât nu doare, cu genunchii pe direcția vârfurilor', '• Evită pe moment fandările și săriturile', ['ex_wallsit', 'ex_bridge', 'ex_bike']],
      cot: ['Pentru cot sau încheietură:', '• Redu greutatea la exercițiile care provoacă durerea', '• Prinde bara sau ganterele fără să îndoi încheietura', '• Pune gheață 10–15 minute după efort, dacă e iritat', '• Dacă durerea ține mai mult de 2 săptămâni, mergi la un specialist', []],
    };
    if (!z) return R(intro + 'Spune-mi unde te doare exact (spate, gât, umăr, genunchi, cot) și cum e durerea, ca să te pot ajuta mai bine.\n\nRegula de aur: durerea nu trebuie să crească în timpul exercițiilor. Dacă crește, te oprești.', [{ l: 'Scrie-le pe WhatsApp', a: 'human' }], ['Mă doare spatele', 'Mă doare genunchiul', 'Mă doare umărul']);
    const x = T[z], ids = x[x.length - 1];
    const txt = intro + x.slice(0, -1).join('\n') + '\n\nDacă durerea crește în timpul exercițiilor, oprește-te. Dacă nu trece în 1–2 săptămâni, mergi la medic.';
    return R(txt, [...ids.flatMap((id) => EXA(C, id)).slice(0, 2), { l: 'Fă-mi un plan pentru asta', a: 'plan' }], ['Pot să mă antrenez cu durere?', 'Febră musculară sau accidentare?']);
  }

  function gymInfo(t, C) {
    const S = C.S;
    if (has(t, /\borar|deschis|inchide|deschide|program(ul)? (al |de la )?sal|program de lucru|la ce ora|duminica|sambata|sarbator/)) return R(`Programul sălii:\n${(S.hours || []).map((h) => `• ${h.d}: ${h.h}`).join('\n')}${C.crowd ? `\n\nAcum la sală sunt aproximativ ${C.crowd.now} ${C.crowd.now === 1 ? 'persoană' : 'persoane'}.` : ''}`, [], ['E aglomerat acum?', 'Cât costă abonamentul?']);
    if (has(t, /aglomer|liber[aă]?\b|multa lume|putina lume|cand e (mai )?(liber|gol)|cata lume|cati oameni/)) {
      const c = C.crowd; if (!c) return R('Nu am date despre aglomerație acum.');
      const LV = ['Sala e aproape goală', 'E liniște', 'Moderat', 'E aglomerat']; const pk = c.hours.reduce((a, x) => (x.n > a.n ? x : a), { n: -1 });
      const low = c.hours.filter((x) => x.n > 0).sort((a, b) => a.n - b.n)[0];
      return R(`${LV[c.level]}: acum sunt aproximativ ${c.now} ${c.now === 1 ? 'persoană' : 'persoane'} la sală.${pk.n > 0 ? `\n\nDe obicei, în ziua asta, cel mai aglomerat e în jur de ora ${pk.h}:00${low ? `, iar cel mai liniștit în jur de ${low.h}:00` : ''}.` : ''}`, [{ l: 'Check-in', a: 'checkin' }]);
    }
    if (has(t, /abonamentul meu|imi expira|expira|cate zile (mai )?am|valabil|cand (trebuie sa )?platesc|reinno/)) {
      const s = C.me.subscription;
      if (!s.end) return R('Nu ai încă un abonament activ în aplicație. Treci pe la recepție și ți-l activează pe loc.', [{ l: 'Prețuri', a: 'say:Cât costă abonamentul?' }]);
      return R(s.state === 'expired' ? `Abonamentul tău (${s.plan ? s.plan.name : ''}) a expirat pe ${C.fdate(s.end)}. Îl poți reînnoi la recepție. Te așteptăm! 💪` : `Abonamentul tău ${s.plan ? s.plan.name : ''} e valabil până pe ${C.fdate(s.end)}. Mai ai ${s.daysLeft} ${s.daysLeft === 1 ? 'zi' : 'zile'}.${s.daysLeft <= 3 ? '\n\nExpiră curând: reînnoiește-l la recepție, ca să nu pierzi nicio zi.' : ''}`, [{ l: 'Abonament și plăți', a: 'sub' }]);
    }
    if (has(t, /\bpret|preturi|costa|cat e (un |o )?abonament|tarif|abonament(e|ul)? (lunar|anual|pe luna|elev|student)|cat dau|cat platesc|ce abonamente/)) return R(`Abonamentele sălii:\n${C.plans.map((p) => `• ${p.name}: ${p.price} lei${p.desc ? ` (${p.desc})` : ''}`).join('\n')}\n\nSe plătesc la recepție, cu numerar sau card.`, [], ['Ce servicii mai aveți?', 'Programul sălii']);
    if (has(t, /antrenor personal|personal trainer|\bpt\b|sedint|antrenor(ul|ii|i)?\b/)) return R('Sala nu are antrenori personali, dar sunt eu aici! 🤖 Îți fac programul de antrenament după scopul tău, îți explic orice exercițiu pas cu pas și îți răspund oricând. Pentru altceva, scrie-le celor de la recepție pe WhatsApp.', [{ l: 'Fă-mi programul', a: 'plan' }, { l: 'Scrie-le pe WhatsApp', a: 'human' }]);
    if (has(t, /adresa|unde (e|este|sunteti|va gasesc|gasesc)|locatie|cum ajung|harta/)) return R(`${S.name}${S.address ? `\n📍 ${S.address}` : ''}${S.phone ? `\n📞 ${S.phone}` : ''}`, S.mapsUrl ? [{ l: 'Deschide harta', a: 'url:' + S.mapsUrl }] : []);
    if (has(t, /telefon|\bnumar(ul)?\b|whatsapp|contact|\bsun(a|ati)?\b|email/)) return R(`Ne găsești așa:${S.phone ? `\n📞 ${S.phone}` : ''}${S.whatsapp ? '\n💬 WhatsApp, din butonul de mai jos' : ''}${S.email ? `\n✉️ ${S.email}` : ''}`, [...(S.whatsapp ? [{ l: 'WhatsApp', a: 'wa' }] : []), ...(S.phone ? [{ l: 'Sună', a: 'call' }] : [])]);
    if (has(t, /check ?in|cum intru|codul de intrare|cod(ul)? qr|scanez|intrare/)) return R('Check-in-ul se face în 2 secunde:\n• Apasă „Check-in” pe pagina principală\n• Scanează codul QR de la recepție sau scrie codul de 4 cifre\n\nPrimești +5 puncte la fiecare vizită. Poți arăta și cardul tău (atinge cardul și se întoarce cu codul QR).', [{ l: 'Fă check-in', a: 'checkin' }]);
    if (has(t, /punct|rang|clasament|insign|premi|recompens|nivel(ul)? meu/)) {
      const m = C.me; return R(`Ai ${m.points.balance} puncte și rangul ${m.rank.name}.${m.rank.next ? ` Mai ai ${m.rank.toNext} puncte până la ${m.rank.next.name}.` : ' E cel mai înalt rang!'}${C.board && C.board.me && C.board.me.rank ? `\nÎn clasamentul lunii ești pe locul ${C.board.me.rank}.` : ''}\n\nCum strângi puncte:\n• Antrenament: +10\n• Check-in: +5\n• Provocarea zilei: +5\n• Fiecare insignă: +50\n\nPunctele le poți schimba pe premii la recepție.`, [{ l: 'Clasament', a: 'board' }]);
    }
    return null;
  }

  function training(t, C) {
    if (has(t, /(ce|cum) (fac|lucrez|antrenez|am)( eu)? azi|antrenamentul (de )?azi|ce zi (am|urmeaza)|ce urmeaza|ce lucrez|programul meu|planul meu/) && !has(t, /\b(fa|faci|creeaza|schimba|vreau|nou)\b/)) {
      const p = C.program; if (!p) return R('Nu ai încă un program ales. Hai să-ți fac unul în un minut: îți pun câteva întrebări și gata.', [{ l: 'Fă-mi programul', a: 'plan' }]);
      const d = p.days[C.nextDay] || p.days[0];
      return R(`Azi urmează ${d.name} din „${p.name}”:\n${d.items.map((i) => `• ${C.exName(i.ex)}: ${i.sets} × ${i.reps}${i.kg ? `, ${i.kg} kg` : ''}`).join('\n')}\n\nCam ${Math.max(20, d.items.length * 6)} de minute. Spor! 💪`, [{ l: 'Începe antrenamentul', a: 'start' }]);
    }
    if (has(t, /(fa|faci|fa-mi|creeaza|schimba|vreau|da-mi|construieste)( mi)?( un| alt)? (program|plan)|program nou|plan nou|plan de antrenament/)) return R('Sigur! Îți pun câteva întrebări (scop, dureri, câte zile poți veni, cât timp ai) și îți fac programul pe loc.', [{ l: 'Hai să-l facem', a: 'plan' }]);
    if (has(t, /incepator|prima (data|zi)|nou la sala|de unde (sa )?incep|nu stiu nimic|n am mai fost/)) return R('Bun venit! Primele 4–6 săptămâni sunt despre învățat mișcările, nu despre greutăți mari:\n• 3 antrenamente pe săptămână, pe tot corpul\n• 2–3 serii a câte 10–12 repetări\n• Greutăți cu care ai putea face încă 2–3 repetări la final\n• Încălzire 5–10 minute pe bicicletă sau bandă\n• Nu te compara cu alții: fiecare a început de undeva\n\nIar la orice nelămurire, întreabă-mă pe mine.', [{ l: 'Fă-mi programul', a: 'plan' }, { l: 'Programul „Start în sală”', a: 'tab:train' }]);
    if (has(t, /cate serii|cate repetari|serii|repetari|reps/)) return R('Depinde de scop:\n• Forță: 3–5 serii × 3–6 repetări, pauză 2–3 minute\n• Masă musculară: 3–4 serii × 6–12 repetări, pauză 1–2 minute\n• Tonifiere și rezistență: 2–3 serii × 12–20 repetări, pauză 45–60 s\n\nUltimele 2 repetări trebuie să fie grele, dar cu tehnică bună.', [], ['Ce greutate să folosesc?', 'Cât de des să vin?']);
    if (has(t, /cat (de )?greu|ce greutate|cate kg|cat sa (ridic|pun)|cu cat sa|greutatea potrivita|cand (sa )?cresc|progres/)) return R('Regula simplă: alege o greutate cu care termini repetările propuse și ai mai putea face încă 1–2.\n\nCând reușești toate seriile ușor la două antrenamente la rând, crește puțin: +2,5 kg la exercițiile mari, +1 kg la cele mici.\n\nNotează greutățile în aplicație, la antrenament: îți arăt data trecută ce ai ridicat.', [], ['Câte serii să fac?']);
    if (has(t, /cat de des|de cate ori pe saptamana|cate (zile|antrenamente)|in fiecare zi|zilnic/)) return R('Pentru majoritatea oamenilor, 3–4 antrenamente pe săptămână sunt ideale. Un mușchi are nevoie de 48 de ore ca să se refacă după un antrenament greu.\n\nPoți veni și zilnic dacă alternezi grupele (de exemplu, sus și jos) și dormi bine. În zilele libere, mersul pe jos e perfect.', [], ['Cât să dorm?']);
    if (has(t, /pauza intre|cat (sa )?(stau|astept|ma odihnesc) intre|odihna intre serii/)) return R('Pauza dintre serii:\n• Exerciții grele (genuflexiuni, împins, îndreptări): 2–3 minute\n• Exerciții pentru masă: 60–90 s\n• Exerciții mici sau tonifiere: 45–60 s\n\nAplicația pornește singură cronometrul de pauză când bifezi o serie. ⏱️');
    if (has(t, /incalzi|incalzire|warm ?up/)) return R('Încălzirea bună durează 5–10 minute:\n• 5 minute bicicletă, bandă sau vâslit, în ritm ușor\n• Câteva mișcări de mobilitate: rotiri de umeri, șolduri, pisica–cămila\n• La primul exercițiu, 1–2 serii ușoare cu greutate mică\n\nAșa reduci riscul de accidentare și ești mai puternic în seriile grele.', EXA(C, 'ex_catcow'));
    if (has(t, /stretch|intinder|flexibil|mobilit/)) return R('Întinderile se fac cel mai bine la final, 20–40 de secunde pe fiecare mușchi, fără să forțezi până la durere.\n\nCele mai utile, mai ales dacă stai mult pe scaun:\n• Întinderea flexorilor șoldului\n• Poziția copilului, pentru spate\n• Îngerul pe perete, pentru umeri și postură', [...EXA(C, 'ex_hipflexor'), ...EXA(C, 'ex_childpose')]);
    if (has(t, /cardio|alerg|banda|bicicleta|cat cardio/) && !findExercise(t, C)) return R('Cardio-ul e bun pentru inimă, energie și slăbit:\n• Ca încălzire: 5–10 minute ușor\n• Pentru slăbit: 20–30 minute după forță, de 2–3 ori pe săptămână\n• Mersul înclinat pe bandă arde mult și e blând cu genunchii\n• Intervale: 30 s tare, 60 s ușor, de 8–10 ori\n\nNu-l face înaintea forței dacă vrei să ridici greu.', EXA(C, 'ex_treadmill'));
    if (has(t, /febra|ma dor (muschii|picioarele|bratele|toti)|carcei|ma doare tot|dupa antrenament ma doare/)) return R('Febra musculară (durerea la 1–2 zile după antrenament) e normală, mai ales la început sau după exerciții noi. Trece în 2–4 zile.\n\nCe ajută:\n• Mișcare ușoară: mers, bicicletă\n• Somn bun și apă\n• Proteine suficiente\n\nDiferența față de o accidentare: febra e pe tot mușchiul și scade în câteva zile. Durerea ascuțită, pe un punct anume sau la încheietură, nu e febră musculară. Atunci te oprești și ceri sfatul unui specialist.', [], ['Pot să mă antrenez cu febră musculară?']);
    if (has(t, /antrenez cu febra|cu febra musculara|antrena cu durere|antrenez cu durere|antrenez daca (ma doare|am febra)/)) return R('Cu febră musculară, da: un antrenament ușor sau pe alte grupe chiar ajută.\n\nCu durere ascuțită, pe o articulație sau care crește în timpul efortului, nu: oprește-te și lasă zona să se refacă.\n\nCând ești răcit: dacă ai doar nasul înfundat, poți face ceva ușor. Dacă ai febră sau te doare tot corpul, stai acasă.');
    if (has(t, /somn|dorm|odihn|recuper|zi libera|zile libere|suprasolicit/)) return R('Mușchii cresc când te odihnești, nu în timpul antrenamentului:\n• Dormi 7–9 ore pe noapte\n• Lasă cel puțin o zi între antrenamentele grele pe aceeași grupă\n• Ia 1–2 zile libere pe săptămână, cu plimbări ușoare\n• Dacă ești mereu obosit și forța scade, ia o săptămână mai ușoară');
    if (has(t, /abdomen|burta|patratele|six ?pack|abdomenul plat|grasime pe burta/)) return R('Două lucruri, ambele necesare:\n1. Mușchii abdominali se întăresc cu planșă, dead bug și ridicări de picioare, de 2–3 ori pe săptămână.\n2. Ca să se vadă, trebuie să scadă grăsimea de deasupra. Asta se face cu alimentație și antrenament pe tot corpul, nu cu sute de abdomene.\n\nNu se poate slăbi doar de pe burtă. Corpul slăbește peste tot, în ordinea lui.', [...EXA(C, 'ex_plank'), ...EXA(C, 'ex_deadbug')]);
    if (has(t, /ma umflu|prea musculoasa|prea mare|femeile.*(greutati|fiare)|fetele.*(greutati|fiare)/)) return R('Nu te „umfli” de la greutăți! Masa musculară se pune foarte greu, mai ales la femei, din cauza hormonilor. Ce primești de fapt: un corp ferm, fesieri mai rotunzi, postură mai bună și metabolism mai rapid.\n\nGreutățile sunt cel mai bun prieten al tonifierii.');
    if (has(t, /tehnica|forma corecta|executie|corect/) && !findExercise(t, C)) return R('Spune-mi exercițiul și îți explic pas cu pas cum se face corect. De exemplu: „cum fac genuflexiuni?”\n\nPoți scana și codul QR de pe aparat: se deschide direct animația cu explicații.', [{ l: 'Ghidul exercițiilor', a: 'tab:train' }]);
    return null;
  }

  function nutrition(t, C) {
    if (has(t, /\b(fa|faci|vreau|creeaza|da|schimba|refa)\b.*(dieta|plan alimentar|meniu)|dieta (personala|mea|pentru mine)|ce dieta|o dieta/)) return R('Sigur! Îți fac o dietă pe gustul tău: te întreb ce-ți place, ce nu mănânci, alergii și câte mese vrei, apoi îți calculez mesele cu grame și calorii. 🥗', [{ l: 'Fă-mi dieta', a: 'diet' }]);
    if (has(t, /robo te vede|camera|numar(a|i)? repetari|imi numeri|verifica(-mi)? forma|forma mea|ma (vezi|filmezi)|corecteaza(-mi)? (forma|tehnica)/)) return R('Da! 📷 Pune telefonul jos, cu camera spre tine, și eu îți număr repetările și îți spun pe loc ce să corectezi, cu voce. Merge la genuflexiuni, flotări, fandări, biceps și planșă. Imaginea rămâne în telefonul tău.', [{ l: '📷 Pornește Robo te vede', a: 'vision' }]);
    if (has(t, /protein|whey/)) { const kg = C.kg; return R(`Ca să crești sau să păstrezi mușchii, ai nevoie de 1,6–2 g de proteine pe kilogram de corp pe zi${kg ? ` (pentru tine, cam ${Math.round(kg * 1.6)}–${Math.round(kg * 2)} g)` : ''}.\n\nSurse bune: pui, curcan, ouă, pește, iaurt grecesc, brânză de vaci, fasole, linte. Pudra proteică (whey) e doar o metodă comodă, nu e obligatorie.\n\nÎmparte proteinele în 3–4 mese.`, [{ l: 'Planul meu alimentar', a: 'tab:food' }], ['Câte calorii să mănânc?']); }
    if (has(t, /calori|kcal|cat (sa )?mananc|cata mancare/)) return R(C.kcal ? `După datele tale, ținta ta e în jur de ${C.kcal} kcal pe zi${C.me.goal ? ` (obiectiv: ${C.me.goal})` : ''}. Țin cont de greutate, înălțime, vârstă și antrenamente.\n\nCântărește-te o dată pe săptămână, la aceeași oră. Dacă greutatea nu se mișcă 2–3 săptămâni, ajustează cu 150–200 kcal.` : 'Ca să-ți calculez caloriile, am nevoie de greutate, înălțime și data nașterii. Completează-le în Profil și în Progres (greutatea), apoi întreabă-mă din nou.\n\nOrientativ: pentru slăbit, cu 300–500 kcal sub necesar. Pentru masă, cu 200–300 kcal peste.', [{ l: 'Nutriție', a: 'tab:food' }]);
    if (has(t, /creatin/)) return R('Creatina monohidrat e cel mai studiat supliment și e sigur pentru oamenii sănătoși: 3–5 g pe zi, în fiecare zi, oricând. Ajută la forță și la refacere.\n\nPoate apărea 1–2 kg de apă în mușchi la început, e normal. Dacă ai probleme cu rinichii, întreabă întâi medicul.');
    if (has(t, /suplimente|bcaa|pre ?workout|preworkout|vitamin|arzator|fat burner|steroiz|anabolic/)) return has(t, /steroiz|anabolic/) ? R('Nu recomand steroizi sau alte substanțe de felul ăsta. Au riscuri serioase pentru inimă, ficat și hormoni, și sunt interzise fără prescripție. Rezultate foarte bune se obțin și natural, cu antrenament constant, mâncare bună și somn.') : R('Suplimentele sunt doar 5% din rezultat. Baza e mâncarea, somnul și antrenamentul.\n\nCe merită, eventual:\n• Proteină din pudră, dacă nu ajungi la proteine din mâncare\n• Creatină, 3–5 g pe zi\n• Vitamina D iarna (întreabă medicul)\n\nArzătoarele de grăsimi și BCAA-urile nu fac mare lucru. Pre-workout-ul are multă cafeină: nu-l lua seara.');
    if (has(t, /inainte de (antrenament|sala)|ce (sa )?manan.*inainte/)) return R('Cu 1–3 ore înainte de antrenament: o masă cu carbohidrați și ceva proteine. De exemplu: orez cu pui, ovăz cu iaurt, o banană cu brânză de vaci, pâine integrală cu ouă.\n\nDacă mănânci cu puțin timp înainte, alege ceva ușor, ca o banană. Și bea apă!');
    if (has(t, /dupa (antrenament|sala)|ce (sa )?manan.*dupa/)) return R('După antrenament, în următoarele 1–2 ore: proteine plus carbohidrați. De exemplu: pui cu cartofi, ton cu paste, omletă cu pâine, iaurt grecesc cu fructe și ovăz.\n\nNu trebuie să fie în 30 de minute exact. Contează mai mult ce mănânci în toată ziua.');
    if (has(t, /\bapa\b|hidrat|cata apa|cate litri/)) return R('Bea în jur de 30–35 ml de apă pe kilogram pe zi, plus încă 0,5–1 l în zilele de antrenament. Un semn bun: urina deschisă la culoare.\n\nÎn aplicație, la Nutriție, poți bifa paharele de apă. 💧', [{ l: 'Nutriție', a: 'tab:food' }]);
    if (has(t, /alcool|bere|vin\b|petrecere/)) return R('Alcoolul încetinește refacerea, strică somnul și are multe calorii (o bere are cam 200 kcal). Ocazional nu strică tot progresul, dar seara de după antrenament e cel mai prost moment.\n\nDacă bei, bea și apă și nu sări peste mesele cu proteine.');
    if (has(t, /slab|slabesc|slabire|kilograme in minus|dau jos|grasime|cum slabesc/)) return R('Pentru slăbit, rețeta e simplă, chiar dacă nu e ușoară:\n• Mănânci cu 300–500 kcal sub necesar\n• Proteine la fiecare masă: te țin sătul și păstrează mușchii\n• Antrenament de forță de 3 ori pe săptămână, plus 20–30 minute de cardio\n• 8–10 mii de pași pe zi\n• Somn 7–8 ore\n\nUn ritm sănătos e 0,5–1 kg pe săptămână. Mai repede de atât pierzi și mușchi.', [{ l: 'Câte calorii am nevoie?', a: 'say:Câte calorii să mănânc?' }]);
    if (has(t, /masa musculara|sa cresc|sa pun (masa|kilograme|muschi)|mai mare|volum|sa ma ingras/)) return R('Pentru masă musculară:\n• Mănânci cu 200–300 kcal peste necesar\n• 1,6–2 g de proteine pe kilogram pe zi\n• Antrenament cu greutăți, 6–12 repetări, și crești greutatea treptat\n• Somn 7–9 ore\n• Răbdare: un începător pune cam 0,5–1 kg de mușchi pe lună\n\nNotează greutățile în aplicație, ca să vezi progresul.', [{ l: 'Fă-mi programul pentru masă', a: 'plan' }]);
    if (has(t, /ce (sa )?manan|mancare|dieta|alimentati|meniu|retet|mic dejun|cina|seara (sa )?manan/)) return R('Câteva reguli simple:\n• Proteine la fiecare masă (carne, ouă, pește, lactate, leguminoase)\n• Legume la prânz și la cină\n• Carbohidrați mai ales în jurul antrenamentului (orez, cartofi, ovăz, paste)\n• Puține dulciuri și sucuri\n• Nu contează ora la care mănânci, ci cât mănânci în total pe zi\n\nÎn tab-ul Nutriție ai un plan cu mese gata făcute.', [{ l: 'Planul alimentar', a: 'tab:food' }], ['Câte proteine?', 'Ce mănânc înainte de sală?']);
    return null;
  }

  function exerciseAnswer(e, C) {
    const steps = (e.steps || []).map((s, i) => `${i + 1}. ${s}`).join('\n');
    return R(`${e.name} (${e.muscle}, ${e.level}):\n${steps}${e.tip ? `\n\n💡 ${e.tip}` : ''}`, [{ l: 'Vezi animația', a: 'ex:' + e.id }], ['Câte serii să fac?', 'Ce greutate să folosesc?']);
  }
  function groupAnswer(g, C) {
    const list = C.exercises.filter((e) => e.muscle === g || (g === 'Picioare' && e.muscle === 'Femurali și fesieri') || (g === 'Fesieri' && e.muscle === 'Femurali și fesieri'));
    if (!list.length) return null;
    return R(`Exerciții pentru ${g.toLowerCase()}:\n${list.slice(0, 7).map((e) => `• ${e.name} (${e.level})`).join('\n')}\n\nAlege 2–3 dintre ele pe antrenament, 3 serii a câte 8–12 repetări. Atinge unul ca să vezi cum se face.`, list.slice(0, 3).map((e) => ({ l: e.name, a: 'ex:' + e.id })));
  }


  /* ── baza de cunoștințe extinsă + corectarea greșelilor de scriere ── */
  const KB = () => (typeof GymRoboKB !== 'undefined' ? GymRoboKB : typeof require === 'function' ? require('./robo-kb.js') : { TOPICS: [], EXTRA: [] });
  function lev(a, b) { if (Math.abs(a.length - b.length) > 2) return 9; const d = Array.from({ length: a.length + 1 }, (_, i) => [i]); for (let j = 1; j <= b.length; j++) d[0][j] = j; for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); return d[a.length][b.length]; }
  const STOP = new Set('pentru care este sunt foarte despre acum dupa inainte cand unde poate trebuie vreau aveti faceti multe putin mult tare bine rau aceasta acesta astazi maine ieri saptamana zile sala salii doare'.split(' '));
  const BASEW = 'numarul numar numarului telefon telefonul adresa adresei locatie contact whatsapp deschis inchis deschide inchide costa pretul orarul programul puncte punctele rangul clasament clasamentul checkin intrare abonamentului expira valabil aglomerata mancarea genuflexiuni fandari indreptari flotari tractiuni abdomene plansa biceps triceps umeri spate piept picioare fesieri genunchi genunchiul spatele umarul gatul durere dureri proteine proteina calorii creatina suplimente slabesc slabit slabire masa musculara incalzire intinderi stretching cardio alergare abonament abonamentul program programul aglomerat deschis pret preturi antrenament antrenamentul exercitii exercitiu motivatie obosit renunt rezultate somn odihna febra musculara mananc mancare dieta alimentatie greutate repetari serii pauza'.split(' ');
  let VOCAB = null;
  function vocab(C) {
    if (VOCAB) return VOCAB; const v = new Set(BASEW);
    const addW = (str) => norm(str).split(' ').forEach((w) => { if (w.length >= 5) v.add(w); });
    Object.values(ALIAS).flat().forEach(addW); C.exercises.forEach((e) => addW(e.name));
    const kb = KB(); kb.TOPICS.forEach((tp) => tp.k.forEach(addW)); kb.EXTRA.forEach((e) => { addW(e.name); e.k.forEach(addW); });
    return (VOCAB = [...v]);
  }
  function fix(t, C) {
    const V = vocab(C), set = new Set(V);
    return t.split(' ').map((w) => { if (w.length < 5 || set.has(w) || STOP.has(w)) return w; let best = null, bd = 9; for (const x of V) { const d = lev(w, x); if (d < bd) { bd = d; best = x; } } return bd <= (w.length >= 9 ? 2 : 1) ? best : w; }).join(' ');
  }
  function topicScore(t) {
    const words = t.split(' '); let best = null, bs = 0;
    for (const tp of KB().TOPICS) {
      let sc = 0;
      for (const k of tp.k) {
        if (k.includes(' ')) { if (t.includes(k)) sc += 2; }
        else if (words.some((w) => w === k || (k.length >= 4 && w.startsWith(k) && w.length - k.length <= (k.length >= 7 ? 3 : 2)) || (k.length >= 6 && lev(w.slice(0, k.length + 1), k) <= 1))) sc += 1;
      }
      if (tp.p && sc) sc += 1;
      if (sc > bs) { bs = sc; best = tp; }
    }
    return best ? { tp: best, score: bs } : null;
  }
  const topicR = (tp) => R(tp.a, tp.act || [], tp.c || []);
  function extraExercise(t) {
    let best = null, bl = 0;
    for (const e of KB().EXTRA) for (const k of [norm(e.name), ...e.k]) if (k.length >= 4 && new RegExp('(^| )' + k.split(' ').map((w) => w + (w.length >= 4 ? '[a-z]{0,4}' : '')).join(' ') + '( |$)').test(t) && k.length > bl) { best = e; bl = k.length; }
    if (best) best.bl = bl; return best;
  }
  const GYMWORDS = /sal|antren|exerci|muschi|forta|kg|greutat|aparat|gantere|bara|slab|grasim|kilogram|mananc|manca|protein|calori|dieta|durer|doare|spate|picio|brat|burt|abdomen|fesier|piept|umer|cardio|alerg|somn|odihn|motiv|abonament|program|corp|sport|fitness|gym|sanatat|apa|energi/;
  function answer(raw, C) {
    const t0 = norm(raw), t = t0 ? fix(t0, C) : t0, seed = raw.length + (C.seed || 0);
    if (!t) {
      const m = C.me, L = [`Salut, ${C.first}! 👋 Sunt Robo și îți răspund pe loc la orice întrebare despre sală: exerciții, tehnică, dureri, mâncare, odihnă, abonament sau program.`];
      if (m.streak >= 2) L.push(`Apropo, ești la ${m.streak} zile la rând. Super! 🔥`); else L.push('Și când nu ai chef de sală, scrie-mi. Te scot eu din canapea. 😄');
      return R(L.join('\n\n'), [], ['Ce fac azi?', 'Cum fac genuflexiuni corect?', 'Mă doare spatele', 'Câte proteine îmi trebuie?', 'N-am chef azi']);
    }
    if (has(t, /^(multumesc|mersi|ms|merci|mulțumesc|mersii|thanks|thank you)\b|\bmultumesc frumos/)) return R(pick(['Cu drag! 💪 Spor la antrenament!', 'Oricând! Ne vedem la sală. 😎', 'Cu plăcere! Și nu uita de check-in. 😉'], seed));
    if (has(t, /^(pa|la revedere|noapte buna|bye|ciao|o zi buna)\b/)) return R(pick(['Pa! Odihnește-te bine, mâine continuăm. 🌙', 'Pa, pa! Te aștept la următorul antrenament. 💪'], seed));

    if (has(t, /febra|ma dor (muschii|toti)|carcei|antrenez cu febra/)) return training(t, C);
    if (has(t, /\bdoare|durere|dureri|junghi|lombar|hernie|sciatic|tendinit|accident|entors|luxat|ma jeneaza|disconfort/)) return pain(t, C);
    const top = topicScore(t);
    if (top && top.score >= 2) return topicR(top.tp);
    if (has(t, /chef|lene|lenes|obosit|motivat|motivatie|renunt|nu vad rezultat|nu mai pot|demotivat|plictis|nu am timp|n am timp|descuraj|incurajare|incurajeaza|greu sa vin|nu vreau sa vin|sunt gras|ma simt rau cu mine/)) {
      if (has(t, /nu vad rezultat|nu slabesc|stau pe loc|nu progresez|nu cresc/)) return R(`Hai să ne uităm împreună, ${C.first}. Rezultatele vin de obicei după 4–8 săptămâni de constanță, nu după 2.\n\nVerifică trei lucruri:\n1. Vii de cel puțin 3 ori pe săptămână? Săptămâna asta ai ${C.me.weekCount} antrenamente.\n2. Crești greutățile treptat? Notează-le la fiecare antrenament.\n3. Mâncarea și somnul se potrivesc cu scopul?\n\nUită-te și la centimetri și poze, nu doar la cântar. Uneori talia scade înainte de kilograme. 💪`, [{ l: 'Progresul meu', a: 'tab:progress' }]);
      if (has(t, /nu am timp|n am timp/)) return R('Nici nu ai nevoie de mult! 30 de minute de 3 ori pe săptămână schimbă corpul.\n\nVariante scurte:\n• 3–4 exerciții mari, câte 3 serii, pauze scurte\n• Combină 2 exerciții fără pauză între ele (superset)\n• În zilele aglomerate, chiar și 15 minute contează\n\nVrei să-ți refac programul pe 30 de minute?', [{ l: 'Program de 30 de minute', a: 'plan' }]);
      return encourage(C, seed);
    }
    const g = gymInfo(t, C); if (g) return g;
    const tr = training(t, C); if (tr) return tr;
    const n = nutrition(t, C); if (n) return n;
    if (top && top.score >= 1 && !findExercise(t, C)) return topicR(top.tp);
    const xe = extraExercise(t);
    let ex = findExercise(t, C); if (ex && xe && xe.bl > findExercise.len) ex = null;
    if (has(t, /exercit|ce (sa )?fac pentru|cum (lucrez|antrenez|cresc)|pentru (piept|spate|picioare|fesier|funda|abdomen|umeri|brate|biceps|triceps)/) && !(ex && !has(t, /exercit/))) {
      for (const [gname, re] of GROUPS) if (re.test(t)) { const a = groupAnswer(gname, C); if (a) return a; }
    }
    if (ex) return exerciseAnswer(ex, C);
    if (xe) return R(`${xe.name} (${xe.muscle}):\n${xe.steps.map((x, i) => `${i + 1}. ${x}`).join('\n')}${xe.tip ? `\n\n💡 ${xe.tip}` : ''}`, [], ['Câte serii să fac?', 'Ce greutate să folosesc?']);
    if (top && top.score >= 1) return topicR(top.tp);
    for (const [gname, re] of GROUPS) if (re.test(t) && t.split(' ').length <= 4) { const a = groupAnswer(gname, C); if (a) return a; }
    if (has(t, /^(salut|buna|hey|hei|hello|neata|servus|ce faci|ce mai faci|noroc|sal)\b/)) return R(pick([`Salut, ${C.first}! 😄 Cu ce te pot ajuta azi?`, `Hei, ${C.first}! Gata de antrenament? Întreabă-mă orice.`], seed), [], ['Ce fac azi?', 'N-am chef azi', 'E aglomerat acum?']);
    if (has(t, /cine esti|ce esti|esti om|esti robot|esti ai/)) return R('Sunt Robo 🤖, asistentul virtual al sălii. Știu exercițiile, programul tău, programul sălii, abonamentele și multe despre antrenament și mâncare. Pentru lucruri personale îți dau legătura directă cu sala, pe WhatsApp sau telefon.');
    if (!GYMWORDS.test(t)) return R(`Eu mă pricep doar la sală, mișcare și mâncare sănătoasă, ${C.first}. 😄 Acolo te ajut cu orice: exerciții, planuri, dureri, nutriție sau motivație.`, [], ['Ce fac azi?', 'N-am chef azi', 'Câte proteine îmi trebuie?']);
    return R(`N-am prins exact întrebarea, ${C.first}. 🤔 Încearcă să mi-o scrii altfel, de exemplu:\n• „Cum fac fandări?”\n• „Ce mănânc după sală?”\n• „Mă doare genunchiul”\n• „Cum fac să-mi crească fesierii?”\n\nSau scrie-le celor de la sală pe WhatsApp și te ajută ei.`, [{ l: 'Scrie-le pe WhatsApp', a: 'human' }], ['Ce fac azi?', 'Exerciții pentru spate', 'N-am chef azi']);
  }
  return { answer, norm };
});
