/* Date de pornire: biblioteca de exerciții, programe, planuri alimentare, mesaje zilnice
   și (opțional) membri demonstrativi. Rulează și pe server, și în demo-ul din browser. */
(function (root, f) { if (typeof module === 'object' && module.exports) module.exports = f(); else root.GymSeed = f(); })(this, function () {
  const yt = (q) => 'https://www.youtube.com/results?search_query=' + encodeURIComponent(q + ' executie corecta');

  const EXERCISES = [
    ['ex_squat', 'Genuflexiuni cu bara', 'Picioare', 'Bară', 'mediu', ['Bara pe trapez, nu pe gât. Picioarele la lățimea umerilor, vârfurile ușor în afară.', 'Inspiră, strânge abdomenul și coboară ca și cum te-ai așeza pe un scaun.', 'Coboară până când coapsele ajung paralele cu solul, cu genunchii pe direcția vârfurilor.', 'Împinge prin călcâie și urcă, expirând la final.'], 'Spatele rămâne drept tot timpul. Nu lăsa genunchii să cadă spre interior.'],
    ['ex_goblet', 'Genuflexiuni goblet cu gantera', 'Picioare', 'Gantere', 'ușor', ['Ține gantera vertical, lipită de piept.', 'Coboară lent, cu coatele între genunchi.', 'Pieptul rămâne sus, privirea înainte.', 'Urcă împingând prin călcâie.'], 'Exercițiul ideal pentru începători, învață mișcarea corectă de genuflexiune.'],
    ['ex_legpress', 'Presă pentru picioare', 'Picioare', 'Aparat', 'ușor', ['Așază-te cu spatele lipit de spătar și picioarele pe platformă, la lățimea umerilor.', 'Deblochează platforma și coboar-o până la un unghi de 90° la genunchi.', 'Împinge înapoi fără să blochezi complet genunchii sus.'], 'Nu ridica fesele de pe scaun la coborâre.'],
    ['ex_lunge', 'Fandări cu gantere', 'Picioare', 'Gantere', 'mediu', ['Ține câte o ganteră în fiecare mână, brațele pe lângă corp.', 'Fă un pas mare înainte și coboară până când ambii genunchi fac 90°.', 'Genunchiul din spate aproape atinge solul.', 'Revino și schimbă piciorul.'], 'Trunchiul rămâne vertical. Genunchiul din față nu trece mult peste vârf.'],
    ['ex_rdl', 'Îndreptări românești', 'Femurali și fesieri', 'Bară', 'mediu', ['Ține bara cu brațele întinse, la nivelul coapselor.', 'Împinge șoldurile înapoi, cu genunchii ușor flexați.', 'Coboară bara pe lângă picioare până simți întinderea în spatele coapsei.', 'Revino strângând fesierii.'], 'Spatele drept, bara lipită de picioare. Nu rotunji spatele.'],
    ['ex_hipthrust', 'Hip thrust', 'Fesieri', 'Bară', 'mediu', ['Sprijină partea de sus a spatelui pe bancă, bara peste șold (cu protecție).', 'Tălpile pe sol, genunchii la 90° când ești sus.', 'Ridică șoldurile până când corpul e drept de la umeri la genunchi.', 'Strânge fesierii 1 secundă sus, apoi coboară controlat.'], 'Bărbia ușor în piept, nu arcui spatele de jos.'],
    ['ex_bench', 'Împins la piept cu bara', 'Piept', 'Bară', 'mediu', ['Culcat pe bancă, ochii sub bară, tălpile ferm pe sol.', 'Prinde bara puțin mai larg decât umerii.', 'Coboară controlat până la mijlocul pieptului.', 'Împinge în sus și puțin înapoi, expirând.'], 'Omoplații strânși și lipiți de bancă. Folosește un partener pentru greutăți mari.'],
    ['ex_dbpress', 'Împins cu gantere pe bancă înclinată', 'Piept', 'Gantere', 'mediu', ['Banca la 30°. Ganterele la nivelul pieptului.', 'Împinge în sus până aproape se ating ganterele.', 'Coboară lent, coatele la 45° față de corp.'], 'Lucrează partea de sus a pieptului.'],
    ['ex_pushup', 'Flotări', 'Piept', 'Fără echipament', 'ușor', ['Palmele puțin mai larg decât umerii, corpul drept ca o scândură.', 'Coboară pieptul aproape de sol, coatele la 45°.', 'Împinge înapoi sus.'], 'Prea grele? Fă-le cu genunchii pe sol sau cu mâinile pe o bancă.'],
    ['ex_fly', 'Fluturări la cablu', 'Piept', 'Cablu', 'ușor', ['Stai între scripeți, cu un pas înainte.', 'Brațele ușor flexate, adu mânerele în fața pieptului.', 'Revino lent, simțind întinderea.'], 'Mișcarea vine din umeri, nu din coate.'],
    ['ex_pullup', 'Tracțiuni la bară', 'Spate', 'Bară fixă', 'greu', ['Prinde bara puțin mai larg decât umerii, palmele în față.', 'Trage pieptul spre bară, cu coatele în jos.', 'Coboară complet, controlat.'], 'Nu poți încă? Folosește aparatul asistat sau o bandă elastică.'],
    ['ex_latpull', 'Tracțiuni la helcometru', 'Spate', 'Aparat', 'ușor', ['Prinde bara larg, așază-te cu genunchii fixați.', 'Trage bara spre partea de sus a pieptului.', 'Strânge omoplații, apoi lasă bara să urce controlat.'], 'Nu trage bara după cap și nu te lăsa mult pe spate.'],
    ['ex_row', 'Ramat cu gantera', 'Spate', 'Gantere', 'ușor', ['Sprijină un genunchi și o mână pe bancă.', 'Trage gantera spre șold, cotul lipit de corp.', 'Coboară lent până la brațul întins.'], 'Spatele paralel cu solul, nu răsuci trunchiul.'],
    ['ex_cablerow', 'Ramat la cablu', 'Spate', 'Cablu', 'ușor', ['Stai drept, picioarele pe suport, genunchii ușor flexați.', 'Trage mânerul spre abdomen.', 'Strânge omoplații, apoi întinde brațele.'], 'Nu balansa trunchiul înainte și înapoi.'],
    ['ex_ohp', 'Împins deasupra capului', 'Umeri', 'Gantere', 'mediu', ['În picioare sau pe bancă, ganterele la nivelul umerilor.', 'Împinge în sus până aproape întinzi brațele.', 'Coboară controlat la umeri.'], 'Abdomenul strâns, nu arcui spatele.'],
    ['ex_lateral', 'Ridicări laterale', 'Umeri', 'Gantere', 'ușor', ['Ganterele pe lângă corp, coatele ușor flexate.', 'Ridică lateral până la nivelul umerilor.', 'Coboară lent.'], 'Folosește greutate mică, mișcarea trebuie controlată.'],
    ['ex_curl', 'Flexii biceps cu gantere', 'Brațe', 'Gantere', 'ușor', ['Brațele întinse, palmele în față.', 'Îndoaie coatele și ridică ganterele spre umeri.', 'Coboară lent până la capăt.'], 'Coatele stau lipite de corp, fără balans.'],
    ['ex_triceps', 'Extensii triceps la cablu', 'Brațe', 'Cablu', 'ușor', ['Prinde funia sau bara cu coatele lipite de corp.', 'Împinge în jos până întinzi brațele.', 'Revino până la 90°.'], 'Doar antebrațele se mișcă.'],
    ['ex_dips', 'Flotări la paralele', 'Brațe', 'Paralele', 'greu', ['Susține-te pe paralele cu brațele întinse.', 'Coboară până la 90° la coate.', 'Împinge înapoi sus.'], 'Trunchiul drept lucrează tricepsul, aplecat în față lucrează pieptul.'],
    ['ex_plank', 'Planșă', 'Abdomen', 'Fără echipament', 'ușor', ['Sprijin pe antebrațe și vârfuri.', 'Corpul drept de la cap la călcâie.', 'Strânge abdomenul și fesierii, respiră normal.'], 'Nu lăsa șoldurile să cadă și nu le ridica prea sus.'],
    ['ex_crunch', 'Abdomene la cablu', 'Abdomen', 'Cablu', 'mediu', ['În genunchi în fața scripetelui, funia la frunte.', 'Rulează trunchiul în jos, apropiind coatele de genunchi.', 'Revino lent.'], 'Mișcarea vine din abdomen, nu din brațe.'],
    ['ex_legraise', 'Ridicări de picioare la bară', 'Abdomen', 'Bară fixă', 'greu', ['Atârnă de bară cu brațele întinse.', 'Ridică genunchii (sau picioarele întinse) spre piept.', 'Coboară controlat, fără balans.'], 'Pentru început, ridică doar genunchii.'],
    ['ex_bike', 'Bicicletă staționară', 'Cardio', 'Aparat', 'ușor', ['Reglează șaua la nivelul șoldului.', 'Pedalează într-un ritm în care poți vorbi.', 'La intervale: 30 s tare, 60 s ușor.'], 'Ideal pentru încălzire și ardere de grăsimi.'],
    ['ex_treadmill', 'Mers înclinat pe bandă', 'Cardio', 'Aparat', 'ușor', ['Înclinație 8–12%, viteză 4,5–5,5 km/h.', 'Nu te ține de bare.', '20–30 de minute, ritm constant.'], 'Una dintre cele mai bune metode de a arde grăsimi fără să forțezi genunchii.'],
    ['ex_rowerg', 'Aparat de vâslit', 'Cardio', 'Aparat', 'mediu', ['Picioarele împing primele, apoi trunchiul, apoi brațele.', 'Revino în ordine inversă.', 'Ritm de 22–26 de trageri pe minut.'], 'Lucrează tot corpul.'],
  ].map(([id, name, muscle, equipment, level, steps, tip]) => ({ id, name, muscle, equipment, level, steps, tip, video: yt(name) }));

  const it = (ex, sets, reps, kg, rest) => ({ ex, sets, reps, kg: kg || 0, rest: rest || 90 });
  const PROGRAMS = [
    { id: 'pr_start', name: 'Start în sală', goal: 'Începători', level: 'ușor', daysPerWeek: 3, desc: 'Primele 4–6 săptămâni. Înveți mișcările de bază și îți faci corpul să se obișnuiască cu efortul.',
      days: [
        { name: 'Ziua A – Tot corpul', items: [it('ex_bike', 1, '8 min', 0, 0), it('ex_goblet', 3, '12', 10), it('ex_latpull', 3, '12', 25), it('ex_pushup', 3, '8–10'), it('ex_row', 3, '12', 10), it('ex_plank', 3, '30 s', 0, 45)] },
        { name: 'Ziua B – Tot corpul', items: [it('ex_treadmill', 1, '10 min', 0, 0), it('ex_legpress', 3, '12', 60), it('ex_dbpress', 3, '10', 8), it('ex_cablerow', 3, '12', 25), it('ex_lateral', 3, '12', 4), it('ex_crunch', 3, '15', 15)] },
        { name: 'Ziua C – Tot corpul', items: [it('ex_rowerg', 1, '8 min', 0, 0), it('ex_lunge', 3, '10/picior', 6), it('ex_hipthrust', 3, '12', 30), it('ex_ohp', 3, '10', 8), it('ex_curl', 2, '12', 6), it('ex_triceps', 2, '12', 15)] },
      ] },
    { id: 'pr_mass', name: 'Masă musculară 4 zile', goal: 'Hipertrofie', level: 'mediu', daysPerWeek: 4, desc: 'Împărțire sus/jos, de 4 ori pe săptămână. Crești greutățile treptat când termini toate repetările.',
      days: [
        { name: 'Luni – Partea de sus', items: [it('ex_bench', 4, '8', 50, 120), it('ex_row', 4, '10', 22), it('ex_ohp', 3, '10', 16), it('ex_latpull', 3, '10', 50), it('ex_curl', 3, '12', 12), it('ex_triceps', 3, '12', 25)] },
        { name: 'Marți – Partea de jos', items: [it('ex_squat', 4, '8', 60, 150), it('ex_rdl', 3, '10', 50, 120), it('ex_legpress', 3, '12', 120), it('ex_lunge', 3, '10/picior', 14), it('ex_legraise', 3, '12', 0, 60)] },
        { name: 'Joi – Partea de sus', items: [it('ex_dbpress', 4, '10', 24), it('ex_pullup', 4, '6–8', 0, 120), it('ex_fly', 3, '12', 15), it('ex_cablerow', 3, '12', 55), it('ex_lateral', 4, '15', 8), it('ex_dips', 3, '10', 0)] },
        { name: 'Vineri – Partea de jos', items: [it('ex_hipthrust', 4, '10', 80), it('ex_goblet', 3, '12', 26), it('ex_rdl', 3, '10', 50), it('ex_crunch', 3, '15', 30), it('ex_plank', 3, '45 s', 0, 45)] },
      ] },
    { id: 'pr_fat', name: 'Slăbire și formă', goal: 'Ardere grăsimi', level: 'ușor', daysPerWeek: 3, desc: 'Circuite de forță + cardio. Păstrezi mușchii și arzi grăsime. Pauze scurte între exerciții.',
      days: [
        { name: 'Ziua 1 – Circuit + cardio', items: [it('ex_goblet', 3, '15', 12, 45), it('ex_pushup', 3, '10', 0, 45), it('ex_row', 3, '12', 12, 45), it('ex_lunge', 3, '12/picior', 6, 45), it('ex_treadmill', 1, '25 min', 0, 0)] },
        { name: 'Ziua 2 – Intervale', items: [it('ex_bike', 1, '20 min intervale', 0, 0), it('ex_hipthrust', 3, '15', 40, 45), it('ex_latpull', 3, '15', 35, 45), it('ex_plank', 3, '40 s', 0, 30)] },
        { name: 'Ziua 3 – Circuit + cardio', items: [it('ex_legpress', 3, '15', 70, 45), it('ex_dbpress', 3, '12', 10, 45), it('ex_cablerow', 3, '15', 30, 45), it('ex_crunch', 3, '20', 15, 30), it('ex_rowerg', 1, '15 min', 0, 0)] },
      ] },
  ];

  const meal = (name, time, items, kcal, p, c, f) => ({ name, time, items, kcal, p, c, f });
  const NUTRITION = [
    { id: 'nu_cut', name: 'Slăbire sănătoasă', goal: 'Slăbire', kcal: 1800, p: 140, c: 170, f: 60, desc: 'Deficit moderat, multe proteine ca să păstrezi mușchii. Fără înfometare.',
      meals: [meal('Mic dejun', '08:00', '3 ouă + 2 albușuri omletă, 1 felie pâine integrală, roșii', 420, 32, 25, 20), meal('Gustare', '11:00', 'Iaurt grecesc 200 g + fructe de pădure', 200, 20, 18, 4), meal('Prânz', '14:00', 'Piept de pui 180 g, orez 60 g (crud), salată mare cu ulei de măsline', 560, 50, 55, 14), meal('Gustare', '17:00', 'Măr + 20 g migdale', 220, 6, 25, 12), meal('Cină', '20:00', 'Pește la cuptor 200 g, legume la abur', 400, 32, 47, 10)] },
    { id: 'nu_main', name: 'Menținere și energie', goal: 'Menținere', kcal: 2300, p: 150, c: 260, f: 70, desc: 'Echilibru între proteine, carbohidrați și grăsimi pentru antrenamente bune.',
      meals: [meal('Mic dejun', '08:00', 'Fulgi de ovăz 80 g cu lapte, banană, 1 lingură unt de arahide', 560, 22, 80, 16), meal('Gustare', '11:00', 'Sandviș integral cu curcan și brânză', 380, 28, 38, 12), meal('Prânz', '14:00', 'Vită slabă 180 g, cartofi 250 g, salată', 650, 48, 60, 20), meal('Gustare', '17:30', 'Shake proteic + o mână de nuci', 330, 30, 12, 16), meal('Cină', '20:30', 'Somon 150 g, quinoa 60 g, legume', 380, 22, 70, 6)] },
    { id: 'nu_bulk', name: 'Masă musculară', goal: 'Creștere', kcal: 2900, p: 170, c: 360, f: 85, desc: 'Surplus caloric controlat ca să crești mușchi, nu grăsime.',
      meals: [meal('Mic dejun', '07:30', '4 ouă, 2 felii pâine integrală, avocado, suc de portocale', 720, 34, 70, 32), meal('Gustare', '10:30', 'Ovăz 60 g + whey + banană', 480, 35, 70, 6), meal('Prânz', '13:30', 'Piept de pui 200 g, orez 100 g (crud), legume', 760, 55, 95, 12), meal('Înainte de sală', '17:00', 'Pâine cu miere + iaurt', 360, 16, 62, 6), meal('Cină', '20:30', 'Paste integrale 100 g cu carne tocată de vită și sos de roșii', 580, 30, 63, 29)] },
  ];

  const DAILY = [
    ['Disciplina înseamnă să faci ce trebuie, chiar și când nu ai chef.', 'Anonim', 'Bea 2 litri de apă azi'],
    ['Nu te opri când ești obosit. Oprește-te când ai terminat.', 'David Goggins', 'Fă 50 de genuflexiuni pe parcursul zilei'],
    ['Corpul obține ce mintea crede.', 'Anonim', 'Mergi 8.000 de pași'],
    ['Fiecare antrenament contează, chiar și cel scurt.', 'Anonim', 'Fă 3 serii de planșă a câte 30 de secunde'],
    ['Succesul începe cu decizia de a încerca.', 'Anonim', 'Mănâncă o porție de legume la fiecare masă'],
    ['Durerea de azi e forța de mâine.', 'Anonim', 'Fă 30 de flotări (poți să le împarți)'],
    ['Nu trebuie să fii extrem. Trebuie doar să fii constant.', 'Anonim', 'Culcă-te înainte de ora 23:00'],
    ['Cel mai greu pas e să ieși pe ușă spre sală.', 'Anonim', 'Vino azi la sală, chiar și doar 30 de minute'],
    ['Un an de acum înainte îți vei mulțumi că ai început azi.', 'Karen Lamb', 'Fă-ți o poză de progres'],
    ['Motivația te pornește. Obiceiul te ține în mișcare.', 'Jim Ryun', 'Fără dulciuri azi'],
    ['Nu compara începutul tău cu mijlocul altcuiva.', 'Anonim', 'Fă 10 minute de stretching seara'],
    ['Transpirația e grăsimea care plânge.', 'Anonim', 'Urcă pe scări în loc de lift toată ziua'],
    ['Puterea nu vine din ce poți face, ci din ce credeai că nu poți.', 'Rikki Rogers', 'Adaugă 2,5 kg la un exercițiu azi'],
    ['Fă-o pentru tine de peste 6 luni.', 'Anonim', 'Notează ce ai mâncat azi'],
    ['Rezultatele vin pentru cei care nu renunță.', 'Anonim', 'Fă 100 de abdomene pe parcursul zilei'],
    ['Nu există scurtături pentru un loc în care merită să ajungi.', 'Beverly Sills', 'Bea un pahar de apă înainte de fiecare masă'],
    ['Antrenamentul pe care nu ți-l dorești e cel de care ai cea mai mare nevoie.', 'Anonim', 'Fă 20 de minute de cardio'],
    ['Ai grijă de corpul tău. E singurul loc în care trebuie să trăiești.', 'Jim Rohn', 'Fără băuturi carbogazoase azi'],
    ['Progres, nu perfecțiune.', 'Anonim', 'Fă cu 1 repetare mai mult decât data trecută'],
    ['Începe de unde ești. Folosește ce ai. Fă ce poți.', 'Arthur Ashe', 'Fă 5 minute de respirație și relaxare'],
    ['Corpul tău poate aproape orice. Mintea trebuie convinsă.', 'Anonim', 'Ține planșa cât mai mult, o singură dată'],
    ['Încrederea vine din antrenamentele pe care le-ai terminat.', 'Anonim', 'Mănâncă proteine la fiecare masă'],
    ['Nu aștepta motivația. Creeaz-o.', 'Anonim', 'Pregătește-ți mesele pentru mâine'],
    ['Fiecare zi e o nouă șansă să fii mai bun.', 'Anonim', 'Mergi pe jos 30 de minute'],
    ['Oboseala e temporară. Mândria e pentru totdeauna.', 'Anonim', 'Fă 40 de fandări'],
    ['Un pas mic azi e un salt mare peste o lună.', 'Anonim', 'Cântărește-te și notează în aplicație'],
    ['Nu te antrena ca să arăți bine. Antrenează-te ca să te simți bine.', 'Anonim', 'Dormi minim 7 ore'],
    ['Cine vrea, găsește o cale. Cine nu, găsește o scuză.', 'Anonim', 'Adu un prieten la sală'],
    ['Constanța bate talentul atunci când talentul nu e constant.', 'Anonim', 'Bifează toate mesele din planul tău'],
    ['Azi faci ce alții nu vor, ca mâine să ai ce alții nu pot.', 'Jerry Rice', 'Fă un antrenament complet din program'],
  ].map(([quote, author, challenge]) => ({ quote, author, challenge }));

  function base(ctx) {
    const t = ctx.today();
    return {
      settings: {
        name: 'Fitness Empire Telciu', tagline: 'Devino cea mai bună versiune a ta', phone: '0785 769 200', whatsapp: '40785769200', email: '',
        address: '', mapsUrl: '', instagram: '', facebook: '',
        hours: [{ d: 'Luni – Vineri', h: '06:00 – 22:00' }, { d: 'Sâmbătă', h: '08:00 – 20:00' }, { d: 'Duminică', h: '09:00 – 16:00' }],
        accent: '#A8E63C', dailyHour: 8, checkinCode: String(1000 + Math.floor(ctx.rand() * 9000)), checkinDate: t, weeklyGoal: 3,
      },
      plans: [
        { id: 'pl_month', name: 'Lunar', price: 150, days: 30, desc: 'Acces nelimitat 30 de zile', active: true },
        { id: 'pl_student', name: 'Lunar elevi/studenți', price: 120, days: 30, desc: 'Cu carnet de elev sau student', active: true },
        { id: 'pl_3m', name: '3 luni', price: 400, days: 90, desc: 'Economisești 50 lei', active: true },
        { id: 'pl_year', name: 'Anual', price: 1400, days: 365, desc: 'Cel mai bun preț', active: true },
        { id: 'pl_day', name: 'O zi', price: 25, days: 1, desc: 'Intrare o singură zi', active: true },
      ],
      members: [], exercises: EXERCISES, programs: PROGRAMS, nutrition: NUTRITION,
      dailyLib: DAILY, daily: {},
      announcements: [],
      services: [
        { id: 'sv_pt', name: 'Antrenament personal 60 min', price: 80, duration: 60, desc: 'Antrenor alături de tine tot antrenamentul' },
        { id: 'sv_eval', name: 'Evaluare + plan personalizat', price: 120, duration: 45, desc: 'Măsurători, obiective și program făcut pentru tine' },
        { id: 'sv_nutri', name: 'Consultanță nutriție', price: 100, duration: 45, desc: 'Plan alimentar adaptat ție' },
      ],
      trainers: [{ id: 'tr_1', name: 'Antrenorul sălii', bio: 'Antrenor personal certificat', phone: '' }],
      bookings: [],
      rewards: [
        { id: 'rw_shake', name: 'Shake proteic gratuit', points: 300, desc: 'La barul sălii' },
        { id: 'rw_towel', name: 'Prosop cu logo', points: 800, desc: 'Prosop de sală' },
        { id: 'rw_week', name: '7 zile gratuite', points: 1500, desc: 'Se adaugă la abonament' },
      ],
      redemptions: [], sent: [], admin: null,
    };
  }

  /* membri demonstrativi, ca demo-ul să arate „plin” */
  function demo(db, ctx) {
    Object.assign(db.settings, { name: 'Fitness Empire Telciu', phone: '0785 769 200', whatsapp: '40785769200', email: '', address: 'Telciu, jud. Bistrița-Năsăud', mapsUrl: 'https://maps.google.com/?q=Telciu' });
    const t0 = ctx.today();
    db.announcements = [
      { id: 'an_1', type: 'program', title: 'Program de sărbători', body: 'De Crăciun și Revelion sala are program redus: 10:00 – 16:00. Pe 1 ianuarie e închis.', date: t0, pinned: true },
      { id: 'an_2', type: 'oferta', title: 'Adu un prieten', body: 'Vino cu un prieten nou și primiți amândoi 7 zile gratuit la următorul abonament.', date: t0, pinned: false },
      { id: 'an_3', type: 'eveniment', title: 'Concurs de tracțiuni', body: 'Sâmbătă de la 12:00. Premii pentru primii 3: abonament gratuit, tricou și shake-uri.', date: t0, pinned: false },
    ];
    const t = ctx.today(), add = (d, n) => { const x = new Date(d + 'T12:00:00Z'); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); };
    const names = ['Andrei Pop', 'Maria Rus', 'Ionuț Moldovan', 'Alexandra Pintea', 'Vlad Sabău', 'Elena Mureșan', 'Darius Bota', 'Ioana Cîmpean', 'Raul Șuteu', 'Bianca Tărțan', 'Cristian Lazăr', 'Diana Lupșan', 'Florin Rad', 'Andreea Mocan', 'Sebastian Coman', 'Larisa Pașca', 'Mihai Dragoș', 'Roxana Ilieș', 'Tudor Man', 'Paula Sas', 'George Ilisie', 'Denisa Cozma', 'Robert Nistor', 'Iulia Pop'];
    const plans = ['pl_month', 'pl_month', 'pl_student', 'pl_3m', 'pl_month', 'pl_year', 'pl_month', 'pl_3m'];
    names.forEach((name, i) => {
      const plan = db.plans.find((p) => p.id === plans[i % plans.length]);
      const started = add(t, -((i * 13) % 160) - 5);
      // unele expiră curând, altele au expirat, majoritatea sunt active
      const endOffset = [12, 2, 25, -4, 1, 200, 18, 40, -12, 9, 3, 27, -20, 15, 22, 6, -2, 30, 11, 45, 8, -30, 19, 26][i];
      const end = add(t, endOffset), start = add(end, -plan.days);
      const payments = [];
      for (let k = 0, d = start; k < 1 + (i % 4); k++, d = add(d, -plan.days)) payments.push({ id: ctx.uid('pa'), date: d, amount: plan.price, planId: plan.id, method: k % 2 ? 'card' : 'numerar', note: '' });
      const female = /a$/.test(name.split(' ')[0]) || ['Elena', 'Maria'].includes(name.split(' ')[0]);
      const lastSeen = [1, 3, 0, 9, 2, 1, 12, 0, 16, 4, 8, 1, 22, 2, 0, 10, 5, 1, 3, 0, 2, 40, 13, 1][i];
      const w0 = female ? 68 + (i % 7) : 86 + (i % 9), checkins = [], workouts = [], weights = [], ciAt = {};
      for (let d = 0; d < 70; d++) {
        if (d < lastSeen) continue;
        if ((d + i) % 7 === 0 || (d + i) % 7 === 2 || (d + i) % 7 === 4 || (i % 3 === 0 && (d + i) % 7 === 5)) {
          const day = add(t, -d); checkins.push(day);
          const pid = female ? 'pr_fat' : 'pr_mass', prog = PROGRAMS.find((x) => x.id === pid), di = d % prog.days.length, grow = 0.8 + 0.25 * (70 - d) / 70;
          const sets = []; prog.days[di].items.forEach((it) => { if (/min/.test(it.reps)) return; for (let k = 1; k <= it.sets; k++) sets.push({ ex: it.ex, set: k, reps: (parseInt(it.reps) || 10) - (k > 2 ? 1 : 0), kg: it.kg ? Math.round((it.kg * grow * (female ? 0.7 : 1)) / 2.5) * 2.5 : 0 }); });
          workouts.push({ id: ctx.uid('wo'), date: day, programId: pid, dayIdx: di, duration: 45 + (d % 4) * 10, sets, note: '' });
          const slots = [7, 8, 17, 18, 19, 18, 17, 12, 20, 9, 18, 19];
          ciAt[day] = d === 0 && ctx.time ? (() => { const [h, mi] = ctx.time().split(':').map(Number); const x = Math.max(6 * 60, h * 60 + mi - (i % 6) * 14); return String(Math.floor(x / 60)).padStart(2, '0') + ':' + String(x % 60).padStart(2, '0'); })() : String(slots[(d + i) % slots.length]).padStart(2, '0') + ':' + String((i * 7 + d * 13) % 60).padStart(2, '0');
        }
        if (d % 7 === 0) weights.push({ date: add(t, -d), kg: Math.round((w0 - (70 - d) * (female ? 0.05 : 0.03) * (i % 2 ? 1 : -0.6)) * 10) / 10 });
      }
      db.members.push({
        id: ctx.uid('mb'), name, phone: '07' + String(40000000 + i * 1234567).slice(0, 8), email: '', pass: ctx.hash('1234'),
        birth: `${1990 + (i % 15)}-0${1 + (i % 9)}-1${i % 9}`, sex: female ? 'F' : 'M', height: female ? 165 + (i % 8) : 176 + (i % 10), goal: female ? 'Slăbire și tonifiere' : 'Masă musculară', targetWeight: female ? w0 - 6 : w0 + 4,
        level: 'mediu', notes: '', tags: [i % 5 === 0 ? 'studenți' : 'standard'], createdAt: started, programId: female ? 'pr_fat' : 'pr_mass', nutritionId: female ? 'nu_cut' : 'nu_bulk',
        sub: { planId: plan.id, start, end }, payments, weights: weights.reverse(), measures: [], photos: [], workouts: workouts.reverse(), checkins: checkins.reverse(), ciAt, chat: [], water: {},
        challenges: {}, meals: {}, push: [], notifs: [], redeemed: [], weekGoal: 3,
      });
    });
    db.members[0].measures = [{ date: add(t, -60), waist: 92, chest: 101, arm: 35, thigh: 58, hips: 100 }, { date: add(t, -30), waist: 89, chest: 102, arm: 36, thigh: 59, hips: 99 }, { date: t, waist: 86, chest: 104, arm: 37, thigh: 60, hips: 98 }];
    for (let d = 1; d < 12; d++) db.members[0].challenges[add(t, -d)] = true;
    db.members.forEach((m, i) => { for (let d = 1; d < 25; d++) if ((d * (i + 3)) % 4 === 0) m.challenges[add(t, -d)] = true; });
    const iso = (d, h) => d + 'T' + h + ':00.000Z';
    db.members[0].chat = [
      { id: ctx.uid('ms'), from: 'm', text: 'Salut! Pot să vin sâmbătă cu un prieten la antrenament?', at: iso(add(t, -2), '15:10'), read: true },
      { id: ctx.uid('ms'), from: 'g', text: 'Sigur! Dacă își face abonament, primiți amândoi 7 zile gratuit. Vă așteptăm 💪', at: iso(add(t, -2), '15:24'), read: true },
      { id: ctx.uid('ms'), from: 'g', text: 'Andrei, ai urcat frumos la împins. Data viitoare încearcă 2,5 kg în plus la prima serie.', at: iso(t, '07:05'), read: false },
    ];
    db.members[1].chat = [{ id: ctx.uid('ms'), from: 'm', text: 'Bună! La ce oră e sala cea mai liberă seara?', at: iso(t, '06:40'), read: false }];
    db.members[3].chat = [{ id: ctx.uid('ms'), from: 'm', text: 'Mi-a expirat abonamentul, pot plăti cu cardul la recepție?', at: iso(add(t, -1), '17:02'), read: false }];
    db.members[0].water = { [t]: 3 };
    db.bookings.push({ id: ctx.uid('bk'), memberId: db.members[1].id, serviceId: 'sv_pt', date: add(t, 1), time: '18:00', status: 'pending', note: 'Vreau să învăț corect genuflexiunile', createdAt: t });
    db.bookings.push({ id: ctx.uid('bk'), memberId: db.members[0].id, serviceId: 'sv_eval', date: add(t, 2), time: '17:00', status: 'confirmed', note: '', createdAt: t });
  }
  return { base, demo, EXERCISES, PROGRAMS, NUTRITION, DAILY };
});
