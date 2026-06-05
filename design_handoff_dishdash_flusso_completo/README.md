# Handoff: DishDash QR — Flusso completo (end-to-end ordering flow)

## Overview

This package documents the **complete DishDash QR ordering flow** as a high-fidelity,
interactive design prototype. It covers all four actors of the product in a single
connected experience:

- **Cliente** (customer, mobile) — scans a QR, browses the menu, builds a cart,
  orders with just a nickname, then tracks the order live.
- **Gestore** (manager, tablet/desktop) — order queue, menu manager, QR generator,
  workers, daily/monthly reports.
- **Lavoratore** (worker, tablet) — preparation queue.
- **Superuser** (admin, desktop, dark navbar) — tenants, managers, workers.

The defining behaviour of this prototype: **all surfaces share one live order store.**
An order placed on the customer phone appears immediately in the manager's queue,
flows to the worker's preparation queue, and the customer's tracking screen updates
itself as staff act on the order. This is the heart of the product (a realtime
multitenant QR-ordering loop) and the thing to preserve when implementing.

DishDash QR is a **multitenant** web app for pubs and street-food venues: one app
serves many venues (each venue = one _tenant_), each with isolated menu, QR codes,
orders and staff. There is **no public sign-up** — staff accounts are created
top-down (superuser → gestori → lavoratori). Customers are anonymous (nickname only).
Payment is **cash on delivery**.

The order state machine:

```
CARRELLO → IN_ATTESA → CONFERMATA → IN_PREPARAZIONE → PRONTA → CONSEGNATA
                  ↘ RIFIUTATA (manager rejects)
                  ↘ ANNULLATA (customer cancels, only while IN_ATTESA)
```

---

## About the design files

The files in `design/` are **design references created in HTML/React** — a prototype
showing the intended look, copy and behaviour. **They are not production code to ship
directly.** The task is to **recreate these designs in the target codebase**, using
its established patterns, components and libraries.

**The target codebase is known.** DishDash QR is the GitHub repo
[`khalld/dishdash-qr`](https://github.com/khalld/dishdash-qr):

- **SvelteKit** (Svelte 5 runes) + `adapter-node`
- **Bootstrap 5.3 (CSS only)** — no JS bundle; components are plain Bootstrap markup
- **MongoDB** via Mongoose, **Zod** for validation, the `qrcode` npm package for QR images
- Routes under `src/routes/**`; brand tokens in `src/app.css`

So implementation means: **build these screens as SvelteKit routes + Svelte components,
styled with Bootstrap 5.3 utility classes** — matching the prototype pixel-for-pixel.
The prototype was itself built by reading that repo, so its markup maps almost 1:1 onto
Bootstrap classes (they are noted throughout this README). Where the prototype uses a
React idiom (`useReducer`, `useState`), use the Svelte equivalent (`$state`, `$derived`,
a store, or server load + form actions).

The prototype is React-on-Babel only because that's the prototyping medium — **do not
introduce React into the SvelteKit app.**

## Fidelity

**High-fidelity (hifi).** Final colors, typography, spacing, copy (Italian), component
choices, and interaction behaviour are all intentional and should be reproduced exactly.
Every visual decision is grounded in Bootstrap 5.3 + the one brand override (orange
promoted to `--bs-primary`). Recreate the UI pixel-perfectly using Bootstrap utilities;
do not invent new colors, gradients, shadows, or decorative motion — the product is
deliberately restrained.

Two things in the prototype are explicitly **flagged placeholders** (see Assets):
the QR glyph (CSS pattern, not a real QR) and tenant logos (initials box). Replace
these with the repo's real `qrcode` output and `tenant.logoUrl` respectively.

---

## Language, tone & formatting conventions (apply to ALL copy)

- **The entire UI is in Italian.** Code identifiers stay English; only user-facing
  strings are Italian.
- **Tone:** plain, direct, operational. No marketing fluff, no exclamation points,
  no emoji anywhere in the UI.
- **Address:** customers are addressed informally with **"tu"** (imperatives:
  _"Ordina dal tuo tavolo"_, _"Inquadra il QR"_). Staff labels are bare nouns
  (_Coda_, _Menu_, _QR code_, _Lavoratori_, _Report_).
- **Casing:** sentence case for all headings/buttons/nav. Status codes shown as state
  are `UPPER_SNAKE_CASE` (`IN_ATTESA`); status shown to people are Sentence-case
  labels ("In attesa di conferma").
- **Wordmark:** `DishDash` with `QR` (or the role name) as a separate accent token
  in brand orange via `.dd-brand`.
- **Currency:** Italian format — comma decimal, space before €: **`15,00 €`**.
  Prices are stored as **integer cents**, never floats. Helper:
  `euros(cents) → (cents/100).toFixed(2).replace('.',',') + ' €'`.
- **Order numbers:** rendered **`N° 42`**. Assigned only on manager confirm
  (a progressive daily counter; `IN_ATTESA` orders have no number yet → show `N° —`).

---

## Design tokens

All tokens live in `design/colors_and_type.css` (also documented in the project's
design system). Key values:

### Brand & primary

| Token               | Value     | Use                                   |
| ------------------- | --------- | ------------------------------------- |
| `--dd-brand`        | `#d9480f` | DishDash orange (Open Color orange-9) |
| `--dd-brand-hover`  | `#c43d0a` | hover/pressed                         |
| `--dd-brand-active` | `#ad3608` | active                                |

**Branding decision used in this prototype:** the orange is **promoted to
`--bs-primary`** (the `.dd-branded` class in `colors_and_type.css`). This makes all
primary buttons, links and focus rings orange. The live repo currently keeps Bootstrap's
**default blue** primary (`#0d6efd`) and uses orange only as a text accent (`.dd-brand`).
**Recommended: ship the branded orange variant** (what the prototype shows). If you must
mirror the repo exactly, keep blue primary + orange accent — but be consistent.

Because Bootstrap 5.3 bakes literal colors into `.btn-primary`, promoting `--bs-primary`
alone is NOT enough — you must also remap the button's own CSS vars (`--bs-btn-bg`, etc.).
The complete override block is in `colors_and_type.css` under `.dd-branded` — copy it.

### Orange ramp (Open Color) — used in charts

`--dd-orange-0 #fff4e6` · `-1 #ffe8cc` · `-2 #ffd8a8` · `-3 #ffc078` · `-4 #ffa94d` ·
`-5 #ff922b` · `-6 #fd7e14` · `-7 #f76707` · `-8 #e8590c` · `-9 #d9480f` (= brand).
The monthly report bars use `--bs-primary` (weekend) vs `--dd-orange-3` (weekday).

### Bootstrap semantic colors → order status

| Status            | Bootstrap class     | Color     |
| ----------------- | ------------------- | --------- |
| `CARRELLO`        | `text-bg-secondary` | `#6c757d` |
| `IN_ATTESA`       | `text-bg-warning`   | `#ffc107` |
| `CONFERMATA`      | `text-bg-info`      | `#0dcaf0` |
| `IN_PREPARAZIONE` | `text-bg-info`      | `#0dcaf0` |
| `PRONTA`          | `text-bg-success`   | `#198754` |
| `CONSEGNATA`      | `text-bg-success`   | `#198754` |
| `RIFIUTATA`       | `text-bg-danger`    | `#dc3545` |
| `ANNULLATA`       | `text-bg-danger`    | `#dc3545` |

Status is always communicated with a **pill text badge** (`badge rounded-pill text-bg-*`),
never an icon.

### Neutrals & surfaces

Body text `#212529` on white `#ffffff`; muted text `#6c757d` (`.text-secondary`);
panel/navbar bg `#f8f9fa` (`bg-body-tertiary`); superuser navbar `#212529` (`bg-dark`);
hairline borders `1px solid #dee2e6`. Gray ramp: 100 `#f8f9fa` → 900 `#212529`.

### Typography (Bootstrap native system font stack — NO webfonts)

`font-family: system-ui, -apple-system, "Segoe UI", Roboto, …`. Monospace
(`SFMono-Regular, Menlo, …`) only for inline `<code>` status tokens.
Scale: page titles `.h3` (1.75rem); screen/tenant titles `.h4` (1.5rem);
card titles `.h5`/`.h6`; intro copy `.lead` (1.25rem, weight 300); captions
`.small.text-secondary` (0.875rem); big order number `.display-6` (2.5rem).
Weights: 300 (lead) / 400 (body) / 500 (`.fw-medium` item names) / 600 (`.fw-semibold`) /
700 (`.fw-bold` wordmark & landing hero).

### Spacing, radii, elevation

- Spacing scale (Bootstrap): `.25 / .5 / 1 / 1.5 / 3 rem`. Vertical rhythm `py-4`/`py-5`.
  Group siblings with **flex + `gap`** (`d-flex align-items-center gap-2/3`), never bare margins.
- Radii: `0.25rem` sm · `0.375rem` default (cards/inputs/buttons) · `0.5rem` lg ·
  `50rem` pill (badges).
- Elevation: **essentially flat** — lean on 1px borders, not shadows. Use `shadow-sm`
  sparingly (sticky cart bar). Bootstrap shadow tokens exist but are mostly unused.

### Content widths (customer surfaces are narrow, single-column, mobile-first)

menu ≈ 720px · order tracking ≈ 560px · landing ≈ 640px. Staff surfaces target tablets/
desktop with a top `navbar` + `.container(-fluid) py-4` main and a responsive Bootstrap grid.

---

## Shared primitives

These small components are reused across surfaces (see `design/app/Primitives.jsx`).
Recreate each as a Svelte component / snippet:

- **`StatusBadge(status)`** → `<span class="badge rounded-pill text-bg-*">{label}</span>`.
  Maps status → Italian label + contextual class (table above).
- **`OrderNumber(n)`** → `N° n` in a `badge text-bg-dark`; if `n == null` show muted
  `N° —`.
- **`QtyStepper(value, onChange)`** → Bootstrap `btn-group btn-group-sm`: a
  `btn-outline-secondary` **−** (U+2212, disabled at min), a disabled `btn-light` count
  (min-width 40px) between, a `btn-outline-secondary` **+**.
- **`StaffNavbar(role, tabs, active, user)`** → light `navbar bg-body-tertiary border-bottom`;
  brand `DishDash · <span class="dd-brand">{role}</span>`; nav tabs (`nav-link`, `.active`
  on current); right side shows `user` + an **Esci** (`btn-sm btn-outline-secondary`).
- **`AdminNavbar`** → same but `navbar bg-dark` + `data-bs-theme="dark"`; **Esci** is
  `btn-outline-light`.
- **`Modal(title, children, footer)`** → Bootstrap `.modal-content` markup inside a custom
  fixed backdrop (`rgba(0,0,0,.4)`, dialog ≈460px). Closes on backdrop click + Escape key.
- **`QrGlyph(size)`** → **PLACEHOLDER**: a CSS conic-gradient checker square with a 4px
  `#212529` border, radius 6px. Replace with a real QR from the `qrcode` package.

---

## Screens / views

### A. Cliente (customer phone) — `design/app/Cliente.jsx`

Mobile-first single column inside a phone frame. Five screens via local state
`screen: landing | scan | menu | confirm | track`. A persistent sub-header (shown on
menu/confirm/track) shows the wordmark + `{venue} · {source}`, and on the menu a
`{count} nel carrello` pill when the cart is non-empty.

**A1. Landing** (`screen='landing'`)

- Centered hero: wordmark `DishDash QR` (30px, bold, "QR" orange), then `.lead`
  text-secondary: _"Ordina dal tuo tavolo scansionando il QR del locale. Nessuna
  registrazione: scegli un nickname e segui la tua comanda."_
- Two stacked `.card`s:
  - **"Sei un cliente?"** — _"Inquadra il QR code sul tavolo o al banco per aprire il
    menu del locale."_ + full-width primary button **"Inquadra il QR"** → goes to scan.
  - **"Sei dello staff?"** — _"Gestore e lavoratore accedono dal pannello staff con le
    proprie credenziali. →"_ (informational, no button).
- Footer, muted, centered: _"Pagamento in contanti alla consegna"_.

**A2. QR scan** (`screen='scan'`)

- Dark screen (`#0b0b0c`). Top-left **"← Annulla"** back button.
- Centered scan frame (`QrGlyph` 150px) with an animated green scan line
  (`@keyframes dd-scan`, 1.6s) while scanning. Caption: _"Inquadra il QR code del tavolo…"_.
- After ~1.7s → **found** state: green `badge` _"QR rilevato"_, venue name, prompt
  _"Scegli (o conferma) la postazione del QR:"_, a `form-select` of sources
  (Tavolo 1–5, Asporto), and full-width primary **"Apri il menu"** → menu.

**A3. Menu** (`screen='menu'`)

- Scroll area grouped by category (Panini / Contorni / Bevande). Category heading is
  uppercase, letter-spaced 0.04em, 12px, `.text-secondary fw-semibold`.
- Each item is a `list-group-item` row: left = name (`.fw-medium`) + optional description
  (`small text-secondary`); right = price + a `QtyStepper`. Unavailable items are muted,
  show an _"esaurito"_ badge (`text-bg-light border`), and the stepper is replaced by a
  disabled `btn-light` "—".
- **Sticky bottom bar** (white, top border, subtle top shadow): full-width primary button
  with **"Vai al carrello · {count}"** on the left and the running **total** on the right;
  disabled when cart empty.

**A4. Confirm / cart** (`screen='confirm'`)

- **"← Torna al menu"** link. Title `.h4` _"Il tuo ordine"_.
- Cart as `list-group`: each line `{qty}× {name}` + line total; final bold row
  **"Totale"** + grand total. Empty state: _"Il carrello è vuoto."_
- Field: **"Scegli un nickname"** (`form-control`, placeholder _"es. Marco"_), helper
  _"Nessuna registrazione. Ti serve solo per ritirare la comanda."_
- Bottom (pushed down): full-width primary **"Invia ordine"** — disabled until nickname
  is non-empty AND cart non-empty. Below it, muted _"Pagamento in contanti alla consegna"_.
- On send → dispatch PLACE (creates `IN_ATTESA` order, generates a track token) → track screen.

**A5. Live tracking** (`screen='track'`) — the payoff screen

- Header: muted `Comanda di {nickname} · {source}`; big `.display-6` order number
  (`N° 42` once confirmed, else `—`); a `StatusBadge`.
- **Stepper** (`ol`) over 5 steps: In attesa → Confermata → In preparazione → Pronta →
  Consegnata. Each step has a 24px round dot: completed/current filled with `--bs-primary`
  - white (✓ for done, index for current/upcoming), upcoming gray `#e9ecef`. The **current**
    step label is `.fw-semibold` and shows a pulsing dot (`@keyframes dd-pulse`).
- If `RIFIUTATA` → `alert-danger` _"La comanda è stata rifiutata dal locale."_; if
  `ANNULLATA` → `alert-secondary` _"Hai annullato la comanda."_ (stepper hidden).
- Order items recap `list-group` + bold Totale row.
- Contextual footer: while `IN_ATTESA`, an **"Annulla comanda"** (`btn-outline-danger`);
  on `PRONTA`, `alert-success` _"La tua comanda è pronta. Ritirala al banco!"_; on
  `CONSEGNATA`, `alert-success` _"Comanda consegnata. Buon appetito!"_. Always a
  **"Nuovo ordine"** link to restart.
- **This screen reads the shared store** — it must update by itself as staff progress
  the order (no customer refresh).

### B. Gestore (manager) — `design/app/Gestore.jsx`

Light `StaffNavbar role="Gestore"`, tabs **Coda · Menu · QR code · Lavoratori · Report**.
Content in `.container-fluid px-3 px-lg-4 py-4`.

**B1. Coda (order queue)** — default tab

- Title `.h3` _"Coda comande"_ + muted `{n} in attesa di conferma`.
- Three sections, each a responsive grid (`col-12 col-md-6 col-xl-4`) of **OrderCard**s:
  1. **In attesa** — cards with two actions: **"Conferma"** (`btn-primary`, assigns the
     next `N°` and moves to CONFERMATA) + **"Rifiuta"** (`btn-outline-danger` → RIFIUTATA).
     Empty: _"Nessuna comanda in attesa."_
  2. **In lavorazione** (uppercase section heading) — CONFERMATA/IN_PREPARAZIONE/PRONTA
     cards, read-only here (the worker drives them).
  3. **Concluse** — CONSEGNATA/RIFIUTATA/ANNULLATA cards.
- **OrderCard** (shared with Lavoratore): `.card` with nickname (`fw-semibold`) + muted
  `{source} · {time}`, `OrderNumber` top-right, a `StatusBadge`, an item list
  (`{qty}× {name}` + optional `· {notes}` in italic muted + line total), a bordered bold
  **Totale** row, then the action slot. Freshly-changed cards pulse once via `.dd-flash`
  (a 3s primary-colored ring, `@keyframes dd-flash`) so staff notice new/changed orders.

**B2. Menu manager**

- Title `.h3` _"Menu"_ + **"+ Nuovo elemento"** (`btn-sm btn-primary`).
- `table` (`align-middle`): columns **Nome** (name + optional description) · **Categoria**
  (`badge text-bg-light border`) · **Prezzo** (right-aligned) · **Disponibile** (a
  `form-check form-switch` toggle). Toggling availability is the runtime in/out-of-stock
  control. Helper below: _"Disattiva un elemento per segnarlo come esaurito: sparisce
  subito dal menu del cliente."_
- **"+ Nuovo elemento"** opens a Modal: Nome, Categoria (`select` of existing categories),
  Prezzo (€, decimal input parsed to cents). Add disabled until name + price present.

**B3. QR code generator**

- Title + **"+ Genera QR"**. Responsive grid (`col-6 col-md-4 col-lg-3`) of centered cards,
  each: `QrGlyph` 96px (**replace with real QR**), the spot label (Tavolo N / Asporto),
  and a **"Scarica"** (`btn-sm btn-outline-secondary`). "+ Genera QR" appends a new
  `Tavolo N`.

**B4. Lavoratori**

- Title + **"+ Nuovo lavoratore"**. `table`: Username · Tenant · **"Reimposta password"**.
  Only rows for the current tenant. Empty: _"Nessun lavoratore."_
- Modal: Username (placeholder _"es. cucina-3"_), helper noting the worker is assigned to
  the current tenant and the initial password is shown once.

**B5. Report** (toggle **Giornaliero / Mensile**, `btn-group btn-group-sm`)

- **Giornaliero:** caption `Giornaliero · oggi {HH:MM}`; a row of 4 stat cards
  (`col-6 col-lg-3`): Comande oggi · Consegnate · In lavorazione · Incasso (consegnate).
  Below, an **"Attività recente"** card (`list-group-flush`): each row = time (44px) + message.
- **Mensile:** caption `Mensile · maggio 2026 · 31 giorni`; 4 stat cards (Comande del mese ·
  Incasso totale · Scontrino medio · Giorno migliore + sub revenue). Then:
  - **"Incasso giornaliero"** card with a **bar chart** (`.dd-bars`, 150px tall): one bar
    per day, height ∝ revenue, **weekend bars = `--bs-primary`**, weekday = `--dd-orange-3`;
    every 5th day labelled; hover dims the bar (`filter: brightness(.9)`) and a `title`
    tooltip shows day/revenue/order count. Legend: Ven/Sab vs Feriali swatches.
  - **"Più venduti"** table (Articolo · Quantità · Incasso) + **"Canale"** card (Al tavolo
    vs Asporto counts + a two-segment `progress` bar with % split).
  - Footnote: _"Dati del mese precedente (esempio)…"_.
  - Monthly numbers are a **deterministic synthetic aggregate** (`buildMonth` in Gestore.jsx)
    so totals read sensibly in the demo — in production, compute from delivered orders for
    the period.

### C. Lavoratore (worker) — `design/app/Lavoratore.jsx`

Light `StaffNavbar role="Lavoratore"`, single tab **Comande**.

- Title `.h3` _"Comande da preparare"_ + muted `{n} attive`.
- Grid (`col-12 col-md-6 col-xl-4`) of **OrderCard**s for CONFERMATA/IN_PREPARAZIONE/PRONTA,
  sorted by order number. Each card's action depends on status:
  - `CONFERMATA` → **"Prendi in carico"** (`btn-primary`) → IN_PREPARAZIONE
  - `IN_PREPARAZIONE` → **"Segna pronta"** (`btn-success`) → PRONTA
  - `PRONTA` → **"Consegnata"** (`btn-outline-secondary`) → CONSEGNATA
- Empty: _"Nessuna comanda da preparare. In attesa di conferme dal gestore…"_

### D. Superuser (admin) — `design/app/Superuser.jsx`

**Dark** `AdminNavbar`, tabs **Tenant · Gestori · Lavoratori**. Top-down provisioning;
no public sign-up.

**D1. Tenant** — grid (`col-12 col-md-6 col-lg-4`) of cards: an initials **logo box**
(`.dd-tenant-logo`, 40px, gray — **PLACEHOLDER for `tenant.logoUrl`**), tenant name +
`gestore: {user}`, worker count, and an **attivo / sospeso** pill (success/secondary).
**"+ Nuovo tenant"** Modal: Nome del locale + a (disabled) **"Carica logo…"** with live
initials preview; helper notes the manager is associated in the next step.

**D2. Gestori** — `table` Username · Tenant · Stato (attivo/sospeso pill) · Reimposta
password. **"+ Nuovo gestore"** Modal: Username + Tenant `select`; helper _"Un gestore
gestisce un solo tenant."_

**D3. Lavoratori** — `table` Username · Tenant · Reimposta password. **"+ Nuovo
lavoratore"** Modal: Username + Tenant `select`.

---

## Interactions & behavior

- **One shared order store across all surfaces** (`design/app/store.jsx`). This is the
  central requirement. Actions and their transitions:
  | Action | Trigger (who) | Effect |
  | --- | --- | --- |
  | `place(nickname, source, items)` | customer "Invia ordine" | new `IN_ATTESA` order, returns a track token |
  | `confirm(id)` | manager "Conferma" | assigns next `N°` (daily counter, starts 42), → CONFERMATA |
  | `reject(id)` | manager "Rifiuta" | → RIFIUTATA |
  | `cancel(id)` | customer "Annulla comanda" (only while IN_ATTESA) | → ANNULLATA |
  | `take(id)` | worker "Prendi in carico" | → IN_PREPARAZIONE |
  | `ready(id)` | worker "Segna pronta" | → PRONTA |
  | `deliver(id)` | worker "Consegnata" | → CONSEGNATA |
  | `toggleItem(id)` | manager availability switch | flips menu item in/out of stock |
  | `addItem`, `addTenant`, `addGestore`, `addLavoratore`, `setTenantName` | CRUD flows | — |
- **Realtime update model.** In the prototype this is shared in-memory state + a 1s
  heartbeat re-render. In production, use the repo's intended approach (SSE/polling, noted
  in the backlog) so the manager queue, worker queue and customer tracking all update
  without manual refresh.
- **Fresh-change highlight.** When an order is created or changes status, its card pulses
  once for ~3.2s (`.dd-flash` ring). Implement as a one-shot animation keyed off a
  `flashAt` timestamp.
- **Activity log.** Confirm/reject/cancel/ready append a timestamped line to a recent-
  activity feed (capped ~20), surfaced in the daily report.
- **Motion is minimal and functional only:** the scan line, the tracking pulse, the
  fresh-card flash. **No entrance animations, no decorative motion** — honor Bootstrap's
  default transitions and nothing more.
- **Hover/press/focus:** all native Bootstrap (hover darkens fill ~7.5%, focus shows the
  `0 0 0 .25rem` tinted ring). With the branded variant the ring/switches are orange-tinted
  (see `.dd-branded` focus rules in the CSS).
- **Validation:** "Invia ordine" needs nickname + non-empty cart; modal "Add/Crea"
  buttons disabled until required fields present; prices parsed `"5,00"`/`"5.00"` → cents.

### Prototype-only scaffolding to drop on implementation

The HTML prototype wraps everything in a demo harness that is **not** part of the product:
a top toolbar with an **Affiancato / Cliente / Staff** view switch, in-attesa/in-coda
badges, a **"Reset demo"** button, a staff **login screen** with a role switcher, a
"Dispositivo staff" role toggle, and a **Tweaks** panel (primary color, venue name,
kitchen auto-pilot + speed). These exist only to demo the connected flow side-by-side.
In the real app each actor has its own authenticated session/route — don't build the
side-by-side harness or the role switcher.

---

## State management (prototype → SvelteKit mapping)

The prototype centralizes everything in a single reducer (`store.jsx`). In SvelteKit:

- **Server is source of truth** — orders, menu, tenants, workers live in MongoDB
  (Mongoose models). Use **load functions** to read and **form actions** to mutate.
- Order shape (per `data.js` / `store.jsx`):
  `{ id, trackToken, number|null, nickname, source, status, items:[{id,name,qty,price(cents),notes}], createdAt, flashAt }`.
- Customer reaches surfaces via tokenized public routes — menu by QR token, tracking by
  track token (`/menu/<qrToken>`, `/ordine/<trackToken>` in the repo). No customer auth.
- Staff routes are authenticated and tenant-scoped.
- Keep prices as **integer cents** end to end; format only at the edge with `euros()`.
- For live updates, prefer the repo's SSE/polling plan over client-only timers.

---

## Assets

- **No real logo asset exists** — the brand mark is purely typographic (text "DishDash"
  - "QR"/role in orange via `.dd-brand`). Do not invent a drawn logo.
- **QR codes are placeholders** in the prototype (`QrGlyph`, a CSS checker pattern).
  Generate real QRs with the repo's `qrcode` package, one per table/pickup point.
- **Tenant logos are placeholders** (initials box `.dd-tenant-logo`). Use `tenant.logoUrl`
  when present (renders small, ~40–48px, next to the venue name); leave initials as fallback.
- **No photography or illustration** anywhere — menu items have an optional `imageUrl`
  currently unused. No images, gradients, textures or patterns.
- **Icons:** the live repo uses **none** (text + badges only). The only glyphs are the
  Unicode `−` (U+2212) and `+` in the quantity stepper. If small affordances genuinely
  help, Bootstrap Icons is the sanctioned companion set (muted, ~16px) — but staying
  icon-free matches the repo.

---

## Files in this package

```
design_handoff_dishdash_flusso_completo/
├── README.md                          ← this document (self-sufficient spec)
└── design/
    ├── DishDash QR - Flusso completo.html   ← open this in a browser to run the prototype
    ├── colors_and_type.css                  ← all design tokens (copy the .dd-branded block)
    └── app/
        ├── data.js          ← demo data: tenant, menu (cents), sources, STATUS map, seed orders, euros()
        ├── store.jsx        ← shared order reducer + all actions + state machine (the logic to port)
        ├── Primitives.jsx   ← StatusBadge, OrderNumber, QtyStepper, Phone, StaffNavbar, AdminNavbar, Modal, QrGlyph
        ├── Cliente.jsx      ← customer phone: landing / scan / menu / confirm / track
        ├── Gestore.jsx      ← manager: Coda, Menu, QR, Lavoratori, Report (+ OrderCard, monthly aggregate)
        ├── Lavoratore.jsx   ← worker preparation queue
        ├── Superuser.jsx    ← admin: Tenant / Gestori / Lavoratori
        ├── Shell.jsx        ← demo harness (view switch, login, tweaks) — NOT part of the product
        └── tweaks-panel.jsx ← prototyping tool only — ignore for implementation
```

**To view the prototype:** open `design/DishDash QR - Flusso completo.html` in a browser.
Use **Affiancato** to see the customer phone and a staff device side-by-side, place an
order on the phone, log into the staff device as Gestore → Lavoratore, and watch the order
flow through. Turn on the Tweaks **"Auto-pilota cucina"** to advance orders hands-free.

**Reference the original repo** (`khalld/dishdash-qr`) for the canonical routes, Mongoose
models, Zod schemas, and the exact Bootstrap markup the prototype was distilled from —
especially `src/routes/**`, `docs/specifica-funzionale.md` and `docs/backlog.md`.
