<div align="center">

# 🍔 dishdash-qr

**Web app multitenant per la gestione di comande in pub e street-food.**

Il cliente scansiona un QR (legato a un tavolo o punto di ritiro di uno specifico
locale), ordina senza registrazione — solo nickname — e traccia la propria
comanda. Lo staff la lavora tramite due code, **gestore → lavoratore**, con
pagamento in contanti alla consegna.

![SvelteKit](https://img.shields.io/badge/SvelteKit-Svelte_5-ff3e00?logo=svelte&logoColor=white)
![Bootstrap](https://img.shields.io/badge/Bootstrap-5.3-7952b3?logo=bootstrap&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47a248?logo=mongodb&logoColor=white)
![Node](https://img.shields.io/badge/Node-%E2%89%A5%2022.12-339933?logo=nodedotjs&logoColor=white)

</div>

---

## 📚 Documentazione

| Documento                                                | Cosa contiene                                                                                                                                                                                                                                                                                                                                |
| -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [**CLAUDE.md**](CLAUDE.md)                               | Decisioni tecniche vincolanti: [stack](CLAUDE.md#4-stack-tecnologico), [architettura](CLAUDE.md#5-architettura-e-struttura-cartelle), [convenzioni](CLAUDE.md#8-convenzioni), [sicurezza](CLAUDE.md#9-sicurezza).                                                                                                                            |
| [**Specifica funzionale**](docs/specifica-funzionale.md) | [Attori](docs/specifica-funzionale.md#2-attori-e-capacità), [multitenancy](docs/specifica-funzionale.md#3-multitenancy), [flussi](docs/specifica-funzionale.md#5-flussi), [macchina a stati](docs/specifica-funzionale.md#6-macchina-a-stati-della-comanda), [modello dati](docs/specifica-funzionale.md#7-modello-dati-indicativo-mongodb). |
| [**Backlog**](docs/backlog.md)                           | Attività per milestone (M0–M8), con priorità P0–P2.                                                                                                                                                                                                                                                                                          |
| [**Deploy**](docs/deploy.md)                             | Render + GitHub Actions: configurazione, secrets e stato attuale.                                                                                                                                                                                                                                                                            |

## ✨ Funzionalità (MVP)

- **Ordine cliente anonimo** via QR: menu del locale, carrello, nickname, nessun login — vedi i [flussi operativi](docs/specifica-funzionale.md#5-flussi).
- **Due code staff**: il gestore conferma (assegnando il numero progressivo), il lavoratore prepara e consegna — vedi la [macchina a stati](docs/specifica-funzionale.md#6-macchina-a-stati-della-comanda).
- **Isolamento multitenant**: una sola app per più locali, ogni dato scopato per `tenantId` — vedi [multitenancy](docs/specifica-funzionale.md#3-multitenancy).
- **Provisioning dall'alto**: superuser → gestori → lavoratori, nessuna registrazione pubblica — vedi [attori e capacità](docs/specifica-funzionale.md#2-attori-e-capacità).
- **Tracciamento cliente** con token opaco e **riepilogo** giornaliero/mensile per il gestore.

> Roadmap e priorità nel [backlog](docs/backlog.md). Le funzionalità rinviate (stampa comanda, pagamento in app, consegna a domicilio) sono già predisposte nel [modello dati](docs/specifica-funzionale.md#7-modello-dati-indicativo-mongodb).

## 🧱 Stack

SvelteKit (**Svelte 5**, runes) · adapter-node · **Bootstrap 5.3** · **MongoDB** (Mongoose) · **Zod** · `qrcode`. Runtime **Node ≥ 22.12**. Vincoli e motivazioni in [`CLAUDE.md` §4](CLAUDE.md#4-stack-tecnologico).

## 🚀 Sviluppo locale

```bash
cp .env.example .env          # imposta almeno MONGODB_URI
npm install
npm run seed                  # opzionale: dati demo (tenant + staff + menu + QR)
npm run dev                   # http://localhost:5173
```

| Comando                    | Azione                                              |
| -------------------------- | --------------------------------------------------- |
| `npm run dev`              | Server di sviluppo (Vite).                          |
| `npm run build`            | Build di produzione (avvio: `node build`).          |
| `npm run preview`          | Anteprima locale della build.                       |
| `npm run check`            | Type-check (`svelte-check`) — stesso gate della CI. |
| `npm run lint` / `format`  | Prettier (check/write) + ESLint.                    |
| `npm run seed`             | Popola il DB con dati demo.                         |
| `npm run create-superuser` | Bootstrap idempotente degli account staff iniziali. |

Elenco completo e requisiti runtime in [`CLAUDE.md` §11](CLAUDE.md#11-comandi).

### 👥 Account demo (dopo `npm run seed`)

| Ruolo      | Username     | Password   |
| ---------- | ------------ | ---------- |
| Superuser  | `superadmin` | `password` |
| Gestore    | `gestore`    | `password` |
| Lavoratore | `lavoratore` | `password` |

I clienti non hanno login: ordinano dal link `/menu/<qrToken>` stampato dal seed. Chi può fare cosa è dettagliato in [attori e capacità](docs/specifica-funzionale.md#2-attori-e-capacità).

## 🗺️ Struttura

Tutta la logica sensibile (DB, prezzi, stato, numerazione, auth, scoping tenant) vive in `src/lib/server/` e non finisce mai nel bundle client. La mappa delle cartelle è in [`CLAUDE.md` §5](CLAUDE.md#5-architettura-e-struttura-cartelle).

## 📦 Deploy

**Render** + **GitHub Actions**: ogni push su `main` passa dalla CI (type-check + build) e viene pubblicato solo a CI verde. Procedura, secrets e stato attuale in [`docs/deploy.md`](docs/deploy.md).
