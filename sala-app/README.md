# Aplicația sălii de fitness

Aplicație pentru membri (se instalează pe telefon) + panou de administrare.
Node.js 18+, fără dependențe externe. Datele se salvează într-un fișier JSON în `DATA_DIR`.

- `/app` – aplicația membrilor
- `/admin` – panoul de administrare (la prima deschidere alegi numele sălii și parola)
- `/confidentialitate.html` – politica de confidențialitate

## Publicare pe Railway
1. railway.app → New Project → Deploy from GitHub repo → alege repository-ul.
   Dacă aplicația e într-un subfolder, setează **Root Directory** la acel folder.
2. Settings → Volumes → Add Volume, montat la `/data`.
3. Variables: `DATA_DIR=/data`, `PUSH_CONTACT=mailto:emailul-salii@exemplu.ro`.
4. Settings → Networking → Generate Domain (sau adaugă domeniul sălii).
5. Deschide `https://domeniul-tau/admin` și configurează sala.

Opțional: `ADMIN_PASSWORD` (altfel parola se alege la prima deschidere), `SEED_DEMO=1` doar pentru prezentări.
