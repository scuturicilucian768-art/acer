#!/usr/bin/env python3
"""Construiește demo-ul de pe GitHub Pages (sala-fitness/) din sala-app/public + sala-app/demo.
Fișierele JS/CSS primesc nume cu amprentă (core.1a2b3c4d.js), ca telefoanele să nu folosească niciodată o versiune veche din cache."""
import hashlib, os, re, shutil
ROOT = os.path.dirname(os.path.abspath(__file__))
SRC, DEMO, OUT = os.path.join(ROOT, 'sala-app/public'), os.path.join(ROOT, 'sala-app/demo'), os.path.join(ROOT, 'sala-fitness')
ASSETS = ['app.css', 'common.js', 'diet.js', 'core.js', 'robo-kb.js', 'robo.js', 'seed.js', 'env.js', 'fig.js', 'vision.js', 'qr.js']
os.makedirs(OUT, exist_ok=True)
# păstrăm fișierele cu amprentă mai vechi (un telefon cu pagina veche le mai poate cere), restul le rescriem
for f in os.listdir(SRC):
    s = os.path.join(SRC, f)
    if os.path.isdir(s): shutil.copytree(s, os.path.join(OUT, f), dirs_exist_ok=True)
    else: shutil.copy2(s, os.path.join(OUT, f))
for f in os.listdir(DEMO): shutil.copy2(os.path.join(DEMO, f), os.path.join(OUT, f))
names = {}
for a in ASSETS:
    data = open(os.path.join(OUT, a), 'rb').read()
    h = hashlib.sha1(data).hexdigest()[:8]; base, ext = a.rsplit('.', 1); hn = f'{base}.{h}.{ext}'
    open(os.path.join(OUT, hn), 'wb').write(data); names[a] = hn
for page in ['app.html', 'admin.html', 'index.html', 'sw.js']:
    p = os.path.join(OUT, page); s = open(p, encoding='utf-8').read()
    for a, hn in names.items():
        s = re.sub(r'(["\'])' + re.escape(a) + r'(\?v=\d+)?(["\'])', lambda m: m.group(1) + hn + m.group(3), s)
    if page == 'sw.js': s = re.sub(r"const C = 'gym-[^']*';", "const C = 'gym-" + hashlib.sha1(''.join(sorted(names.values())).encode()).hexdigest()[:8] + "';", s)
    open(p, 'w', encoding='utf-8').write(s)
print('demo construit:', ', '.join(names.values()))
