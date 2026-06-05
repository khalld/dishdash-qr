# dishdash-qr

Web app **multitenant** per la prenotazione di comande in pub / street-food. Il
cliente scansiona un QR (legato a un tavolo/punto di ritiro di uno specifico
locale), ordina senza registrazione (solo nickname) e traccia la comanda; lo
staff la gestisce tramite due code (gestore → lavoratore). Pagamento in contanti
alla consegna.

> Decisioni tecniche vincolanti in [`CLAUDE.md`](CLAUDE.md). Specifica funzionale
> in [`docs/specifica-funzionale.md`](docs/specifica-funzionale.md). Backlog in
> [`docs/backlog.md`](docs/backlog.md). Deploy in [`docs/deploy.md`](docs/deploy.md).

## Stack

SvelteKit (Svelte 5, runes) · adapter-node · Bootstrap 5.3 · MongoDB (Mongoose) ·
Zod · `qrcode`. Node ≥ 22.12.

## Sviluppo locale

```bash
cp .env.example .env          # imposta almeno MONGODB_URI
npm install
npm run seed                  # opzionale: dati demo (tenant + staff + menu + QR)
npm run dev                   # http://localhost:5173
```

Comandi: `npm run dev | build | preview | check | lint | format`. La build di
produzione (`npm run build`) si avvia con `node build`.

### Account demo (dopo `npm run seed`)

| Ruolo      | Username     | Password   |
| ---------- | ------------ | ---------- |
| Superuser  | `superadmin` | `password` |
| Gestore    | `gestore`    | `password` |
| Lavoratore | `lavoratore` | `password` |

I clienti non hanno login: ordinano dal link `/menu/<qrToken>` stampato dal seed.

## Struttura

Tutta la logica sensibile (DB, prezzi, stato, numerazione, auth, scoping tenant)
vive in `src/lib/server/` e non finisce mai nel bundle client. Vedere
[`CLAUDE.md` §5](CLAUDE.md) per la mappa delle cartelle.

## Deploy

Render + GitHub Actions (la build passa dalla CI). Vedere
[`docs/deploy.md`](docs/deploy.md).
