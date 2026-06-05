# CLAUDE.md

Guida di progetto per l'assistente. Leggere prima di implementare. Le decisioni
qui descritte sono vincolanti salvo richiesta esplicita di modifica.

## 1. Cos'è questo progetto

Web app **multitenant** per la prenotazione di comande in pub / street-food. Una
singola applicazione gestisce più tenant (più locali). Ogni cliente scansiona un
QR code (associato a un tavolo o punto di ritiro di uno specifico tenant), ordina
senza registrazione (solo nickname) e riceve un riepilogo con un identificativo di
tracciamento. Il gestore del tenant riceve la comanda in una coda virtuale, la
conferma (assegnazione di un numero progressivo) e la comanda passa alla coda dei
lavoratori, che la preparano e la marcano come pronta. Il pagamento avviene in
contanti alla consegna.

Stato: greenfield. Partire dalla specifica funzionale in
`docs/specifica-funzionale.md` e dal backlog in `docs/backlog.md`.

## 2. Multitenancy

- Una sola applicazione e un solo database servono più tenant; ogni tenant è un
  locale con menu, QR, comande e utenze proprie.
- Ogni entità di dominio porta un `tenantId`. **Ogni query lato server è sempre
  scopata sul tenant**; i dati di tenant diversi non si incrociano mai.
- Risoluzione del tenant:
  - lato **cliente** (pubblico): il tenant si ricava dal `qrToken` → `QrSource` →
    `tenantId`. Mai dal client direttamente.
  - lato **staff** (gestore/lavoratore): il tenant si ricava dalla sessione
    dell'utente autenticato (`StaffUser.tenantId`).
  - il **superuser** è globale (cross-tenant) e seleziona il tenant da
    amministrare.
- Branding: ogni tenant ha un **logo** proprio, mostrato nelle pagine cliente e
  staff di quel tenant.
- Per l'MVP il tenant non sta nell'URL pubblico (deriva da QR/sessione). Dominio
  dedicato o sottodominio per tenant sono un'opzione futura.

## 3. Ruoli e modello di provisioning

**Non è prevista alcuna registrazione.** Le utenze sono create dall'alto verso il
basso. Lo staff (superuser, gestore, lavoratore) accede con credenziali; il cliente
non si autentica.

- **Superuser** (lo sviluppatore che configura il sistema): ruolo globale.
  - crea tenant;
  - crea gestori e li assegna a uno specifico tenant;
  - crea lavoratori;
  - assegna un logo a un tenant.
- **Gestore** (un tenant): opera solo dentro il proprio tenant.
  - crea utenze per i lavoratori del proprio tenant;
  - configura il menu (CRUD, quantità, disponibilità a runtime);
  - genera N QR code etichettati (tavolo X, carrello, asporto…);
  - visualizza una pagina di riepilogo giornaliero/mensile;
  - conferma o annulla/rifiuta le comande in coda.
- **Lavoratore** (un tenant): può solo accedere e vedere le comande confermate dal
  gestore, prenderle in carico, marcarle pronte/consegnate. Nessuna gestione di
  menu o utenze.
- **Cliente** (anonimo, legato a un tenant via QR): scansiona il QR, ordina con un
  nickname, traccia la propria comanda. Nessuna registrazione.

Nota: sia il superuser sia il gestore possono creare lavoratori; il superuser è
cross-tenant, il gestore solo nel proprio tenant. **La creazione dei gestori è
prerogativa esclusiva del superuser: il gestore non può creare altri gestori.** Il
superuser iniziale è provisionato fuori dall'app (seed), non registrabile
dall'esterno.

## 4. Stack tecnologico

Vincoli forniti: Svelte, Bootstrap 5.3, MongoDB.

- **Framework**: SvelteKit con **Svelte 5 (runes: `$state`, `$derived`, `$effect`,
  `$props`)**. Svelte 5 è la versione stabile attuale ed è il default per i nuovi
  progetti; usare i runes, non la reattività implicita di Svelte 4. SvelteKit
  fornisce routing, SSR ed endpoint server (`+server.ts`) per il backend.
- **UI**: Bootstrap 5.3 (CSS + componenti). Importare via npm e includere il CSS in
  un layout; evitare il bundle JS di Bootstrap dove un componente Svelte fa lo
  stesso lavoro in modo più reattivo. Niente jQuery.
- **Database**: MongoDB. Usare il driver Mongoose. Una sola connessione condivisa
  lato server (`src/lib/server/db.ts`), mai esporre il client al browser.
- **Validazione**: Zod su ogni input che arriva dal client (azioni form ed endpoint).
- **Realtime**: Server-Sent Events (SSE) tramite endpoint SvelteKit per spingere gli
  aggiornamenti di coda a gestore/lavoratore e lo stato al cliente. MVP accettabile:
  polling ogni pochi secondi. Non introdurre WebSocket finché SSE non risulta
  insufficiente.
- **QR code**: pacchetto `qrcode` per la generazione lato server.
- **Auth**: superuser, gestore e lavoratore si autenticano (sessione su cookie
  `httpOnly`). Il cliente non si autentica: accede alla propria comanda tramite un
  token opaco non indovinabile nell'URL di tracciamento.

### Documentazione ufficiale (consultare sempre prima di codificare una feature)

- Svelte 5 / runes: https://svelte.dev/docs/svelte
- Migrazione e runes: https://svelte.dev/docs/svelte/v5-migration-guide
- SvelteKit: https://svelte.dev/docs/kit
- Bootstrap 5.3: https://getbootstrap.com/docs/5.3/
- Driver MongoDB per Node: https://www.mongodb.com/docs/drivers/node/current/
- Mongoose (se adottato): https://mongoosejs.com/docs/
- Zod: https://zod.dev/

Regola: per qualsiasi dettaglio di API, opzione o sintassi specifica di versione,
verificare sulla documentazione ufficiale sopra prima di scrivere il codice; non
affidarsi alla memoria, soprattutto per i runes di Svelte 5 e per le API del driver
MongoDB.

## 5. Architettura e struttura cartelle

Monorepo SvelteKit. Tutta la logica sensibile (DB, prezzi, transizioni di stato,
numerazione, auth, scoping del tenant) vive in `src/lib/server/` e non deve mai
finire nel bundle client.

```
src/
  routes/
    (public)/
      menu/[qrToken]/      # cliente: menu del tenant ricavato dal QR
      ordine/[trackToken]/ # cliente: tracciamento stato comanda
    (super)/
      admin/               # superuser (protetta, globale)
        tenants/           #   CRUD tenant + logo
        gestori/           #   crea gestori e li assegna a un tenant
        lavoratori/        #   crea lavoratori
    (staff)/
      gestore/             # area gestore (protetta, scoped al tenant)
        menu/              #   CRUD menu, disponibilità runtime
        qrcodes/           #   generazione/gestione QR
        coda/              #   coda virtuale: conferma/annulla
        lavoratori/        #   crea utenze lavoratore del proprio tenant
        report/            #   riepilogo giornaliero/mensile
      lavoratore/          # area lavoratore (protetta, scoped al tenant)
    api/ (o +server.ts)    # endpoint: ordini, SSE, ecc.
  lib/
    server/
      db.ts                # connessione MongoDB condivisa
      auth.ts              # sessioni superuser/gestore/lavoratore
      tenant.ts            # risoluzione e scoping del tenant
      repositories/        # accesso dati per entità, sempre scoped per tenant
      domain/
        order-state.ts     # macchina a stati + transizioni consentite
        pricing.ts         # calcolo totale lato server (fonte di verità)
        numbering.ts       # assegnazione numero comanda atomica (per tenant)
    components/            # componenti UI (Bootstrap-based)
    types.ts               # tipi condivisi
```

## 6. Modello di dominio (sintesi)

Entità principali (dettaglio in `docs/specifica-funzionale.md`). Tutte le entità
operative portano `tenantId`.

- `Tenant`: nome, `logoUrl`, impostazioni, attivo.
- `StaffUser`: ruolo (`superuser` | `gestore` | `lavoratore`); `tenantId` per
  gestore e lavoratore, assente per il superuser (globale).
- `MenuItem`: `tenantId`, nome, descrizione, prezzo, categoria, `available`
  (toggle runtime), `stock` opzionale.
- `QrSource`: `tenantId`, token, etichetta (es. "Tavolo 5"), tipo
  (tavolo/asporto/carrello/delivery futuro), attivo.
- `Order` (comanda): `tenantId`, `trackToken`, `nickname`, riferimento `QrSource`,
  righe ordine, `status`, `number` (assegnato alla conferma, progressivo per
  tenant), timestamp, totale calcolato lato server.
- `OrderItem`: riferimento `MenuItem`, quantità, note, prezzo unitario fotografato
  al momento dell'ordine.

## 7. Macchina a stati della comanda

Stati: `CARRELLO` → `IN_ATTESA` → `CONFERMATA` → `IN_PREPARAZIONE` → `PRONTA` →
`CONSEGNATA`. Da `IN_ATTESA` si esce verso `RIFIUTATA`/`ANNULLATA` (azione del
gestore o annullamento del cliente). Vedere diagramma e trigger in
`docs/specifica-funzionale.md`.

Regole non negoziabili:

- Le transizioni passano **solo** per `lib/server/domain/order-state.ts`. Mai
  modificare `status` direttamente nei repository o nelle route.
- Ogni transizione verifica stato di partenza, ruolo dell'attore **e tenant**
  (l'attore può agire solo su comande del proprio tenant; il superuser non opera
  sulle comande operative).
- Il numero comanda è assegnato una sola volta, alla transizione
  `IN_ATTESA → CONFERMATA`, in modo atomico, **progressivo per tenant e azzerato
  ogni giorno**.

## 8. Convenzioni

- Lingua del codice: identificatori e commenti in inglese; testi UI in italiano.
- Il **client non è mai fonte di verità** su prezzi, disponibilità, totale **né
  tenantId**: tenant e prezzi si ricavano/rivalidano sempre lato server.
- Validare ogni input con Zod al confine server.
- Invio ordine **idempotente**: chiave di idempotenza per evitare comande duplicate.
- Nessuna dipendenza JS pesante senza motivo; preferire runes e componenti Svelte ai
  plugin Bootstrap JS dove possibile.
- Niente PII oltre il nickname. Conservare il minimo indispensabile.

## 9. Sicurezza

- Cookie di sessione `httpOnly`, `secure`, `SameSite=Lax` per lo staff; sessione che
  porta ruolo e `tenantId`.
- Le route `(super)` richiedono ruolo `superuser`; le route `(staff)` richiedono
  autenticazione, ruolo e appartenenza al tenant, verificati in `hook`/`load` lato
  server, mai solo lato client.
- **Isolamento tenant (critico)**: ogni accesso ai dati è filtrato per `tenantId`
  preso dalla sessione (staff) o dal QR/ordine (cliente), mai dal corpo della
  richiesta. Le operazioni cross-tenant sono solo quelle del superuser.
- `trackToken` e `qrToken` opachi e non sequenziali (no enumerazione).
- Rate limiting sull'endpoint pubblico di creazione ordine (anti-spam del QR).
- Concorrenza disponibilità: controllo `available` e decremento `stock` atomici lato
  server alla conferma.

## 10. MVP vs feature future

MVP: provisioning superuser (tenant + utenze + logo), auth staff, menu +
disponibilità runtime, generazione QR, ordine cliente con nickname, coda virtuale
gestore (conferma/annulla + numero), coda lavoratore (in carico/pronta),
tracciamento cliente, consegna, riepilogo giornaliero/mensile del gestore.

Esplicitamente rinviate (predisporre il modello dati, non implementare ora):

- **Stampa comanda**: progettare `Order` perché sia serializzabile per stampa
  (valutare ESC/POS o, come MVP, stampa da browser).
- **Pagamento in app**: oggi solo contanti alla consegna; lasciare un gancio di
  stato/integrazione.
- **Consegna a domicilio**: modalità di ordine con consegna all'indirizzo del
  cliente, alternativa a tavolo/asporto. Predisporre il modello dati senza
  implementarla ora: la sorgente ordine prevede già il tipo `delivery`, l'ordine
  dovrà poter contenere indirizzo e contatto (per il domicilio servono dati di
  contatto, il solo nickname non basta) e la macchina a stati avrà un ramo di
  consegna (`PRONTA → IN_CONSEGNA → CONSEGNATA`) distinto dal ritiro al banco.

## 11. Comandi

Definiti in `package.json` dopo lo scaffolding (SvelteKit + adapter-node):

- `npm run dev` — server di sviluppo (Vite).
- `npm run build` — build di produzione (output Node in `build/`).
- `npm run preview` — anteprima locale della build.
- `npm run check` — `svelte-kit sync` + `svelte-check` (type-check). È lo stesso
  controllo eseguito in CI prima del deploy.
- `npm run lint` — Prettier (check) + ESLint.
- `npm run format` — Prettier (write).
- `npm run seed` — popola il DB con dati demo (tenant + staff + menu + QR).
- `npm run create-superuser` — crea/aggiorna il superuser iniziale (idempotente).

Requisiti runtime: Node ≥ 22.12 (vincolo di Vite 8 e Mongoose 9). Variabili
d'ambiente in `.env` (vedere `.env.example`): almeno `MONGODB_URI`; in produzione
anche `ORIGIN`. Avvio della build: `node build`.

## 12. Note operative per l'assistente

- Prima di una feature: rileggere la sezione pertinente di
  `docs/specifica-funzionale.md` e verificare la doc ufficiale dello strumento
  coinvolto.
- Non aggirare la macchina a stati, lo scoping del tenant né i controlli lato server
  per "fare prima".
- Quando una scelta tocca prezzi, stato, numerazione o isolamento tenant,
  segnalarla esplicitamente nel commit / PR.

## 13. Deploy

Il deploy avviene su **Render** e la **build è gestita da GitHub Actions**: il
push su `main` non viene mai pubblicato direttamente, ma passa prima dalla CI.
Dettaglio operativo in `docs/deploy.md`.

- **Hosting**: Render (servizio `web`, runtime Docker), descritto come
  Infrastructure-as-Code in `render.yaml`. `autoDeploy` è **disattivato**: Render
  non fa partire build automatiche sul push.
- **Build/CI gate (GitHub Actions)**: `.github/workflows/deploy.yml` esegue su
  ogni push a `main`, in ordine:
  1. `ci` — `npm ci` → `npm run check` (type-check) → `npm run build`. Se fallisce,
     il deploy non parte (una build/type-check rotta non raggiunge la produzione).
  2. `deploy` — chiama l'API di Render (`JorgeLNJunior/render-deploy`) con
     `RENDER_SERVICE_ID` + `RENDER_API_KEY` solo a CI verde.
  3. `bootstrap-superuser` — esegue `npm run create-superuser` (idempotente) per
     garantire il superuser iniziale in produzione (unico account provisionato
     fuori dall'app — vedere §3).
- **Immagine Docker**: `Dockerfile` multi-stage (builder → runner, utente non
  root, healthcheck). `.github/workflows/docker-publish.yml` pubblica anche
  l'immagine su GHCR (opzionale rispetto al deploy su Render).
- **Segreti** (GitHub → Environment `production`): `RENDER_SERVICE_ID`,
  `RENDER_API_KEY`, `MONGODB_URI`, `SUPERUSER_USERNAME`, `SUPERUSER_PASSWORD`.
  Su Render (dashboard, `sync:false`): `MONGODB_URI`, `ORIGIN`, e le stesse
  credenziali superuser. Nessun segreto è committato.
