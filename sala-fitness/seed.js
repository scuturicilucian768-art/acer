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
    // recuperare: spate, gât, umeri, genunchi (exerciții blânde, fără greutăți mari)
    ['ex_catcow', 'Pisica–cămila', 'Recuperare', 'Fără echipament', 'ușor', ['În patru labe: palmele sub umeri, genunchii sub șold.', 'Inspiră și lasă burta în jos, cu privirea ușor în sus (cămila).', 'Expiră și rotunjește spatele în sus, cu bărbia spre piept (pisica).', 'Mișcă-te lent, vertebră cu vertebră, 8–10 repetări.'], 'Mișcare fără durere. Dacă te doare, micșorează amplitudinea.'],
    ['ex_birddog', 'Bird-dog (câine–pasăre)', 'Recuperare', 'Fără echipament', 'ușor', ['În patru labe, spatele drept, abdomenul ușor strâns.', 'Întinde brațul drept înainte și piciorul stâng înapoi, în linie cu trunchiul.', 'Ține 2–3 secunde fără să se miște șoldul, apoi revino.', 'Schimbă partea.'], 'Unul dintre cele mai bune exerciții pentru stabilitatea spatelui de jos.'],
    ['ex_deadbug', 'Dead bug', 'Recuperare', 'Fără echipament', 'ușor', ['Culcat pe spate, brațele spre tavan, genunchii la 90° deasupra șoldului.', 'Lipește spatele de jos de sol.', 'Coboară încet brațul drept și piciorul stâng spre sol, fără să se dezlipească spatele.', 'Revino și schimbă partea.'], 'Mergi încet. Dacă se arcuiește spatele, nu mai coborî atât de jos.'],
    ['ex_bridge', 'Pod fesier pe sol', 'Fesieri', 'Fără echipament', 'ușor', ['Culcat pe spate, genunchii îndoiți, tălpile pe sol.', 'Strânge fesierii și ridică șoldul până când corpul e drept de la umeri la genunchi.', 'Ține 2 secunde sus, apoi coboară controlat.'], 'Fesierii puternici iau din efortul spatelui de jos.'],
    ['ex_childpose', 'Poziția copilului', 'Recuperare', 'Fără echipament', 'ușor', ['Îngenunchează, cu genunchii puțin depărtați.', 'Așază-te pe călcâie și întinde brațele înainte pe sol.', 'Lasă fruntea jos și respiră adânc 30–45 de secunde.'], 'Întindere relaxantă pentru spate, ideală la finalul antrenamentului.'],
    ['ex_hipflexor', 'Întinderea flexorilor șoldului', 'Recuperare', 'Fără echipament', 'ușor', ['Pune un genunchi pe sol și celălalt picior în față, la 90°.', 'Strânge fesierul piciorului din spate.', 'Împinge ușor șoldul înainte până simți întinderea în fața coapsei.', 'Ține 30 de secunde pe fiecare parte.'], 'Foarte util dacă stai mult pe scaun: șoldurile încordate trag de spatele de jos.'],
    ['ex_chintuck', 'Retracția bărbiei', 'Recuperare', 'Fără echipament', 'ușor', ['Stai drept, cu umerii relaxați.', 'Trage bărbia înapoi, ca și cum ai face o „bărbie dublă”, fără să apleci capul.', 'Ține 3 secunde, apoi relaxează.'], 'Bun pentru gât și pentru postura de la telefon sau calculator.'],
    ['ex_wallangel', 'Îngerul pe perete', 'Recuperare', 'Fără echipament', 'ușor', ['Spatele, capul și fesierii lipiți de perete.', 'Brațele în formă de „W”, cu coatele și dosul palmelor pe perete.', 'Glisează brațele în sus, cât poți fără să se dezlipească de perete.', 'Coboară încet înapoi în „W”.'], 'Deschide pieptul și trezește mușchii dintre omoplați.'],
    ['ex_facepull', 'Face pull la cablu', 'Umeri', 'Cablu', 'ușor', ['Scripetele la înălțimea feței, cu funia.', 'Trage funia spre față, cu coatele sus și în afară.', 'Strânge omoplații 1 secundă, apoi revino controlat.'], 'Greutate mică, mișcare curată. Excelent pentru umeri sănătoși și postură.'],
    ['ex_wallsit', 'Scaunul la perete', 'Picioare', 'Fără echipament', 'ușor', ['Spatele lipit de perete, picioarele la un pas în față.', 'Coboară până când genunchii sunt la 60–90°, cât nu te doare.', 'Ține poziția 20–45 de secunde, respirând normal.'], 'Întărește coapsele fără să încarce genunchii cu mișcare.'],
    ['ex_m_incpress', 'Împins înclinat la aparat', 'Piept', 'Aparat', 'ușor', ['Reglează scaunul: mânerele să fie la nivelul pieptului de sus.', 'Spatele lipit de spătar, picioarele pe podea, omoplații strânși.', 'Împinge mânerele în sus și în față până aproape întinzi brațele.', 'Revino încet, în 2–3 secunde, până simți întinderea în piept.'], 'Nu bloca coatele sus și nu desprinde spatele de spătar.'],
    ['ex_m_decpress', 'Împins declinat la aparat', 'Piept', 'Aparat', 'ușor', ['Reglează scaunul: mânerele să fie la nivelul pieptului de jos.', 'Spatele lipit de spătar, pieptul sus, umerii trași în spate.', 'Împinge mânerele în față și ușor în jos, până aproape întinzi brațele.', 'Revino controlat, fără să lași greutățile să se lovească.'], 'Lucrează mai ales partea de jos a pieptului. Nu ridica umerii spre urechi.'],
    ['ex_m_pecfly', 'Fluturări la aparat (pec deck)', 'Piept', 'Aparat', 'ușor', ['Reglează scaunul: mânerele la nivelul pieptului, coatele ușor sub umeri.', 'Spatele lipit de spătar, prinde mânerele sau sprijină antebrațele pe perne.', 'Adu brațele în față până aproape se ating mânerele, strângând pieptul.', 'Desfă brațele încet până simți întinderea în piept, fără să treci de linia umerilor.'], 'Coatele rămân ușor îndoite tot timpul. Nu lăsa greutățile să tragă brațele prea în spate.'],
    ['ex_m_chestpress', 'Împins la piept la aparat (orizontal)', 'Piept', 'Aparat', 'ușor', ['Reglează scaunul: mânerele la nivelul mijlocului pieptului.', 'Spatele și capul lipite de spătar, picioarele pe podea.', 'Împinge mânerele drept în față până aproape întinzi brațele.', 'Revino încet până mânerele ajung în dreptul pieptului.'], 'Expiră când împingi, inspiră la revenire. Nu bloca coatele.'],
    ['ex_m_lateral', 'Ridicări laterale la aparat', 'Umeri', 'Aparat', 'ușor', ['Reglează scaunul: umerii în dreptul axului de rotație al aparatului.', 'Spatele lipit de spătar, brațele pe lângă corp, cu pernele pe exteriorul brațelor, deasupra coatelor.', 'Ridică brațele lateral până la nivelul umerilor, împingând cu coatele în perne.', 'Coboară încet, în 2–3 secunde, fără să lași greutățile să se lovească.'], 'Nu ridica umerii spre urechi. Folosește greutate mică, mișcarea trebuie controlată.'],
    ['ex_smithsquat', 'Genuflexiuni la Smith', 'Picioare', 'Aparat', 'mediu', ['Bara pe trapez (nu pe gât), picioarele puțin în fața barei, la lățimea umerilor.', 'Rotește bara ca s-o scoți din cârlige și ține pieptul sus.', 'Coboară controlat până coapsele ajung paralele cu podeaua, genunchii în direcția vârfurilor.', 'Împinge prin călcâie până aproape întinzi picioarele, apoi rotește bara înapoi în cârlige.'], 'Ghidajul face mișcarea mai sigură decât cu bara liberă, dar nu bloca genunchii sus. Pune opritorii de siguranță puțin sub punctul cel mai de jos.'],
    ['ex_m_row', 'Ramat la aparat (cu sprijin la piept)', 'Spate', 'Aparat', 'ușor', ['Reglează scaunul: mânerele trebuie să fie la nivelul pieptului de jos.', 'Pieptul lipit de perna din față, picioarele pe suport, spatele drept.', 'Trage mânerele spre tine, ducând coatele pe lângă corp și strângând omoplații.', 'Revino încet până întinzi brațele, fără să desprinzi pieptul de pernă.'], 'Perna de la piept îți protejează spatele de jos. Trage din spate, nu doar din brațe.'],
    ['ex_m_shpress', 'Împins pentru umeri la aparat', 'Umeri', 'Aparat', 'ușor', ['Reglează scaunul: mânerele trebuie să fie la nivelul umerilor sau puțin deasupra.', 'Spatele lipit de spătar, picioarele pe podea, abdomenul strâns.', 'Împinge mânerele în sus până aproape întinzi brațele.', 'Coboară încet până mânerele ajung în dreptul umerilor.'], 'Nu bloca coatele sus și nu arcui spatele de pe spătar.'],
    ['ex_m_reardelt', 'Fluturări inverse la aparat (umăr posterior)', 'Umeri', 'Aparat', 'ușor', ['Reglează scaunul: brațele aparatului trebuie să fie la nivelul umerilor.', 'Stai cu pieptul lipit de spătar, cu fața spre aparat, și pune dosul brațelor pe pernele verticale.', 'Deschide brațele în lateral și spre spate, strângând omoplații.', 'Revino încet în față, fără să lași greutățile să se lovească.'], 'Folosește greutate mică: umerii din spate sunt mușchi mici. Nu ridica umerii spre urechi.'],
    ['ex_m_hacksquat', 'Hack squat (genuflexiuni la aparat)', 'Picioare', 'Aparat', 'mediu', ['Spatele lipit de spătar, umerii sub pernele de sus, picioarele pe platformă la lățimea umerilor.', 'Împinge puțin în sus și deblochează mânerele de siguranță de pe lateral.', 'Coboară controlat până coapsele ajung paralele cu platforma, genunchii în direcția vârfurilor.', 'Împinge prin toată talpa până aproape întinzi picioarele, apoi blochează din nou mânerele.'], 'Nu bloca genunchii sus și nu lăsa călcâiele să se ridice de pe platformă.'],
    ['ex_m_legcurl', 'Flexii pentru femurali la aparat (culcat)', 'Picioare', 'Aparat', 'ușor', ['Întinde-te cu fața în jos, genunchii chiar la marginea banchetei, rola pe glezne, sub mușchiul gambei.', 'Prinde mânerele din față și ține șoldurile lipite de banchetă.', 'Îndoaie genunchii și adu rola spre fese, strângând mușchii din spatele coapsei.', 'Coboară încet, în 2–3 secunde, fără să întinzi complet brusc genunchii.'], 'Nu ridica șoldurile de pe banchetă și nu smuci greutatea.'],
    ['ex_m_glute', 'Extensii pentru fese la aparat (kickback)', 'Picioare', 'Aparat', 'ușor', ['Sprijină pieptul pe perna aparatului și prinde mânerele.', 'Un picior pe platforma de sprijin, celălalt cu spatele coapsei (sau talpa) pe rola brațului aparatului.', 'Împinge piciorul înapoi și în sus, strângând fesele, până coapsa ajunge în linie cu corpul.', 'Revino încet. Fă toate repetările cu un picior, apoi schimbă.'], 'Nu arcui spatele de jos: mișcarea vine din șold, nu din spate.'],
    ['ex_m_abbench', 'Abdomene pe banca înclinată', 'Abdomen', 'Aparat', 'ușor', ['Prinde picioarele sub rolele de sus și întinde-te cu spatele pe banchetă.', 'Mâinile la piept sau ușor la tâmple (nu trage de ceafă).', 'Ridică trunchiul rulând spatele, vertebră cu vertebră, strângând abdomenul.', 'Coboară încet până aproape atingi bancheta cu omoplații, fără să te lași de tot.'], 'Expiră când urci. Cu cât banca e mai înclinată, cu atât e mai greu: începe cu ea mai puțin înclinată.'],
    ['ex_hyper', 'Hiperextensii (bancă la 45°)', 'Spate', 'Aparat', 'ușor', ['Reglează perna astfel încât marginea ei să fie chiar sub șolduri (nu pe burtă), ca să te poți îndoi liber.', 'Picioarele pe platformă, călcâiele sub role. Brațele încrucișate la piept.', 'Coboară trunchiul încet, cu spatele drept, până simți întinderea în spatele coapselor.', 'Urcă strângând fesele până corpul ajunge în linie dreaptă, fără să treci de ea.'], 'Nu arcui spatele peste linia corpului sus. Pentru mai greu, ține un disc la piept.'],
    ['ex_sissy', 'Sissy squat (pe suport)', 'Picioare', 'Aparat', 'mediu', ['Pune tălpile pe platformă, cu gleznele prinse sub rolele din spate și gambele lipite de perna din față.', 'Corpul drept, brațele întinse în față pentru echilibru.', 'Lasă genunchii în față și în jos, ducând corpul înapoi în linie dreaptă de la genunchi la cap.', 'Coboară cât poți controlat, apoi urcă împingând din genunchi și strângând coapsele.'], 'Lucrează aproape doar partea din față a coapsei. Nu îndoi șoldurile: corpul rămâne drept de la genunchi la cap.'],
    ['ex_m_triceps', 'Extensii triceps la aparat', 'Brațe', 'Aparat', 'ușor', ['Reglează scaunul: coatele trebuie să stea pe pernele din față, în dreptul axului de rotație al aparatului.', 'Spatele lipit de spătar, prinde mânerele cu palmele față în față.', 'Împinge mânerele în jos până aproape întinzi brațele, strângând tricepsul.', 'Revino încet până antebrațele ajung aproape verticale.'], 'Coatele stau fixe pe perne tot timpul; mișcarea e doar din cot.'],
    ['ex_m_legext', 'Extensii pentru cvadricepși la aparat', 'Picioare', 'Aparat', 'ușor', ['Reglează spătarul astfel încât genunchii să fie în dreptul axului de rotație al aparatului.', 'Rola de jos pe glezne, chiar deasupra labei piciorului. Prinde mânerele de pe lateral.', 'Întinde picioarele până aproape drept, strângând coapsele o secundă sus.', 'Coboară încet, în 2–3 secunde, fără să lași greutățile să se lovească.'], 'Nu bloca genunchii sus și nu ridica fesele de pe scaun.'],
    ['ex_m_abduct', 'Abducții la aparat (deschideri picioare)', 'Picioare', 'Aparat', 'ușor', ['Stai cu spatele lipit de spătar și pune picioarele pe suporturi, cu pernele pe exteriorul genunchilor.', 'Prinde mânerele de sub scaun.', 'Împinge genunchii în lateral cât de larg poți controlat, strângând fesele.', 'Revino încet, fără să lași plăcile să se lovească.'], 'Lucrează partea laterală a feselor (fesierul mijlociu). Nu te apleca și nu folosi elanul.'],
    ['ex_inclbar', 'Împins cu bara pe bancă înclinată', 'Piept', 'Bară', 'mediu', ['Așază-te cu spatele pe bancă, ochii sub bară, picioarele pe podea.', 'Prinde bara puțin mai larg decât umerii și scoate-o din suport cu brațele întinse.', 'Coboară bara controlat până atinge ușor partea de sus a pieptului.', 'Împinge înapoi în sus până aproape întinzi brațele, apoi pune bara în suport.'], 'Omoplații strânși și lipiți de bancă. La greutăți mari, lucrează cu cineva care să te asigure.'],
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

  // pozele sălii (sala le poate șterge sau înlocui din panou)
  const GALLERY = [
    { id: 'gl_sala1', file: 'img/sala-1.jpg', cat: 'sala', caption: 'Sala de forță', order: 1, date: '2026-11-04' },
    { id: 'gl_sala2', file: 'img/sala-2.jpg', cat: 'aparate', caption: 'Aparatele noastre, seara', order: 2, date: '2026-11-04' },
    { id: 'gl_sala3', file: 'img/sala-3.jpg', cat: 'sala', caption: 'Recepția', order: 3, date: '2026-11-04' },
    { id: 'gl_sala4', file: 'img/sala-4.jpg', cat: 'sala', caption: 'Zona de gantere și cabluri', order: 4, date: '2026-11-08' },
    { id: 'gl_sala5', file: 'img/sala-5.jpg', cat: 'sala', caption: 'Băncile din fața oglinzii', order: 5, date: '2026-11-08' },
    { id: 'gl_sala6', file: 'img/sala-6.jpg', cat: 'sala', caption: 'Sala, vedere de ansamblu', order: 6, date: '2026-11-08' },
    { id: 'gl_sala7', file: 'img/sala-7.jpg', cat: 'aparate', caption: 'Zona de cardio', order: 7, date: '2026-11-08' },
    { id: 'gl_sala8', file: 'img/sala-8.jpg', cat: 'aparate', caption: 'Aparate cu discuri', order: 8, date: '2026-11-08' },
    { id: 'gl_sala9', file: 'img/sala-9.jpg', cat: 'aparate', caption: 'Helcometru', order: 9, date: '2026-11-08' },
    { id: 'gl_sala10', file: 'img/sala-10.jpg', cat: 'sala', caption: 'Peretele Fitness Empire', order: 10, date: '2026-11-08' },
    { id: 'gl_sala11', file: 'img/sala-11.jpg', cat: 'aparate', caption: 'Aparatul Smith', order: 11, date: '2026-11-08' },
    { id: 'gl_sala12', file: 'img/sala-12.jpg', cat: 'aparate', caption: 'Aparate pentru picioare', order: 12, date: '2026-11-08' },
    { id: 'gl_sala13', file: 'img/sala-13.jpg', cat: 'aparate', caption: 'Zona de bicepși', order: 13, date: '2026-11-08' },
    { id: 'gl_sala14', file: 'img/sala-14.jpg', cat: 'aparate', caption: 'Benzi de alergare', order: 14, date: '2026-11-08' },
    { id: 'gl_sala15', file: 'img/sala-15.jpg', cat: 'sala', caption: 'Oglinda și ganterele', order: 15, date: '2026-11-08' },
    { id: 'gl_sala16', file: 'img/sala-16.jpg', cat: 'aparate', caption: 'Cabluri și aparate', order: 16, date: '2026-11-08' },
    { id: 'gl_sala17', file: 'img/sala-17.jpg', cat: 'aparate', caption: 'Zona de cabluri', order: 17, date: '2026-11-08' },
    { id: 'gl_sala18', file: 'img/sala-18.jpg', cat: 'sala', caption: 'Sala, de sus', order: 18, date: '2026-11-08' },
    { id: 'gl_sala19', file: 'img/sala-19.jpg', cat: 'sala', caption: 'Zona de forță', order: 19, date: '2026-11-08' },
    { id: 'gl_sala20', file: 'img/sala-20.jpg', cat: 'aparate', caption: 'Aparat pentru piept', order: 20, date: '2026-11-08' },
    { id: 'gl_sala21', file: 'img/sala-21.jpg', cat: 'aparate', caption: 'Aparatele Hoist', order: 21, date: '2026-11-08' },
    { id: 'gl_sala22', file: 'img/sala-22.jpg', cat: 'aparate', caption: 'Presă pentru umeri', order: 22, date: '2026-11-08' },
    { id: 'gl_sala23', file: 'img/sala-23.jpg', cat: 'sala', caption: 'Recepția și sala', order: 23, date: '2026-11-08' },
    { id: 'gl_sala24', file: 'img/sala-24.jpg', cat: 'aparate', caption: 'Raftul de gantere', order: 24, date: '2026-11-08' },
    { id: 'gl_sala25', file: 'img/sala-25.jpg', cat: 'aparate', caption: 'Aparate și frânghii', order: 25, date: '2026-11-08' },
    { id: 'gl_sala26', file: 'img/sala-26.jpg', cat: 'sala', caption: 'Zona de forță și recepția', order: 26, date: '2026-11-08' },
    { id: 'gl_sala27', file: 'img/sala-27.jpg', cat: 'sala', caption: 'Inima sălii și Fitness Empire', order: 27, date: '2026-11-08' },
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
        name: 'Fitness Empire Telciu', tagline: 'Devino cea mai bună versiune a ta', phone: '0772 232 960', whatsapp: '40772232960', email: '',
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
      members: [], exercises: EXERCISES, programs: PROGRAMS, nutrition: NUTRITION, machines: MACHINES.map((x) => JSON.parse(JSON.stringify(x))), seedMach: MACHINES.map((x) => x.id),
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
      redemptions: [], sent: [], gallery: GALLERY.map((x) => ({ ...x })), seedGal: 4, admin: null,
    };
  }

  /* membri demonstrativi, ca demo-ul să arate „plin” */
  function demo(db, ctx) {
    Object.assign(db.settings, { name: 'Fitness Empire Telciu', phone: '0772 232 960', whatsapp: '40772232960', email: '', address: 'Telciu, jud. Bistrița-Năsăud', mapsUrl: 'https://maps.google.com/?q=Telciu' });
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
      const subLog = [];
      for (let k = 0, d = start; k < 1 + (i % 4); k++, d = add(d, -plan.days)) subLog.push({ id: ctx.uid('ab'), date: d, planId: plan.id });
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
        sub: { planId: plan.id, start, end }, subLog, weights: weights.reverse(), measures: [], photos: [], workouts: workouts.reverse(), checkins: checkins.reverse(), ciAt, chat: [], water: {},
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
  // aparatele reale din sală (poză, cum se reglează, greșeli); Robo face programe doar cu ele + gantere/bară/corp
  const MACHINES = [
    { id: 'ap_incpress', name: 'Nautilus Next Generation Incline Chest Press', short: 'Împins înclinat (Nautilus)', photo: 'img/aparat-1.jpg', ex: 'ex_m_incpress', muscles: 'Piept (partea de sus), umeri, triceps', setup: ['Scaunul: mânerele trebuie să ajungă la nivelul pieptului de sus când stai jos.', 'Greutatea: pune știftul în placa dorită. Începe ușor, cu 2–3 plăci.', 'Pune picioarele pe pedala verde de jos ca să aduci mânerele în față fără efort.'], mistakes: ['Desprinzi spatele de spătar ca să împingi mai greu.', 'Blochezi coatele la capăt.', 'Lași greutatea să cadă repede la revenire.'], order: 1 },
    { id: 'ap_decpress', name: 'Nautilus Next Generation Decline Chest Press', short: 'Împins declinat (Nautilus)', photo: 'img/aparat-2.jpg', ex: 'ex_m_decpress', muscles: 'Piept (partea de jos), triceps, umeri', setup: ['Scaunul: mânerele trebuie să fie la nivelul pieptului de jos.', 'Greutatea: pune știftul în placa dorită. Începe ușor.', 'Folosește pedala verde de jos ca să aduci mânerele în poziția de start.'], mistakes: ['Ridici umerii spre urechi.', 'Împingi doar cu brațele, fără să strângi pieptul.', 'Mișcări scurte și rapide în loc de complete și controlate.'], order: 2 },
    { id: 'ap_pecfly', name: 'Hoist Pec Fly', short: 'Fluturări piept (Hoist)', photo: 'img/aparat-3.jpg', ex: 'ex_m_pecfly', muscles: 'Piept, umeri (partea din față)', setup: ['Scaunul: reglează-l astfel încât mânerele să fie la nivelul pieptului.', 'Greutatea: pune știftul în teancul de plăci din spate. Începe ușor.', 'Stai cu spatele lipit de spătar și picioarele pe podea.'], mistakes: ['Lași brațele să meargă prea mult în spate (forțezi umerii).', 'Împingi cu mâinile în loc să strângi din piept.', 'Te desprinzi de spătar ca să tragi mai greu.'], order: 3 },
    { id: 'ap_chestpress', name: 'Oemmebi Chest Press', short: 'Împins la piept (Oemmebi)', photo: 'img/aparat-4.jpg', ex: 'ex_m_chestpress', muscles: 'Piept, triceps, umeri', setup: ['Scaunul: maneta de sub șezut. Mânerele trebuie să fie la nivelul mijlocului pieptului.', 'Greutatea: pune știftul galben în teancul de plăci (10–150). Începe cu 20–30.', 'Spatele și capul pe spătar, prinde mânerele cu palmele în jos.'], mistakes: ['Scaunul prea jos sau prea sus (mânerele la umeri sau la burtă).', 'Arcuiești spatele ca să împingi mai greu.', 'Lași plăcile să se lovească la revenire.'], order: 4 },
    { id: 'ap_inclbench', name: 'Incline Bench Press', short: 'Bancă înclinată cu bară', photo: 'img/aparat-5.jpg', ex: 'ex_inclbar', muscles: 'Piept (partea de sus), umeri, triceps', setup: ['Pune discurile egal pe ambele capete ale barei și asigură-le cu clame.', 'Reglează scaunul (știftul galben) astfel încât ochii să fie sub bară când te întinzi pe spătar.', 'Începe doar cu bara goală dacă ești la primele antrenamente.'], mistakes: ['Lași bara să cadă pe piept sau o faci să sară.', 'Ridici fesele de pe scaun ca să împingi mai greu.', 'Lucrezi greu fără nimeni care să te asigure.'], order: 5 },
    { id: 'ap_flatbench', name: 'Bench Press (bancă orizontală cu suport)', short: 'Bench press', photo: 'img/aparat-6.jpg', ex: 'ex_bench', muscles: 'Piept, triceps, umeri (partea din față)', setup: ['Pune banca orizontal (știftul galben de sub spătar) și centrează-te sub bară: ochii exact sub bară.', 'Suporturile de sus țin bara; pune-o pe o înălțime la care o scoți cu brațele aproape întinse. Suporturile de jos sunt de siguranță: pune-le puțin sub nivelul pieptului.', 'Pune discurile egal pe ambele capete și asigură-le cu clame. Începe cu bara goală dacă ești la început.'], mistakes: ['Lași bara să sară de pe piept în loc s-o cobori controlat.', 'Ridici fesele de pe bancă ca să împingi mai greu.', 'Lucrezi greu fără suporturile de siguranță puse sau fără cineva care să te asigure.'], order: 6 },
    { id: 'ap_latpull', name: 'Technogym Lat Pulldown', short: 'Helcometru (Technogym)', photo: 'img/aparat-7.jpg', ex: 'ex_latpull', muscles: 'Spate (dorsali), biceps, umeri (partea din spate)', setup: ['Așază-te cu fața spre aparat și reglează rolele maro astfel încât să-ți fixeze bine coapsele.', 'Greutatea: pune știftul în teancul de plăci. Începe ușor, cu 3–4 plăci.', 'Ridică-te, prinde bara mai larg decât umerii, apoi stai jos cu brațele întinse.'], mistakes: ['Tragi bara la ceafă în loc de partea de sus a pieptului.', 'Te lași mult pe spate și tragi cu tot corpul.', 'Lași bara să urce brusc în loc s-o controlezi.'], order: 7 },
    { id: 'ap_lateral', name: 'Flor System Lateral Raise', short: 'Ridicări laterale (Flor System)', photo: 'img/aparat-8.jpg', ex: 'ex_m_lateral', muscles: 'Umeri (partea laterală), trapez', setup: ['Scaunul: rotița neagră de sub șezut. Umerii trebuie să fie în dreptul axului pe care se rotesc brațele aparatului.', 'Greutatea: pune știftul în teancul de plăci din spate. Începe cu 1–2 plăci, umerii obosesc repede.', 'Spatele lipit de spătar, brațele pe lângă corp, pernele pe exteriorul brațelor, deasupra coatelor.'], mistakes: ['Ridici brațele mai sus de nivelul umerilor.', 'Ridici umerii spre urechi și lucrează trapezul în loc de umeri.', 'Lași greutatea să coboare brusc.'], order: 8 },
    { id: 'ap_smith', name: 'Smith Machine', short: 'Aparat Smith', photo: 'img/aparat-9.jpg', ex: 'ex_smithsquat', muscles: 'Picioare și fese (genuflexiuni); piept, umeri sau spate, după exercițiu', setup: ['Bara merge pe ghidaje: o scoți și o pui la loc rotind-o, cârligele se prind în găurile de pe stâlpi.', 'Pune opritorii de siguranță (de jos) puțin sub punctul cel mai de jos al mișcării tale.', 'Pune discurile egal pe ambele capete. Bara goală e mai ușoară decât o bară olimpică, deci începe cu greutate mică.', 'Se folosește pentru genuflexiuni, împins la piept sau înclinat (cu banca dedesubt), împins deasupra capului și ramat.'], mistakes: ['Lași bara să cadă fără să o prinzi în cârlige la final.', 'Nu pui opritorii de siguranță.', 'La genuflexiuni stai cu picioarele prea în spate și se încarcă genunchii.'], order: 9 },
    { id: 'ap_crossover', name: 'Cable Crossover', short: 'Crossover (scripeți)', photo: 'img/aparat-10.jpg', ex: 'ex_fly', muscles: 'Piept; plus spate, umeri, biceps, triceps sau abdomen, după exercițiu', setup: ['Alege înălțimea scripeților: mută căruciorul pe stâlp și blochează-l cu știftul. Sus pentru fluturări spre jos, jos pentru fluturări spre sus.', 'Greutatea: pune știftul în teancul de plăci din fiecare parte, la fel pe ambele. Începe ușor.', 'Prinde mânerele, fă un pas în față între stâlpi și stai cu un picior puțin în fața celuilalt, ca să ai echilibru.', 'Poți schimba mânerul (bară, frânghie, mâner simplu) pentru triceps, biceps, face pull sau ramat.'], mistakes: ['Pui greutăți diferite pe cele două părți.', 'Îndoi și întinzi coatele (devine împins) în loc să le ții ușor îndoite la fluturări.', 'Lași greutățile să tragă brațele mult în spate și forțezi umerii.'], order: 10 },
    { id: 'ap_row', name: 'Technogym Seated Row', short: 'Ramat (Technogym)', photo: 'img/aparat-11.jpg', ex: 'ex_m_row', muscles: 'Spate (mijloc și dorsali), biceps, umeri (partea din spate)', setup: ['Scaunul: rotița neagră din spate. Mânerele trebuie să ajungă la nivelul pieptului de jos.', 'Greutatea: pune știftul în teancul de plăci. Începe cu 3–4 plăci.', 'Stai cu pieptul lipit de perna neagră și picioarele pe suportul de jos; prinde mânerele cu brațele întinse.'], mistakes: ['Te desprinzi de pernă și tragi cu tot corpul.', 'Tragi doar din brațe, fără să strângi omoplații.', 'Ridici umerii spre urechi.'], order: 11 },
    { id: 'ap_lowrow', name: 'Technogym Low Row (ramat la cablu)', short: 'Ramat la cablu (Technogym)', photo: 'img/aparat-12.jpg', ex: 'ex_cablerow', muscles: 'Spate (mijloc și dorsali), biceps, umeri (partea din spate)', setup: ['Prinde mânerul de cablu (cel în V sau bara, din suportul de pe aparat) cu carabina.', 'Greutatea: pune știftul în teancul de plăci. Începe cu 3–4 plăci.', 'Stai pe bancheta maro cu tălpile pe suporturile gri și genunchii ușor îndoiți; spatele drept, pieptul sus.'], mistakes: ['Te legeni înainte și înapoi și tragi cu spatele de jos.', 'Rotunjești spatele când lași greutatea înainte.', 'Tragi doar din brațe, fără să strângi omoplații la final.'], order: 12 },
    { id: 'ap_pspull', name: 'Technogym Pure Strength Lat Pulldown', short: 'Tracțiuni cu discuri (Technogym Pure Strength)', photo: 'img/aparat-13.jpg', ex: 'ex_latpull', muscles: 'Spate (dorsali), biceps, umeri (partea din spate)', setup: ['Greutatea: pune discurile pe tija din spate. Brațul se încarcă singur, deci începe cu un disc mic pe fiecare parte sau chiar fără discuri.', 'Scaunul și rola pentru coapse: reglează-le astfel încât rola să-ți țină bine coapsele când stai jos.', 'Prinde mânerele de sus (drepte sau înclinate) cu brațele întinse și pieptul sus.'], mistakes: ['Tragi mânerele cu smucituri și lași brațul să urce brusc.', 'Te lași mult pe spate și tragi cu tot corpul.', 'Ridici umerii spre urechi în loc să-i tragi în jos.'], order: 13 },
    { id: 'ap_shpress', name: 'HBP Shoulder Press', short: 'Împins umeri (HBP)', photo: 'img/aparat-14.jpg', ex: 'ex_m_shpress', muscles: 'Umeri (partea din față și laterală), triceps', setup: ['Greutatea: pune discurile pe tijele brațului aparatului, egal pe ambele părți. Începe ușor.', 'Scaunul: știftul de sub șezut. Mânerele trebuie să fie la nivelul umerilor când stai jos.', 'Spatele și capul lipite de spătar, prinde mânerele cu palmele înainte.'], mistakes: ['Arcuiești spatele ca să împingi mai greu.', 'Blochezi coatele sus.', 'Lași brațul aparatului să cadă la revenire.'], order: 14 },
    { id: 'ap_reardelt', name: 'Galaxy Sport Rear Delt', short: 'Umăr posterior (Galaxy Sport)', photo: 'img/aparat-15.jpg', ex: 'ex_m_reardelt', muscles: 'Umeri (partea din spate), trapez, mijlocul spatelui', setup: ['Scaunul: știftul de sub șezut. Umerii trebuie să fie la înălțimea brațelor aparatului.', 'Greutatea: pune știftul în teancul de plăci din spate. Începe cu 1–2 plăci.', 'Stai cu pieptul pe spătar, cu fața spre aparat, și pune dosul brațelor (deasupra coatelor) pe pernele negre.'], mistakes: ['Pui greutate prea mare și tragi cu tot spatele.', 'Ridici umerii spre urechi.', 'Lași brațele să revină brusc.'], order: 15 },
    { id: 'ap_hacksquat', name: 'Hack Squat', short: 'Hack squat', photo: 'img/aparat-16.jpg', ex: 'ex_m_hacksquat', muscles: 'Cvadricepși, fese, ischiogambieri', setup: ['Greutatea: pune discurile pe tijele de pe lateral, egal pe ambele părți. Începe fără discuri sau cu discuri mici.', 'Intră cu spatele pe spătarul maro și umerii sub pernele de sus. Picioarele pe platformă, la lățimea umerilor.', 'Mânerele de siguranță: împinge puțin în sus și rotește-le ca să deblochezi; la final le blochezi la loc înainte să ieși.'], mistakes: ['Pui picioarele prea jos pe platformă și forțezi genunchii.', 'Ridici călcâiele sau desprinzi spatele de spătar.', 'Ieși din aparat fără să blochezi mânerele de siguranță.'], order: 16 },
    { id: 'ap_legcurl', name: 'Oemmebi Lying Leg Curl', short: 'Flexii femurali (Oemmebi)', photo: 'img/aparat-17.jpg', ex: 'ex_m_legcurl', muscles: 'Femurali (spatele coapsei), gambe', setup: ['Rola: știftul galben de pe braț. Reglează-o astfel încât să stea pe glezne, chiar sub mușchiul gambei.', 'Greutatea: pune știftul în teancul de plăci. Începe cu 2–3 plăci.', 'Întinde-te cu fața în jos, cu genunchii puțin în afara banchetei, și prinde mânerele de pe lateral.'], mistakes: ['Ridici șoldurile de pe banchetă ca să tragi mai greu.', 'Rola pusă prea sus, pe gambe.', 'Lași greutatea să cadă brusc la revenire.'], order: 17 },
    { id: 'ap_glute', name: 'Oemmebi Glute Machine', short: 'Fese (Oemmebi)', photo: 'img/aparat-18.jpg', ex: 'ex_m_glute', muscles: 'Fese, femurali, spatele de jos', setup: ['Brațul aparatului: rotița verde din lateral. Reglează-l astfel încât rola să stea în spatele coapsei sau sub talpă, când stai cu pieptul pe pernă.', 'Greutatea: pune știftul în teancul de plăci. Începe cu 2–3 plăci.', 'Pieptul pe perna neagră, mâinile pe mânere, un picior pe platforma de sprijin.'], mistakes: ['Arcuiești spatele de jos ca să urci piciorul mai sus.', 'Smucești greutatea în loc să strângi fesele.', 'Lucrezi doar cu un picior și uiți să schimbi.'], order: 18 },
    { id: 'ap_abbench', name: 'Oemmebi Ab Bench (bancă pentru abdomene)', short: 'Bancă abdomene (Oemmebi)', photo: 'img/aparat-19.jpg', ex: 'ex_m_abbench', muscles: 'Abdomen, oblici', setup: ['Înclinarea: reglează bancheta din știftul de dedesubt. Mai puțin înclinată = mai ușor.', 'Prinde picioarele sub cele două role de sus, cu genunchii ușor îndoiți.', 'Pentru oblici: când urci, rotește ușor trunchiul spre un genunchi, alternând.'], mistakes: ['Tragi de ceafă cu mâinile.', 'Urci cu smucituri, din elan.', 'Te lași de tot pe banchetă între repetări și abdomenul nu mai lucrează.'], order: 19 },
    { id: 'ap_hyper', name: 'Bancă hiperextensii 45°', short: 'Hiperextensii', photo: 'img/aparat-20.jpg', ex: 'ex_hyper', muscles: 'Spatele de jos, fese, femurali', setup: ['Perna: reglează-o din știftul de sub ea, astfel încât marginea să fie chiar sub oasele șoldului.', 'Pune tălpile pe platformă și călcâiele sub cele două role.', 'Brațele încrucișate la piept; mai greu: cu un disc ținut la piept.'], mistakes: ['Perna prea sus, pe burtă: nu te mai poți îndoi corect.', 'Urci prea sus și arcuiești spatele.', 'Cobori și urci din elan, cu smucituri.'], order: 20 },
    { id: 'ap_sissy', name: 'Suport Sissy Squat', short: 'Sissy squat', photo: 'img/aparat-21.jpg', ex: 'ex_sissy', muscles: 'Cvadricepși (partea din față a coapsei), abdomen', setup: ['Reglează perna pentru gambe (știftul de pe stâlp) astfel încât să stea chiar sub genunchi.', 'Reglează rolele de jos ca să-ți prindă bine gleznele.', 'Începe fără greutate; mai greu: ține un disc la piept.'], mistakes: ['Îndoi șoldurile și stai pe vine în loc să ții corpul drept.', 'Cobori prea jos de la primele antrenamente și forțezi genunchii.', 'Pierzi echilibrul pentru că nu ții brațele în față.'], order: 21 },
    { id: 'ap_triceps', name: 'Hoist Triceps Extension', short: 'Extensii triceps (Hoist)', photo: 'img/aparat-22.jpg', ex: 'ex_m_triceps', muscles: 'Triceps', setup: ['Scaunul: știftul de sub șezut. Coatele trebuie să ajungă pe pernele din față, la nivelul axului aparatului (discul rotund de pe lateral).', 'Greutatea: pune știftul în teancul de plăci Hoist. Începe cu 2–3 plăci.', 'Spatele pe spătar, coatele pe perne, prinde mânerele verticale.'], mistakes: ['Ridici coatele de pe perne ca să împingi mai greu.', 'Te apleci în față și împingi cu umerii.', 'Lași greutatea să urce brusc.'], order: 22 },
    { id: 'ap_legext', name: 'Nautilus Next Generation Leg Extension', short: 'Extensii cvadriceps (Nautilus)', photo: 'img/aparat-23.jpg', ex: 'ex_m_legext', muscles: 'Cvadricepși (partea din față a coapsei)', setup: ['Spătarul: maneta de sub scaun. Genunchii trebuie să fie exact în dreptul axului aparatului (discul rotund de pe lateral).', 'Rola pentru glezne: reglează-o să stea chiar deasupra labei piciorului.', 'Greutatea: pune știftul în teancul de plăci. Începe cu 2–3 plăci.'], mistakes: ['Genunchii nu sunt în dreptul axului (forțează articulația).', 'Arunci greutatea sus din elan.', 'Ridici fesele de pe scaun ca să împingi mai greu.'], order: 23 },
    { id: 'ap_abduct', name: 'Teca Abductor', short: 'Abductor (Teca)', photo: 'img/aparat-24.jpg', ex: 'ex_m_abduct', muscles: 'Fese (partea laterală), exteriorul coapselor', setup: ['Poziția de start: maneta de pe lateral reglează cât de apropiate sunt pernele la început. Începe cu ele aproape.', 'Greutatea: pune știftul în teancul de plăci. Începe cu 2–3 plăci.', 'Spatele pe spătar, picioarele pe suporturile de jos, pernele pe exteriorul genunchilor.'], mistakes: ['Te apleci în față ca să împingi mai greu.', 'Lași pernele să se închidă brusc.', 'Greutate prea mare și mișcare foarte scurtă.'], order: 24 },
  ];
  // bazele de date mai vechi primesc exercițiile noi (o singură dată; dacă sala le șterge, nu mai revin)
  function upgrade(db) {
    db.seedEx = db.seedEx || db.exercises.map((e) => e.id);
    let changed = false;
    // sala nu are antrenori: fără servicii de antrenament personal
    if (!db.noPT) { db.noPT = true; db.services = []; changed = true; }
    // fără evidență de bani: plățile vechi devin doar istoric de abonamente (fără sume)
    for (const m of db.members || []) if (m.payments) { m.subLog = [...(m.subLog || []), ...m.payments.map((p) => ({ id: p.id, date: p.date, planId: p.planId }))]; delete m.payments; changed = true; }
    if (!db.seedGal) { db.seedGal = true; db.gallery = db.gallery || []; for (const g of GALLERY) if (!db.gallery.some((x) => x.id === g.id)) db.gallery.push({ ...g, order: g.order - 100 }); changed = true; }
    if ((db.seedGal | 0) < 4) { db.seedGal = 4; db.gallery = db.gallery || []; for (const g of GALLERY) if (!db.gallery.some((x) => x.id === g.id)) db.gallery.push({ ...g, order: g.order - 100 }); changed = true; }
    // numărul nou al sălii (și în bazele de date mai vechi)
    if (db.settings && db.settings.phone === '0785 769 200') { db.settings.phone = '0772 232 960'; db.settings.whatsapp = '40772232960'; changed = true; }
    for (const e of EXERCISES) if (!db.seedEx.includes(e.id)) { db.seedEx.push(e.id); if (!db.exercises.some((x) => x.id === e.id)) db.exercises.push(JSON.parse(JSON.stringify(e))); changed = true; }
    db.machines = db.machines || []; db.seedMach = db.seedMach || [];
    for (const x of MACHINES) if (!db.seedMach.includes(x.id)) { db.seedMach.push(x.id); if (!db.machines.some((y) => y.id === x.id)) db.machines.push(JSON.parse(JSON.stringify(x))); changed = true; }
    return changed;
  }
  return { base, demo, upgrade, MACHINES, EXERCISES, PROGRAMS, NUTRITION, DAILY };
});
