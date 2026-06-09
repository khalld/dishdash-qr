# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this project adheres
to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-06-09

### Added

- **Waiter-ordering mode (`cameriere`)** — optional, per-tenant. New tenant flag
  `waiterOrdering` (default `false`). When enabled:
  - the public QR menu is **view-only** (self-order disabled, enforced
    server-side as well as in the UI);
  - a new tenant-scoped **`cameriere`** role takes the order for the guest, picks
    a table/pickup point, and submits it — the order is **created and immediately
    confirmed** (`CONFERMATA`, with its daily per-tenant number) and goes straight
    to the worker queue, skipping the gestore's pending queue.
- New cameriere area (`/cameriere`) with the order composer.
- Provisioning of camerieri by the superuser (cross-tenant) and the gestore
  (own tenant); waiter-mode toggle exposed to both (superuser tenant card,
  gestore Camerieri page).
- `create-superuser` (deploy bootstrap) now also provisions a `cameriere`
  account via `CAMERIERE_USERNAME` / `CAMERIERE_PASSWORD`.
- Bilingual "Modalità cameriere / Waiter mode" section on the `/presentation`
  page, plus "Open the app" links.

### Changed

- State machine: `IN_ATTESA → CONFERMATA` now also allows the `cameriere` actor
  (daily per-tenant numbering unchanged — still assigned on confirm).
- Presentation page: removed the interactive `/demo` route, `src/lib/demo/`, and
  all links to it; replaced the "book a demo" CTAs with links to the app (`/`)
  and staff sign-in (`/login`).
- Fixed the presentation phone mockups: the app wordmark no longer sits under
  the notch.

### Removed

- The interactive `/demo` route and `src/lib/demo/` components.

### Deploy / upgrade notes

- **Action required before deploying:** add `CAMERIERE_PASSWORD` (required,
  min 8 chars; optional `CAMERIERE_USERNAME`, default `cameriere`) to the GitHub
  `production` environment secrets. The `bootstrap-superuser` CI step fails its
  required-password check without it.
- Waiter-mode is **off by default** for every tenant and is toggled in-app, so a
  deploy does not change existing tenants' behaviour. Enable it per tenant from
  the superuser tenant admin or the gestore panel.
