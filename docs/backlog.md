# Backlog — elenco attività

Attività raggruppate per milestone. L'ordine è una proposta di sequenza
implementativa: ogni milestone è rilasciabile e costruisce sulla precedente.
Legenda priorità: P0 (bloccante MVP), P1 (importante), P2 (miglioria).

Nota trasversale: l'app è **multitenant**. Tutte le entità portano `tenantId` e
ogni accesso ai dati è scopato per tenant fin dalle prime milestone.

## M0 — Setup di progetto

- [ ] (P0) Scaffolding SvelteKit + Svelte 5, TypeScript, ESLint/Prettier
- [ ] (P0) Integrare Bootstrap 5.3 (CSS nel layout, niente jQuery)
- [ ] (P0) Connessione MongoDB condivisa lato server (`lib/server/db.ts`)
- [ ] (P0) Configurare validazione con Zod
- [ ] (P0) Definire i tipi di dominio condivisi, incluso `tenantId` (`lib/types.ts`)
- [ ] (P0) Implementare la macchina a stati (`lib/server/domain/order-state.ts`)
- [ ] (P1) Definire e documentare i comandi npm in `CLAUDE.md`

## M1 — Multitenancy, auth e provisioning

- [ ] (P0) Modello `Tenant` (nome, `logoUrl`, attivo, settings)
- [ ] (P0) Modello `StaffUser` con ruoli `superuser` | `gestore` | `lavoratore` e
      `tenantId` (null per superuser)
- [ ] (P0) Seed del superuser iniziale (nessuna registrazione pubblica)
- [ ] (P0) Login a sessione su cookie httpOnly per i tre ruoli staff; sessione che
      porta ruolo e `tenantId`
- [ ] (P0) Risoluzione e scoping del tenant lato server (`lib/server/tenant.ts`):
      da sessione (staff) e da QR/ordine (cliente), mai dal client
- [ ] (P0) Hook/guard: route `(super)` solo superuser; route `(staff)` con auth,
      ruolo e appartenenza al tenant
- [ ] (P0) Repository sempre filtrati per `tenantId`
- [ ] (P1) Test di isolamento tra tenant
- [ ] (P1) Logout e scadenza sessione

## M2 — Area superuser

- [ ] (P0) CRUD `Tenant` + caricamento/assegnazione logo
- [ ] (P0) Creazione gestori e assegnazione a uno specifico tenant
- [ ] (P0) Creazione lavoratori (cross-tenant) e assegnazione a un tenant
- [ ] (P1) Selezione del tenant da amministrare

## M3 — Menu e disponibilità (gestore)

- [ ] (P0) CRUD `MenuItem` (scoped al tenant; prezzo in centesimi, categoria)
- [ ] (P0) Toggle `available` a runtime (disabilita elemento esaurito)
- [ ] (P0) Creazione utenze lavoratore del proprio tenant
- [ ] (P1) Gestione quantità/`stock` opzionale
- [ ] (P1) Categorie di menu ordinabili
- [ ] (P2) Foto e allergeni per elemento

## M4 — QR code (gestore)

- [ ] (P0) Modello `QrSource` (scoped al tenant) con token opaco, etichetta, tipo,
      stato attivo
- [ ] (P0) Generazione di N QR etichettati (tavolo X, carrello, asporto…)
- [ ] (P0) Pagina con QR scaricabili/stampabili
- [ ] (P1) Disattivare/riattivare una sorgente QR

## M5 — Ordine cliente

- [ ] (P0) Pagina menu per `qrToken`: tenant ricavato dal QR, soli elementi
      disponibili, logo del tenant
- [ ] (P0) Carrello lato client (runes), nickname obbligatorio
- [ ] (P0) Endpoint creazione ordine: validazione Zod, tenant e prezzi ricalcolati
      lato server, idempotenza
- [ ] (P0) Pagina riepilogo con `trackToken`
- [ ] (P0) Pagina tracciamento stato comanda per `trackToken`
- [ ] (P1) Annullamento da parte del cliente finché `IN_ATTESA`
- [ ] (P1) Rate limiting sull'endpoint pubblico di ordine

## M6 — Coda virtuale (gestore)

- [ ] (P0) Vista coda comande `IN_ATTESA` del tenant
- [ ] (P0) Conferma comanda → assegnazione numero atomica, progressiva per tenant e
      azzerata ogni giorno (`numbering.ts`)
- [ ] (P0) Annulla/rifiuta comanda con motivazione → stato `RIFIUTATA`
- [ ] (P0) Controllo disponibilità/decremento stock atomico alla conferma
- [ ] (P1) Aggiornamento realtime della coda (SSE; MVP: polling)
- [ ] (P2) Notifica sonora/visiva all'arrivo di nuove comande

## M7 — Coda lavoratore

- [ ] (P0) Vista comande `CONFERMATA` del tenant
- [ ] (P0) Presa in carico → `IN_PREPARAZIONE` (claim per multi-lavoratore)
- [ ] (P0) Marca pronta → `PRONTA`
- [ ] (P0) Conferma consegna → `CONSEGNATA`
- [ ] (P1) Aggiornamento realtime della coda

## M8 — Riepilogo e qualità

- [ ] (P0) Pagina riepilogo giornaliero/mensile del gestore (n° comande, incasso
      stimato), aggregata sugli `orders` del tenant
- [ ] (P1) Gestione orari di servizio (blocco/pausa ordini)
- [ ] (P1) Test sulla macchina a stati e sul calcolo prezzi
- [ ] (P1) Gestione errori di rete e stati di caricamento nelle UI
- [ ] (P1) Accessibilità (contrasto, tastiera, ARIA)
- [ ] (P2) Report avanzati (trend, confronto periodi, voci top)
- [ ] (P2) Tempo di attesa stimato per il cliente

## M9 — Modalità cameriere (ordine preso dallo staff)

Funzione opzionale per-tenant: invece dell'auto-ordine, il cliente vede il menu in
sola lettura e un cameriere prende e **conferma** la comanda (che salta la coda di
attesa del gestore ed entra diretta in quella dei lavoratori).

- [ ] (P1) Flag `waiterOrdering` sul `Tenant` (default false)
- [ ] (P1) Ruolo `cameriere` (scoped al tenant) in `StaffUser`; auth + guard area
- [ ] (P1) Toggle del flag: superuser (scheda tenant) e gestore (proprio pannello)
- [ ] (P1) Provisioning camerieri: superuser (cross-tenant) e gestore (proprio tenant)
- [ ] (P1) Menu pubblico in sola lettura quando il flag è attivo (UI + enforcement
      lato server sull'azione di invio)
- [ ] (P1) Area cameriere: scelta sorgente QR del tenant, composizione comanda, invio
- [ ] (P1) `IN_ATTESA → CONFERMATA` consentita anche al cameriere (crea + conferma
      in un colpo, numerazione atomica invariata)
- [ ] (P1) Bootstrap deploy: account cameriere in `create-superuser` (`CAMERIERE_*`)

## Feature future (predisporre, non implementare ora)

- [ ] (P2) Stampa comanda (ESC/POS; MVP possibile da browser) — modello già
      serializzabile
- [ ] (P2) Pagamento in app — gancio di stato/integrazione predisposto
- [ ] (P2) Consegna a domicilio — tipo ordine `delivery`, indirizzo + contatto
      cliente, ramo stati `PRONTA → IN_CONSEGNA → CONSEGNATA`, eventuale
      costo/zona di consegna; modello da predisporre fin d'ora
- [ ] (P2) Branding esteso per tenant (colori, nome visualizzato)
- [ ] (P2) Sottodominio/dominio dedicato per tenant
- [ ] (P2) Internazionalizzazione del menu
