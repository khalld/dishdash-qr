# Deploy — Render + GitHub Actions

> ✅ **Deploy su Render ATTIVO.** I job `deploy` e `bootstrap-superuser` in
> `.github/workflows/deploy.yml` girano a ogni push su `main` (e su run manuale),
> ma solo dopo che la CI (type-check + build) è verde. **Prerequisito**: servizio
> Render creato e secrets dell'Environment GitHub `production` configurati (vedi
> «Configurazione una tantum» qui sotto) — senza, il job `deploy` fallisce. Per
> disattivare di nuovo, rimetti `if: false` nei due job.

Il deploy è su **Render** e la **build passa sempre da GitHub Actions**. Un push
su `main` viene pubblicato solo se la CI (type-check + build) è verde.

```
push su main
   │
   ▼
GitHub Actions  ── ci ──▶ npm ci → npm run check → npm run build
   │  (a CI verde)
   ├─ deploy ───────────▶ Render API (JorgeLNJunior/render-deploy) → build immagine Docker
   │  (dopo il deploy)
   └─ bootstrap-superuser ▶ npm run create-superuser  (idempotente)
```

## Componenti

| File                                   | Ruolo                                                                                            |
| -------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `render.yaml`                          | Blueprint Render (servizio web Docker). `autoDeploy: false`: i deploy partono solo dalla Action. |
| `Dockerfile`                           | Build multi-stage (builder → runner), utente non root, healthcheck. Avvio: `node build`.         |
| `.github/workflows/deploy.yml`         | CI (check + build) → trigger deploy su Render → bootstrap superuser.                             |
| `.github/workflows/docker-publish.yml` | Pubblica l'immagine su GHCR (opzionale).                                                         |
| `scripts/create-superuser.mjs`         | Crea/aggiorna il superuser iniziale (unico account fuori dall'app).                              |

## Configurazione una tantum

### 1. Servizio Render

Collega il repo come **Blueprint** (Render legge `render.yaml`) oppure crea un
servizio web Docker puntando al `Dockerfile`. Annota il **Service ID**
(`srv-…`) e genera una **API Key** dal profilo Render.

Nel dashboard Render imposta gli env `sync:false`:

- `MONGODB_URI` — connessione MongoDB (es. Atlas).
- `ORIGIN` — URL pubblico completo, es. `https://dishdash-qr.onrender.com`
  (richiesto da adapter-node per i controlli CSRF/origin dietro proxy).
- `SUPERUSER_USERNAME`, `SUPERUSER_PASSWORD` — credenziali del superuser iniziale.

### 2. Secrets GitHub (Environment `production`)

Crea l'Environment `production` e aggiungi i secrets:

- `RENDER_SERVICE_ID`, `RENDER_API_KEY` — trigger del deploy su Render.
- `MONGODB_URI` — stesso DB di produzione (il job vi accede dal runner).
- `SUPERUSER_PASSWORD` _(richiesto, ≥8)_, `SUPERUSER_USERNAME` _(opz., default `superadmin`)_.
- `GESTORE_PASSWORD` _(richiesto, ≥8)_, `GESTORE_USERNAME` _(opz., default `gestore`)_.
- `LAVORATORE_PASSWORD` _(richiesto, ≥8)_, `LAVORATORE_USERNAME` _(opz., default `lavoratore`)_.
- `BOOTSTRAP_TENANT_NAME` _(opz., default `Pub del Centro`)_ — nome del tenant a
  cui legare gestore e lavoratore; **creato automaticamente se assente**.

> Il job `bootstrap-superuser` esegue `npm run create-superuser` contro il DB di
> produzione dopo ogni deploy. È idempotente e provisiona in un colpo solo: il
> tenant `BOOTSTRAP_TENANT_NAME` (creato se manca) e i **tre** account —
> superuser (globale), gestore e lavoratore — creandoli se mancano o
> reimpostandone la password. Nessun passo separato di provisioning del tenant:
> un DB vuoto è sufficiente. Il tenant auto-creato è una convenienza di
> bootstrap; a runtime la creazione dei tenant resta prerogativa del superuser
> (§3).

## Deploy

`git push origin main` → la Action fa il resto. Per un deploy manuale: scheda
**Actions** → workflow **Deploy to Render** → **Run workflow**.

## Note

- La CI gira su **Node 22** (vincolo di Vite 8 / Mongoose 9); allinea il
  `Dockerfile` (`node:22-alpine`) se cambi versione.
- Su piano `free` il servizio va in spin-down: il primo accesso dopo inattività
  è lento. Passa a `starter` in `render.yaml` per evitarlo.
- Nessuna registrazione pubblica: gestori e lavoratori si creano **dentro**
  l'app (superuser/gestore). Solo il superuser nasce qui, via script.
