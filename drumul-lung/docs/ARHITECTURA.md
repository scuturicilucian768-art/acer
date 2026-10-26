# Arhitectura jocului Drumul Lung

## De ce Godot 4

| | Godot 4 (ales) | Unity | Unreal Engine 5 |
|---|---|---|---|
| Cost și licență | gratuit, MIT, fără redevențe | gratuit până la un prag de venit, cu condiții | 5% redevență peste 1 mil. $ |
| PC, Android, iOS | da | da | da, dar greu pe telefoane modeste |
| Telefoane slabe | bine (renderer „Compatibility”) | bine | slab |
| Proiect în fișiere text | da: scene, scripturi și date pot fi scrise, verificate și versionate din cod | parțial (multe fișiere binare și GUID-uri) | nu (Blueprints binare) |
| Mărimea editorului | ~110 MB | câțiva GB | zeci de GB |

Motivul decisiv: jucătorul principal folosește telefonul, iar proiectul trebuie construit și testat pas cu pas. Godot permite scrierea întregului joc ca text, rularea testelor fără ecran și exportul APK-ului din linia de comandă. Așa a fost construită și verificată versiunea 0.1. Dacă, mai târziu, grafica fotorealistă pe PC devine prioritară, datele (hărți, vehicule) sunt în JSON și pot fi refolosite și în alt motor.

## Module

```
                 ┌──────────── data/maps/*.json ────────────┐
                 ▼                                          │
          RoadNetwork ──► WorldBuilder (teren, drumuri, râu, case, repere, pădure)
           │   │   └────► TrafficManager ─► TrafficCar × N
           │   └────────► JobSystem ─► Passenger × N
           │                   │
data/vehicles/*.json ─► Vehicle (VehicleBody3D) ◄── Player / CameraRig
                      Trailer  ◄─ PinJoint3D ─┘
                                   │
     GameState (bani, flotă, statistici, setări, salvare JSON) ◄── Hud, GameMenu, TouchControls
```

- **`RoadNetwork`** încarcă harta, netezește drumurile (Catmull-Rom), construiește graful pentru GPS (Dijkstra), benzile de trafic pe partea dreaptă și limitele de viteză (50 în localitate).
- **`WorldBuilder`** generează lumea din date:
  - relieful: o vale în jurul râului, cu dealuri dincolo de ea;
  - drumurile cu marcaje, râul cu ziduri și poduri;
  - casele aliniate la drum, cu garduri, porți și șuri;
  - clădirile importante, stațiile, indicatoarele, pădurea (MultiMesh) și coliziunile.
- **`Vehicle`** folosește suspensia și aderența din `VehicleBody3D` și adaugă peste ele:
  - motorul cu curbă de cuplu, ambreiajul, cutia de viteze și frâna de motor;
  - rezistența aerului și la rulare, consumul și avariile.

  Constantele de frânare și suspensie sunt calibrate prin teste.
- **`Trailer`** e un `VehicleBody3D` propriu, cu roată jockey, articulație sferică la cârlig și reguli de masă remorcabilă (frânată sau nefrânată).
- **`JobSystem`** gestionează contractele. Pentru cursele cu pasageri: mergi la stație, deschizi ușa, pasagerii urcă și plătesc, îi duci, deschizi ușa, ei coboară. Pentru bagaje: cuplezi remorca, o încarci și o livrezi. Rating-ul ține cont de frânări bruște, coliziuni, viteză și mersul cu ușa deschisă.
- **`GameState`** (autoload) păstrează banii, flota, statisticile și setările, cu salvare JSON în `user://`.
- **`TimeOfDay`** controlează soarele, luna, cerul, ceața și ferestrele luminate.

Toate coordonatele sunt în metri: x = est, z = sud. Vehiculele merg înainte spre +Z, convenția motorului fizic Godot.

## Formatul datelor

### Hartă (`data/maps/*.json`)
```json
{
  "name": "...", "accuracy": "schiță aproximativă | geometrie din OpenStreetMap", "source": "...",
  "bounds": [x0, z0, x1, z1], "valley_half_width": 560,
  "settlements": [{"name": "Telciu", "center": [x, z], "radius": 1250, "speed": 50}],
  "nodes": {"id": [x, z]},
  "roads": [{"id": "dn17c", "name": "DN17C", "type": "national|county|local|motorway", "speed": 90,
             "nodes": ["id", "..."], "ends": {"nodeId": "spre ..."}, "traffic": true}],
  "river": {"name": "Sălăuța", "width": 11, "points": [[x, z]]},
  "stops":  [{"id": "...", "name": "...", "pos": [x, z]}],
  "places": [{"type": "church|townhall|school|shop|hall|fuel|depot|police", "name": "...", "pos": [x, z], "face": [x, z]}],
  "signs":  [{"type": "locality|locality_end|direction", "text": "...", "pos": [x, z], "face": [x, z]}]
}
```

### Vehicul (`data/vehicles/*.json`)
Pentru un vehicul nou e suficient un fișier JSON: apare automat în magazin.
- **Identificare și preț:** `id`, `name`, `price`.
- **Dimensiuni (`dims`):** lungime, lățime, înălțime, ampatament, ecartament, rază roată.
- **Masă:** `mass`, `weight_front`, `cg_height`.
- **Motor (`engine`):** combustibil, cilindri, ralanti, turație maximă, curbă de cuplu `[[rpm, Nm], ...]`.
- **Cutie (`gearbox`):** moduri, rapoarte, transmisie finală, praguri pentru cutia automată.
- **Tracțiune:** `drive` = `rear` / `front` / `all`.
- **Rezervor (`fuel`):** capacitate, consum la ralanti, litri pe kWh.
- **Remorcare (`tow`):** cârlig, masă nefrânată, masă frânată.
- **Pasageri:** `seats`, `luggage_bags`.
- **Caroserie (`body.style`):** `van`, `sedan`, `wagon`, `suv` sau `hatch`.

## Despre mărci și licențe
- **Vehiculele** sunt modele originale inspirate de categoriile cerute (Sprinter, E46, Octavia, Touareg). Nu folosesc modelele 3D, siglele sau denumirile protejate ca produs. Ca să apară vehicule reale cu marca lor, e nevoie fie de licențe de la producători, fie de modele 3D cu licență clară (CC-BY sau CC0 cu acordul pentru mărci), adăugate în etapa 5.
- **Hărțile reale** vor folosi OpenStreetMap (ODbL, cu atribuire) și date de relief gratuite (Copernicus DEM GLO-30).
- **Sunetele** sunt sintetizate. Înregistrările reale se vor adăuga doar cu licență potrivită (de exemplu, Freesound CC0 sau CC-BY).

## Plan pe etape

| Etapă | Conținut | Ce lipsește acum ca să fie făcută |
|---|---|---|
| **1. Prototip Telciu** ✅ | tot ce e descris în README | — |
| **2. Telciu real + Colibița** | rulezi `tools/osm_import.py` pe exportul OSM; relief din DEM; lacul Colibița, barajul, drumul DJ173, serpentine | acces la OpenStreetMap și la date de relief (de pe calculatorul tău sau dintr-un mediu cu acces) |
| **3. Bistrița–Năsăud–Brașov** | hărți pe bucăți încărcate din mers (streaming pe celule de 2 km), orașe cu clădiri din OSM, semafoare, prioritate la intersecții, depășiri AI, poliție mobilă | sistem de streaming al lumii, clădiri din OSM |
| **4. Europa** | rute „comprimate” prin Ungaria (Borș/Nădlac), Austria, Germania, Italia, cu orașe-cheie și autostrăzi reprezentative (ca în ETS2: scară redusă, nu 1:1); vamă, rovinietă/vignetă, taxe de drum, limite pe țări, curse internaționale dus-întors, colete | hărțile țărilor, regulile pe țări |
| **5. Realism vizual și vehicule** | modele licențiate sau comandate, interioare detaliate, oglinzi funcționale, ploaie, ceață, ninsoare, drum ud, sunete înregistrate, animații de personaje | asset-uri cu licență, artist 3D |
| **6. Firmă** | șoferi AI angajați care fac curse singuri, garaje în alte orașe, rating de firmă, împrumuturi, personalizare (vopsea, interioare, scaune) | — |

## Cum se testează
- `tests/run_tests.gd` rulează fără ecran și conduce vehiculele reale prin motorul fizic. Toate cele 22 de verificări trec, la fiecare modificare.
- `tests/screenshots.gd` randează capturi reale cu OpenGL, cum se vede jocul pe telefon:
  ```
  xvfb-run godot --path . --rendering-driver opengl3 -s res://tests/screenshots.gd -- folder_iesire
  ```
- Exportul se face cu `godot --headless --path . --export-debug "Android" build/drumul-lung.apk`. Ai nevoie de șabloanele de export Godot 4.3, de Java JDK și de Android SDK (sau doar de `apksigner`, pentru proiectele fără Gradle).
