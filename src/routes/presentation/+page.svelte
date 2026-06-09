<script lang="ts">
  // Static marketing/presentation page for DishDash QR — a faithful port of the
  // standalone "DishDash QR - Presentazione.html" mockup into a SvelteKit route
  // (/presentation). It reuses the app's Bootstrap 5.3 + `dd-branded` theme, so
  // the CDN Bootstrap link and the relative colors_and_type.css the original file
  // pulled in are dropped. Two behaviours from the original are kept the Svelte 5
  // way (runes, no DOM scripting): the IT/EN language toggle and the deterministic
  // monthly-report chart. This page is PRESENTATION ONLY — it shows static
  // mockups; it never touches MongoDB or the real authenticated app.
  let lang = $state<'it' | 'en'>('it');

  // keep <html lang> in sync for a11y/SEO (client-only; matches the original)
  $effect(() => {
    document.documentElement.lang = lang;
  });

  // ---- monthly report figures: deterministic, mirrors the original's buildMonth.
  // Demo-only sample data; the real report is computed from delivered orders.
  const YEAR = 2026;
  const MONTH = 4; // maggio 2026
  const DAYS = 31;
  const rows = Array.from({ length: DAYS }, (_, i) => {
    const d = i + 1;
    const wd = new Date(YEAR, MONTH, d).getDay();
    const weekend = wd === 5 || wd === 6; // ven/sab più affollati
    const slow = wd === 1; // lunedì più calmo
    const jitter = ((d * 73) % 19) / 19; // 0..1, stabile
    const orders = Math.round((weekend ? 58 : slow ? 26 : 38) + jitter * 18);
    const avg = 1650 + Math.round(jitter * 520); // scontrino medio in cents
    return { d, weekend, orders, revenue: orders * avg };
  });
  const totalOrders = rows.reduce((s, r) => s + r.orders, 0);
  const totalRevenue = rows.reduce((s, r) => s + r.revenue, 0);
  const avgTicket = Math.round(totalRevenue / totalOrders);
  const best = rows.reduce((a, b) => (b.revenue > a.revenue ? b : a), rows[0]);
  const maxRev = Math.max(...rows.map((r) => r.revenue));
  const asporto = Math.round(totalOrders * 0.36);
  const tavolo = totalOrders - asporto;
  const pctT = Math.round((tavolo / totalOrders) * 100);
  const pctA = Math.round((asporto / totalOrders) * 100);

  const euros = (c: number) =>
    (c / 100).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) +
    ' €';
  const intIt = (n: number) => n.toLocaleString('it-IT');
  const barHeight = (rev: number) => `${Math.max(4, Math.round((rev / maxRev) * 100))}%`;
</script>

<svelte:head>
  <title>DishDash QR — Presentazione</title>
</svelte:head>

<div class="dd-presentation" class:lang-en={lang === 'en'}>
  <!-- ============================ NAV ============================ -->
  <header class="dd-nav">
    <div class="container d-flex align-items-center gap-3 py-2">
      <a class="navbar-brand fw-bold mb-0 me-1" href="#top" style="font-size:1.25rem;"
        >DishDash <span class="dd-brand">QR</span></a
      >
      <nav class="nav d-none d-lg-flex align-items-center gap-1 me-auto">
        <a class="nav-link" href="#come-funziona"
          ><span class="t-it">Come funziona</span><span class="t-en">How it works</span></a
        >
        <a class="nav-link" href="#clienti"
          ><span class="t-it">Per i clienti</span><span class="t-en">For guests</span></a
        >
        <a class="nav-link" href="#staff"
          ><span class="t-it">Per lo staff</span><span class="t-en">For staff</span></a
        >
        <a class="nav-link" href="#cameriere"
          ><span class="t-it">Cameriere</span><span class="t-en">Waiter mode</span></a
        >
        <a class="nav-link" href="#report"
          ><span class="t-it">Report</span><span class="t-en">Reports</span></a
        >
        <a class="nav-link" href="#perche"
          ><span class="t-it">Perché</span><span class="t-en">Why</span></a
        >
      </nav>
      <div class="btn-group lang-seg ms-auto ms-lg-0" role="group" aria-label="Lingua">
        <button
          type="button"
          class="btn {lang === 'it' ? 'btn-primary' : 'btn-outline-secondary'}"
          onclick={() => (lang = 'it')}>IT</button
        >
        <button
          type="button"
          class="btn {lang === 'en' ? 'btn-primary' : 'btn-outline-secondary'}"
          onclick={() => (lang = 'en')}>EN</button
        >
      </div>
      <a href="#contatti" class="btn btn-primary btn-sm d-none d-sm-inline-flex">
        <span class="t-it">Richiedi una demo</span><span class="t-en">Book a demo</span>
      </a>
    </div>
  </header>

  <span id="top"></span>

  <!-- ============================ HERO ============================ -->
  <section class="sec pt-5">
    <div class="container">
      <div class="row align-items-center g-5">
        <div class="col-lg-6">
          <div class="eyebrow mb-3">
            <span class="t-it">Ordini con QR per pub e street food</span><span class="t-en"
              >QR ordering for pubs &amp; street food</span
            >
          </div>
          <h1 class="display-4 display-tight mb-3">
            <span class="t-it">Ordina dal tavolo.<br />Niente code, niente app.</span>
            <span class="t-en">Order from the table.<br />No queues, no app.</span>
          </h1>
          <p class="lede mb-4">
            <span class="t-it"
              >Il cliente inquadra il QR del locale, sceglie dal menu e ordina con un nickname. La
              comanda arriva subito al tuo staff. Pagamento in contanti alla consegna.</span
            ><span class="t-en"
              >Your guest scans the venue's QR, picks from the menu and orders with just a nickname.
              The ticket reaches your staff instantly. Cash on delivery.</span
            >
          </p>
          <div class="d-flex flex-wrap gap-2 mb-4">
            <a href="#contatti" class="btn btn-primary btn-lg"
              ><span class="t-it">Richiedi una demo</span><span class="t-en">Book a demo</span></a
            >
            <a href="#come-funziona" class="btn btn-outline-secondary btn-lg"
              ><span class="t-it">Guarda come funziona</span><span class="t-en"
                >See how it works</span
              ></a
            >
          </div>
          <div class="d-flex flex-wrap gap-4 text-secondary small">
            <div class="d-flex align-items-center gap-2">
              <span class="dd-brand fw-bold">✓</span>
              <span class="t-it">Nessuna registrazione per il cliente</span><span class="t-en"
                >No sign-up for guests</span
              >
            </div>
            <div class="d-flex align-items-center gap-2">
              <span class="dd-brand fw-bold">✓</span>
              <span class="t-it">Nessun hardware da installare</span><span class="t-en"
                >No hardware to install</span
              >
            </div>
          </div>
        </div>

        <!-- hero visual: phone (menu) ──▶ staff order card -->
        <div class="col-lg-6">
          <div class="row align-items-center g-3 justify-content-center">
            <div class="col-auto">
              <div class="ph mx-auto">
                <div class="ph-notch"></div>
                <div class="ph-screen">
                  <div
                    class="bg-body-tertiary border-bottom px-3 py-2 d-flex align-items-center justify-content-between"
                  >
                    <div>
                      <div class="fw-bold" style="font-size:17px;">
                        DishDash <span class="dd-brand">QR</span>
                      </div>
                      <div class="small text-secondary">Pub del Centro · Tavolo 5</div>
                    </div>
                    <span class="badge rounded-pill text-bg-secondary">3</span>
                  </div>
                  <div class="flex-grow-1 overflow-hidden px-3 py-3">
                    <h2
                      class="text-uppercase text-secondary fw-semibold mb-2"
                      style="letter-spacing:.04em;font-size:11px;"
                    >
                      Panini
                    </h2>
                    <ul class="list-group mb-3">
                      <li
                        class="list-group-item d-flex justify-content-between align-items-center gap-2"
                      >
                        <div>
                          <div class="fw-medium">Hamburger classico</div>
                          <small class="text-secondary">Manzo, cheddar, insalata</small>
                        </div>
                        <div class="d-flex align-items-center gap-2">
                          <span class="text-nowrap">8,50 €</span>
                          <div class="btn-group btn-group-sm" role="group">
                            <span class="btn btn-outline-secondary disabled">−</span><span
                              class="btn btn-light disabled"
                              style="min-width:34px;">1</span
                            ><span class="btn btn-outline-secondary disabled">+</span>
                          </div>
                        </div>
                      </li>
                      <li
                        class="list-group-item d-flex justify-content-between align-items-center gap-2"
                      >
                        <div>
                          <div class="fw-medium">Panino pulled pork</div>
                          <small class="text-secondary">Coleslaw, salsa BBQ</small>
                        </div>
                        <div class="d-flex align-items-center gap-2">
                          <span class="text-nowrap">7,50 €</span>
                          <div class="btn-group btn-group-sm" role="group">
                            <span class="btn btn-outline-secondary disabled">−</span><span
                              class="btn btn-light disabled"
                              style="min-width:34px;">1</span
                            ><span class="btn btn-outline-secondary disabled">+</span>
                          </div>
                        </div>
                      </li>
                    </ul>
                    <h2
                      class="text-uppercase text-secondary fw-semibold mb-2"
                      style="letter-spacing:.04em;font-size:11px;"
                    >
                      Bevande
                    </h2>
                    <ul class="list-group">
                      <li
                        class="list-group-item d-flex justify-content-between align-items-center gap-2"
                      >
                        <div>
                          <div class="fw-medium">Birra artigianale 0,4l</div>
                          <small class="text-secondary">Bionda alla spina</small>
                        </div>
                        <div class="d-flex align-items-center gap-2">
                          <span class="text-nowrap">5,00 €</span>
                          <div class="btn-group btn-group-sm" role="group">
                            <span class="btn btn-outline-secondary disabled">−</span><span
                              class="btn btn-light disabled"
                              style="min-width:34px;">1</span
                            ><span class="btn btn-outline-secondary disabled">+</span>
                          </div>
                        </div>
                      </li>
                    </ul>
                  </div>
                  <div class="border-top bg-white px-3 py-2">
                    <span
                      class="btn btn-primary w-100 d-flex justify-content-between align-items-center"
                      ><span>Vai al carrello · 3</span><span class="fw-semibold">21,00 €</span
                      ></span
                    >
                  </div>
                </div>
              </div>
            </div>

            <div class="col-lg-auto col-12 text-center">
              <svg
                class="flow-arrow"
                width="46"
                height="24"
                viewBox="0 0 46 24"
                fill="none"
                aria-hidden="true"
                ><path
                  d="M2 12h38m0 0-7-7m7 7-7 7"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                /></svg
              >
              <div class="small text-secondary mt-1">
                <span class="t-it">in tempo reale</span><span class="t-en">real-time</span>
              </div>
            </div>

            <div class="col-auto">
              <div class="card shadow-sm" style="width:230px;">
                <div class="card-header bg-body-tertiary py-2 fw-bold small">
                  DishDash · <span class="dd-brand">Gestore</span>
                </div>
                <div class="card-body p-3">
                  <div class="d-flex justify-content-between align-items-start mb-1">
                    <div>
                      <span class="fw-semibold">Marco</span>
                      <div class="text-secondary small">Tavolo 5 · 20:14</div>
                    </div>
                    <span class="text-secondary small">N° —</span>
                  </div>
                  <div class="mb-2">
                    <span class="badge rounded-pill text-bg-warning">In attesa di conferma</span>
                  </div>
                  <ul class="list-unstyled small mb-2">
                    <li class="d-flex justify-content-between">
                      <span><span class="text-secondary">1×</span> Hamburger classico</span><span
                        >8,50 €</span
                      >
                    </li>
                    <li class="d-flex justify-content-between">
                      <span><span class="text-secondary">1×</span> Patatine fritte</span><span
                        >4,00 €</span
                      >
                    </li>
                  </ul>
                  <div
                    class="d-flex justify-content-between fw-semibold border-top pt-2 mb-2 small"
                  >
                    <span>Totale</span><span>12,50 €</span>
                  </div>
                  <div class="d-flex gap-2">
                    <span class="btn btn-sm btn-primary flex-grow-1">Conferma</span><span
                      class="btn btn-sm btn-outline-danger">Rifiuta</span
                    >
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- ============================ COME FUNZIONA ============================ -->
  <section class="sec sec-tert anchor-offset" id="come-funziona">
    <div class="container">
      <div class="text-center mb-5">
        <div class="eyebrow mb-2">
          <span class="t-it">Il flusso, dall'inizio alla fine</span><span class="t-en"
            >The flow, end to end</span
          >
        </div>
        <h2 class="display-tight h1 mb-0">
          <span class="t-it">Come funziona</span><span class="t-en">How it works</span>
        </h2>
      </div>
      <div class="row g-4">
        <div class="col-md-6 col-lg-3">
          <div class="d-flex align-items-center gap-3 mb-3">
            <span class="step-num">1</span>
            <div
              class="qr-glyph"
              style="width:34px;height:34px;background-size:9px 9px;border-width:3px;"
            ></div>
          </div>
          <h3 class="h5"><span class="t-it">Scansiona</span><span class="t-en">Scan</span></h3>
          <p class="text-secondary mb-0">
            <span class="t-it"
              >Il cliente inquadra il QR sul tavolo o al banco e apre il menu del tuo locale.</span
            ><span class="t-en"
              >The guest scans the QR on the table or counter and opens your venue's menu.</span
            >
          </p>
        </div>
        <div class="col-md-6 col-lg-3">
          <div class="step-num mb-3">2</div>
          <h3 class="h5"><span class="t-it">Ordina</span><span class="t-en">Order</span></h3>
          <p class="text-secondary mb-0">
            <span class="t-it"
              >Sceglie i piatti, scrive un nickname e invia. Nessuna registrazione, nessuna app da
              scaricare.</span
            ><span class="t-en"
              >They pick dishes, type a nickname and submit. No sign-up, no app to download.</span
            >
          </p>
        </div>
        <div class="col-md-6 col-lg-3">
          <div class="step-num mb-3">3</div>
          <h3 class="h5"><span class="t-it">Segui</span><span class="t-en">Track</span></h3>
          <p class="text-secondary mb-0">
            <span class="t-it"
              >La comanda passa dal gestore alla cucina. Il cliente segue lo stato in tempo reale
              dal telefono.</span
            ><span class="t-en"
              >The ticket moves from manager to kitchen. The guest follows the status live on their
              phone.</span
            >
          </p>
        </div>
        <div class="col-md-6 col-lg-3">
          <div class="step-num mb-3">4</div>
          <h3 class="h5"><span class="t-it">Ritira</span><span class="t-en">Collect</span></h3>
          <p class="text-secondary mb-0">
            <span class="t-it"
              >Quando è pronta, il cliente ritira e paga in contanti alla consegna. Tutto qui.</span
            ><span class="t-en"
              >When it's ready, the guest collects and pays cash on delivery. That's it.</span
            >
          </p>
        </div>
      </div>
    </div>
  </section>

  <!-- ============================ PER I CLIENTI ============================ -->
  <section class="sec anchor-offset" id="clienti">
    <div class="container">
      <div class="row mb-5">
        <div class="col-lg-7">
          <div class="eyebrow mb-2">
            <span class="t-it">Per i clienti</span><span class="t-en">For guests</span>
          </div>
          <h2 class="display-tight h1 mb-3">
            <span class="t-it">Un menu nel palmo della mano</span><span class="t-en"
              >A menu in the palm of their hand</span
            >
          </h2>
          <p class="lede">
            <span class="t-it"
              >Mobile-first, in italiano, senza attriti: dal QR alla comanda in meno di un minuto.</span
            ><span class="t-en"
              >Mobile-first, in Italian, frictionless: from QR to order in under a minute.</span
            >
          </p>
        </div>
      </div>

      <div class="row justify-content-center g-4 g-lg-5">
        <!-- phone: menu -->
        <div class="col-auto text-center">
          <div class="ph mx-auto mb-3">
            <div class="ph-notch"></div>
            <div class="ph-screen">
              <div
                class="bg-body-tertiary border-bottom px-3 py-2 d-flex align-items-center justify-content-between"
              >
                <div>
                  <div class="fw-bold" style="font-size:17px;">
                    DishDash <span class="dd-brand">QR</span>
                  </div>
                  <div class="small text-secondary">Pub del Centro · Tavolo 5</div>
                </div>
                <span class="badge rounded-pill text-bg-secondary">2</span>
              </div>
              <div class="flex-grow-1 overflow-hidden px-3 py-3">
                <h3
                  class="text-uppercase text-secondary fw-semibold mb-2"
                  style="letter-spacing:.04em;font-size:11px;"
                >
                  Panini
                </h3>
                <ul class="list-group mb-3">
                  <li
                    class="list-group-item d-flex justify-content-between align-items-center gap-2"
                  >
                    <div>
                      <div class="fw-medium">Hot dog gigante</div>
                      <small class="text-secondary">Würstel, senape, cipolla</small>
                    </div>
                    <div class="d-flex align-items-center gap-2">
                      <span class="text-nowrap">6,50 €</span>
                      <div class="btn-group btn-group-sm">
                        <span class="btn btn-outline-secondary disabled">−</span><span
                          class="btn btn-light disabled"
                          style="min-width:32px;">0</span
                        ><span class="btn btn-outline-secondary disabled">+</span>
                      </div>
                    </div>
                  </li>
                  <li
                    class="list-group-item d-flex justify-content-between align-items-center gap-2"
                  >
                    <div>
                      <div class="fw-medium">Hamburger classico</div>
                      <small class="text-secondary">Manzo, cheddar, insalata</small>
                    </div>
                    <div class="d-flex align-items-center gap-2">
                      <span class="text-nowrap">8,50 €</span>
                      <div class="btn-group btn-group-sm">
                        <span class="btn btn-outline-secondary disabled">−</span><span
                          class="btn btn-light disabled"
                          style="min-width:32px;">1</span
                        ><span class="btn btn-outline-secondary disabled">+</span>
                      </div>
                    </div>
                  </li>
                </ul>
                <h3
                  class="text-uppercase text-secondary fw-semibold mb-2"
                  style="letter-spacing:.04em;font-size:11px;"
                >
                  Contorni
                </h3>
                <ul class="list-group">
                  <li
                    class="list-group-item d-flex justify-content-between align-items-center gap-2"
                  >
                    <div>
                      <div class="fw-medium">Patatine fritte</div>
                      <small class="text-secondary">Porzione abbondante</small>
                    </div>
                    <div class="d-flex align-items-center gap-2">
                      <span class="text-nowrap">4,00 €</span>
                      <div class="btn-group btn-group-sm">
                        <span class="btn btn-outline-secondary disabled">−</span><span
                          class="btn btn-light disabled"
                          style="min-width:32px;">1</span
                        ><span class="btn btn-outline-secondary disabled">+</span>
                      </div>
                    </div>
                  </li>
                  <li
                    class="list-group-item d-flex justify-content-between align-items-center gap-2 text-secondary"
                  >
                    <div>
                      <div class="fw-medium">
                        Onion rings <span class="badge text-bg-light border ms-1">esaurito</span>
                      </div>
                    </div>
                    <span class="btn btn-sm btn-light disabled">—</span>
                  </li>
                </ul>
              </div>
              <div class="border-top bg-white px-3 py-2">
                <span
                  class="btn btn-primary w-100 d-flex justify-content-between align-items-center"
                  ><span>Vai al carrello · 2</span><span class="fw-semibold">12,50 €</span></span
                >
              </div>
            </div>
          </div>
          <div class="ph-label">
            <span class="t-it">Menu &amp; carrello</span><span class="t-en">Menu &amp; cart</span>
          </div>
        </div>

        <!-- phone: nickname / invia -->
        <div class="col-auto text-center">
          <div class="ph mx-auto mb-3">
            <div class="ph-notch"></div>
            <div class="ph-screen">
              <div class="bg-body-tertiary border-bottom px-3 py-2">
                <div class="fw-bold" style="font-size:17px;">
                  DishDash <span class="dd-brand">QR</span>
                </div>
                <div class="small text-secondary">Pub del Centro · Tavolo 5</div>
              </div>
              <div class="flex-grow-1 overflow-hidden px-3 py-3 d-flex flex-column">
                <h2 class="h5 mb-3">Il tuo ordine</h2>
                <ul class="list-group mb-3">
                  <li class="list-group-item d-flex justify-content-between">
                    <span><span class="text-secondary me-1">1×</span>Hamburger classico</span><span
                      class="text-nowrap">8,50 €</span
                    >
                  </li>
                  <li class="list-group-item d-flex justify-content-between">
                    <span><span class="text-secondary me-1">1×</span>Patatine fritte</span><span
                      class="text-nowrap">4,00 €</span
                    >
                  </li>
                  <li class="list-group-item d-flex justify-content-between fw-semibold">
                    <span>Totale</span><span>12,50 €</span>
                  </li>
                </ul>
                <label class="form-label" for="pres-nickname">Scegli un nickname</label>
                <input
                  id="pres-nickname"
                  type="text"
                  class="form-control mb-1"
                  value="Marco"
                  readonly
                />
                <div class="form-text mb-3">
                  Nessuna registrazione. Ti serve solo per ritirare la comanda.
                </div>
                <div class="mt-auto">
                  <span class="btn btn-primary w-100">Invia ordine</span>
                  <div class="text-center text-secondary small mt-2">
                    Pagamento in contanti alla consegna
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="ph-label">
            <span class="t-it">Solo un nickname</span><span class="t-en">Just a nickname</span>
          </div>
        </div>

        <!-- phone: tracking -->
        <div class="col-auto text-center">
          <div class="ph mx-auto mb-3">
            <div class="ph-notch"></div>
            <div class="ph-screen">
              <div class="bg-body-tertiary border-bottom px-3 py-2">
                <div class="fw-bold" style="font-size:17px;">
                  DishDash <span class="dd-brand">QR</span>
                </div>
                <div class="small text-secondary">Pub del Centro · Tavolo 5</div>
              </div>
              <div class="flex-grow-1 overflow-hidden px-3 py-4 d-flex flex-column">
                <div class="text-center mb-4">
                  <div class="text-secondary small">Comanda di Marco · Tavolo 5</div>
                  <div class="display-6 fw-normal">N° 42</div>
                  <div class="mt-2">
                    <span class="badge rounded-pill text-bg-info">In preparazione</span>
                  </div>
                </div>
                <ol class="list-unstyled mb-0">
                  <li class="d-flex align-items-center gap-3 mb-2">
                    <span class="dd-step-dot" style="background:var(--bs-primary);color:#fff;"
                      >✓</span
                    ><span>In attesa</span>
                  </li>
                  <li class="d-flex align-items-center gap-3 mb-2">
                    <span class="dd-step-dot" style="background:var(--bs-primary);color:#fff;"
                      >✓</span
                    ><span>Confermata</span>
                  </li>
                  <li class="d-flex align-items-center gap-3 mb-2">
                    <span class="dd-step-dot" style="background:var(--bs-primary);color:#fff;"
                      >3</span
                    ><span class="fw-semibold">In preparazione</span><span class="dd-pulse ms-1"
                    ></span>
                  </li>
                  <li class="d-flex align-items-center gap-3 mb-2">
                    <span class="dd-step-dot" style="background:#e9ecef;color:#adb5bd;">4</span
                    ><span class="text-secondary">Pronta</span>
                  </li>
                  <li class="d-flex align-items-center gap-3 mb-2">
                    <span class="dd-step-dot" style="background:#e9ecef;color:#adb5bd;">5</span
                    ><span class="text-secondary">Consegnata</span>
                  </li>
                </ol>
              </div>
            </div>
          </div>
          <div class="ph-label">
            <span class="t-it">Stato in tempo reale</span><span class="t-en">Live status</span>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- ============================ PER LO STAFF ============================ -->
  <section class="sec sec-tert anchor-offset" id="staff">
    <div class="container">
      <div class="row mb-5">
        <div class="col-lg-8">
          <div class="eyebrow mb-2">
            <span class="t-it">Per lo staff</span><span class="t-en">For staff</span>
          </div>
          <h2 class="display-tight h1 mb-3">
            <span class="t-it">Una coda ordinata, dietro il banco</span><span class="t-en"
              >An orderly queue, behind the counter</span
            >
          </h2>
          <p class="lede">
            <span class="t-it"
              >Il gestore conferma o rifiuta le comande e assegna un numero progressivo. La cucina
              le prende in carico e le segna pronte. Tutto su tablet, senza carta.</span
            ><span class="t-en"
              >The manager confirms or rejects orders and assigns a running number. The kitchen
              takes them in charge and marks them ready. All on a tablet, paperless.</span
            >
          </p>
        </div>
      </div>

      <!-- Gestore: coda -->
      <div class="device mb-4">
        <nav class="navbar navbar-expand bg-body-tertiary border-bottom">
          <div class="container-fluid px-3">
            <span class="navbar-brand mb-0 fw-bold"
              >DishDash · <span class="dd-brand">Gestore</span></span
            >
            <ul class="navbar-nav me-auto">
              <li class="nav-item"><span class="nav-link active">Coda</span></li>
              <li class="nav-item d-none d-sm-block"><span class="nav-link">Menu</span></li>
              <li class="nav-item d-none d-sm-block"><span class="nav-link">QR code</span></li>
              <li class="nav-item d-none d-md-block"><span class="nav-link">Lavoratori</span></li>
              <li class="nav-item d-none d-md-block"><span class="nav-link">Report</span></li>
            </ul>
            <span class="navbar-text small me-3 d-none d-md-inline">gestore@pubdelcentro</span>
          </div>
        </nav>
        <div class="device-body p-3 p-lg-4">
          <div class="d-flex align-items-baseline justify-content-between mb-3">
            <h3 class="h4 mb-0">Coda comande</h3>
            <span class="text-secondary small">1 in attesa di conferma</span>
          </div>
          <div class="row g-3">
            <div class="col-12 col-md-6 col-xl-4">
              <div class="card h-100">
                <div class="card-body">
                  <div class="d-flex justify-content-between align-items-start mb-2">
                    <div>
                      <span class="fw-semibold">Marco</span><span class="text-secondary small ms-2"
                        >Tavolo 5 · 20:14</span
                      >
                    </div>
                    <span class="text-secondary small">N° —</span>
                  </div>
                  <div class="mb-2">
                    <span class="badge rounded-pill text-bg-warning">In attesa di conferma</span>
                  </div>
                  <ul class="list-unstyled mb-2 small">
                    <li class="d-flex justify-content-between">
                      <span
                        ><span class="text-secondary">1×</span> Hamburger classico<em
                          class="text-secondary"
                        >
                          · ben cotto</em
                        ></span
                      ><span>8,50 €</span>
                    </li>
                    <li class="d-flex justify-content-between">
                      <span><span class="text-secondary">1×</span> Patatine fritte</span><span
                        >4,00 €</span
                      >
                    </li>
                  </ul>
                  <div class="d-flex justify-content-between fw-semibold border-top pt-2 mb-2">
                    <span>Totale</span><span>12,50 €</span>
                  </div>
                  <div class="d-flex gap-2">
                    <span class="btn btn-sm btn-primary flex-grow-1">Conferma</span><span
                      class="btn btn-sm btn-outline-danger">Rifiuta</span
                    >
                  </div>
                </div>
              </div>
            </div>
            <div class="col-12 col-md-6 col-xl-4">
              <div class="card h-100">
                <div class="card-body">
                  <div class="d-flex justify-content-between align-items-start mb-2">
                    <div>
                      <span class="fw-semibold">Luca</span><span class="text-secondary small ms-2"
                        >Tavolo 2 · 20:09</span
                      >
                    </div>
                    <span class="badge text-bg-dark">N° 41</span>
                  </div>
                  <div class="mb-2">
                    <span class="badge rounded-pill text-bg-info">Confermata</span>
                  </div>
                  <ul class="list-unstyled mb-2 small">
                    <li class="d-flex justify-content-between">
                      <span
                        ><span class="text-secondary">3×</span> Hot dog gigante<em
                          class="text-secondary"
                        >
                          · extra senape</em
                        ></span
                      ><span>19,50 €</span>
                    </li>
                  </ul>
                  <div class="d-flex justify-content-between fw-semibold border-top pt-2">
                    <span>Totale</span><span>19,50 €</span>
                  </div>
                </div>
              </div>
            </div>
            <div class="col-12 col-md-6 col-xl-4">
              <div class="card h-100">
                <div class="card-body">
                  <div class="d-flex justify-content-between align-items-start mb-2">
                    <div>
                      <span class="fw-semibold">Sara</span><span class="text-secondary small ms-2"
                        >Tavolo 1 · 20:02</span
                      >
                    </div>
                    <span class="badge text-bg-dark">N° 40</span>
                  </div>
                  <div class="mb-2">
                    <span class="badge rounded-pill text-bg-info">In preparazione</span>
                  </div>
                  <ul class="list-unstyled mb-2 small">
                    <li class="d-flex justify-content-between">
                      <span><span class="text-secondary">2×</span> Onion rings</span><span
                        >9,00 €</span
                      >
                    </li>
                    <li class="d-flex justify-content-between">
                      <span><span class="text-secondary">2×</span> Acqua naturale</span><span
                        >3,00 €</span
                      >
                    </li>
                  </ul>
                  <div class="d-flex justify-content-between fw-semibold border-top pt-2">
                    <span>Totale</span><span>12,00 €</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="row g-4">
        <!-- menu manager -->
        <div class="col-lg-7">
          <div class="device h-100">
            <div
              class="card-header bg-white border-bottom px-3 py-2 d-flex justify-content-between align-items-center"
            >
              <span class="fw-medium">Menu</span>
              <span class="badge text-bg-light border"
                ><span class="t-it">Disponibilità in tempo reale</span><span class="t-en"
                  >Live availability</span
                ></span
              >
            </div>
            <div class="device-body p-3">
              <table class="table align-middle mb-1">
                <thead
                  ><tr
                    ><th>Nome</th><th class="d-none d-sm-table-cell">Categoria</th><th
                      class="text-end">Prezzo</th
                    ><th class="text-center">Disp.</th></tr
                  ></thead
                >
                <tbody>
                  <tr
                    ><td class="fw-medium">Panino pulled pork</td><td class="d-none d-sm-table-cell"
                      ><span class="badge text-bg-light border">Panini</span></td
                    ><td class="text-end">7,50 €</td><td class="text-center"
                      ><div class="form-check form-switch d-inline-block">
                        <input class="form-check-input" type="checkbox" checked disabled />
                      </div></td
                    ></tr
                  >
                  <tr
                    ><td class="fw-medium">Birra artigianale 0,4l</td><td
                      class="d-none d-sm-table-cell"
                      ><span class="badge text-bg-light border">Bevande</span></td
                    ><td class="text-end">5,00 €</td><td class="text-center"
                      ><div class="form-check form-switch d-inline-block">
                        <input class="form-check-input" type="checkbox" checked disabled />
                      </div></td
                    ></tr
                  >
                  <tr class="text-secondary"
                    ><td class="fw-medium">Cola in lattina</td><td class="d-none d-sm-table-cell"
                      ><span class="badge text-bg-light border">Bevande</span></td
                    ><td class="text-end">3,00 €</td><td class="text-center"
                      ><div class="form-check form-switch d-inline-block">
                        <input class="form-check-input" type="checkbox" disabled />
                      </div></td
                    ></tr
                  >
                </tbody>
              </table>
              <p class="text-secondary small mb-0">
                <span class="t-it"
                  >Disattiva un elemento per segnarlo come esaurito: sparisce subito dal menu del
                  cliente.</span
                ><span class="t-en"
                  >Switch an item off to mark it sold out: it vanishes from the guest menu at once.</span
                >
              </p>
            </div>
          </div>
        </div>
        <!-- QR generator -->
        <div class="col-lg-5">
          <div class="device h-100">
            <div
              class="card-header bg-white border-bottom px-3 py-2 d-flex justify-content-between align-items-center"
            >
              <span class="fw-medium">QR code</span>
              <span class="btn btn-sm btn-primary disabled">+ Genera QR</span>
            </div>
            <div class="device-body p-3">
              <div class="row g-3">
                <div class="col-6 col-sm-4">
                  <div class="card text-center h-100">
                    <div class="card-body p-2">
                      <div class="d-flex justify-content-center mb-2">
                        <div
                          class="qr-glyph"
                          style="width:72px;height:72px;background-size:12px 12px;"
                        ></div>
                      </div>
                      <div class="fw-medium small">Tavolo 1</div>
                      <span class="btn btn-sm btn-outline-secondary mt-1 disabled">Scarica</span>
                    </div>
                  </div>
                </div>
                <div class="col-6 col-sm-4">
                  <div class="card text-center h-100">
                    <div class="card-body p-2">
                      <div class="d-flex justify-content-center mb-2">
                        <div
                          class="qr-glyph"
                          style="width:72px;height:72px;background-size:12px 12px;"
                        ></div>
                      </div>
                      <div class="fw-medium small">Tavolo 2</div>
                      <span class="btn btn-sm btn-outline-secondary mt-1 disabled">Scarica</span>
                    </div>
                  </div>
                </div>
                <div class="col-6 col-sm-4">
                  <div class="card text-center h-100">
                    <div class="card-body p-2">
                      <div class="d-flex justify-content-center mb-2">
                        <div
                          class="qr-glyph"
                          style="width:72px;height:72px;background-size:12px 12px;"
                        ></div>
                      </div>
                      <div class="fw-medium small">Asporto</div>
                      <span class="btn btn-sm btn-outline-secondary mt-1 disabled">Scarica</span>
                    </div>
                  </div>
                </div>
              </div>
              <p class="text-secondary small mb-0 mt-3">
                <span class="t-it"
                  >Un QR per ogni tavolo o punto di ritiro. Stampa e attacca: sei operativo.</span
                ><span class="t-en"
                  >One QR per table or pickup point. Print, stick it on — you're live.</span
                >
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Lavoratore -->
      <div class="device mt-4">
        <nav class="navbar navbar-expand bg-body-tertiary border-bottom">
          <div class="container-fluid px-3">
            <span class="navbar-brand mb-0 fw-bold"
              >DishDash · <span class="dd-brand">Lavoratore</span></span
            >
            <ul class="navbar-nav me-auto">
              <li class="nav-item"><span class="nav-link active">Comande</span></li>
            </ul>
            <span class="navbar-text small me-3 d-none d-md-inline">cucina-1</span>
          </div>
        </nav>
        <div class="device-body p-3 p-lg-4">
          <div class="d-flex align-items-baseline justify-content-between mb-3">
            <h3 class="h4 mb-0">Comande da preparare</h3>
            <span class="text-secondary small">3 attive</span>
          </div>
          <div class="row g-3">
            <div class="col-12 col-md-6 col-xl-4">
              <div class="card h-100">
                <div class="card-body">
                  <div class="d-flex justify-content-between align-items-start mb-2">
                    <div>
                      <span class="fw-semibold">Sara</span><span class="text-secondary small ms-2"
                        >Tavolo 1 · 20:02</span
                      >
                    </div>
                    <span class="badge text-bg-dark">N° 40</span>
                  </div>
                  <div class="mb-2">
                    <span class="badge rounded-pill text-bg-info">In preparazione</span>
                  </div>
                  <ul class="list-unstyled mb-2 small">
                    <li class="d-flex justify-content-between">
                      <span><span class="text-secondary">2×</span> Onion rings</span><span
                        >9,00 €</span
                      >
                    </li>
                    <li class="d-flex justify-content-between">
                      <span><span class="text-secondary">2×</span> Acqua naturale</span><span
                        >3,00 €</span
                      >
                    </li>
                  </ul>
                  <div class="d-flex justify-content-between fw-semibold border-top pt-2 mb-2">
                    <span>Totale</span><span>12,00 €</span>
                  </div>
                  <span class="btn btn-sm btn-success w-100">Segna pronta</span>
                </div>
              </div>
            </div>
            <div class="col-12 col-md-6 col-xl-4">
              <div class="card h-100">
                <div class="card-body">
                  <div class="d-flex justify-content-between align-items-start mb-2">
                    <div>
                      <span class="fw-semibold">Luca</span><span class="text-secondary small ms-2"
                        >Tavolo 2 · 20:09</span
                      >
                    </div>
                    <span class="badge text-bg-dark">N° 41</span>
                  </div>
                  <div class="mb-2">
                    <span class="badge rounded-pill text-bg-info">Confermata</span>
                  </div>
                  <ul class="list-unstyled mb-2 small">
                    <li class="d-flex justify-content-between">
                      <span><span class="text-secondary">3×</span> Hot dog gigante</span><span
                        >19,50 €</span
                      >
                    </li>
                  </ul>
                  <div class="d-flex justify-content-between fw-semibold border-top pt-2 mb-2">
                    <span>Totale</span><span>19,50 €</span>
                  </div>
                  <span class="btn btn-sm btn-primary w-100">Prendi in carico</span>
                </div>
              </div>
            </div>
            <div class="col-12 col-md-6 col-xl-4">
              <div class="card h-100">
                <div class="card-body">
                  <div class="d-flex justify-content-between align-items-start mb-2">
                    <div>
                      <span class="fw-semibold">Davide</span><span class="text-secondary small ms-2"
                        >Asporto · 19:58</span
                      >
                    </div>
                    <span class="badge text-bg-dark">N° 39</span>
                  </div>
                  <div class="mb-2">
                    <span class="badge rounded-pill text-bg-success">Pronta</span>
                  </div>
                  <ul class="list-unstyled mb-2 small">
                    <li class="d-flex justify-content-between">
                      <span><span class="text-secondary">1×</span> Panino pulled pork</span><span
                        >7,50 €</span
                      >
                    </li>
                  </ul>
                  <div class="d-flex justify-content-between fw-semibold border-top pt-2 mb-2">
                    <span>Totale</span><span>7,50 €</span>
                  </div>
                  <span class="btn btn-sm btn-outline-secondary w-100">Consegnata</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- ============================ MODALITÀ CAMERIERE ============================ -->
  <section class="sec anchor-offset" id="cameriere">
    <div class="container">
      <div class="row mb-5">
        <div class="col-lg-8">
          <div class="eyebrow mb-2">
            <span class="t-it">Opzione per locale</span><span class="t-en">Per-venue option</span>
          </div>
          <h2 class="display-tight h1 mb-3">
            <span class="t-it">Preferisci la comanda al tavolo? Attiva la modalità cameriere</span
            ><span class="t-en">Prefer table service? Switch on waiter mode</span>
          </h2>
          <p class="lede">
            <span class="t-it"
              >Un interruttore per ogni locale. Con la modalità cameriere attiva, il cliente
              inquadra il QR e vede il menu in sola lettura: a prendere e confermare la comanda è il
              cameriere. Il resto del flusso resta identico.</span
            ><span class="t-en"
              >One switch per venue. With waiter mode on, the guest scans the QR and sees a
              read-only menu: a waiter takes and confirms the order. The rest of the flow stays the
              same.</span
            >
          </p>
        </div>
      </div>

      <div class="row align-items-center g-4 justify-content-center">
        <!-- phone: read-only menu -->
        <div class="col-auto text-center">
          <div class="ph mx-auto mb-3">
            <div class="ph-notch"></div>
            <div class="ph-screen">
              <div class="bg-body-tertiary border-bottom px-3 py-2">
                <div class="fw-bold" style="font-size:17px;">
                  DishDash <span class="dd-brand">QR</span>
                </div>
                <div class="small text-secondary">Pub del Centro · Tavolo 5</div>
              </div>
              <div class="flex-grow-1 overflow-hidden px-3 py-3">
                <div class="alert alert-info d-flex align-items-start gap-2 py-2" role="alert">
                  <span aria-hidden="true">🛎️</span>
                  <div class="small">
                    <div class="fw-semibold">
                      <span class="t-it">Per ordinare, chiama un cameriere</span><span class="t-en"
                        >To order, call a waiter</span
                      >
                    </div>
                    <span class="t-it"
                      >Questo è il menu del locale. La comanda viene presa al tavolo.</span
                    ><span class="t-en"
                      >This is the venue menu. Your order is taken at the table.</span
                    >
                  </div>
                </div>
                <h3
                  class="text-uppercase text-secondary fw-semibold mb-2"
                  style="letter-spacing:.04em;font-size:11px;"
                >
                  Panini
                </h3>
                <ul class="list-group mb-3">
                  <li class="list-group-item d-flex justify-content-between align-items-center">
                    <div>
                      <div class="fw-medium">Hamburger classico</div>
                      <small class="text-secondary">Manzo, cheddar, insalata</small>
                    </div>
                    <span class="text-nowrap">8,50 €</span>
                  </li>
                  <li class="list-group-item d-flex justify-content-between align-items-center">
                    <div>
                      <div class="fw-medium">Panino pulled pork</div>
                      <small class="text-secondary">Coleslaw, salsa BBQ</small>
                    </div>
                    <span class="text-nowrap">7,50 €</span>
                  </li>
                </ul>
                <h3
                  class="text-uppercase text-secondary fw-semibold mb-2"
                  style="letter-spacing:.04em;font-size:11px;"
                >
                  Bevande
                </h3>
                <ul class="list-group">
                  <li class="list-group-item d-flex justify-content-between align-items-center">
                    <div><div class="fw-medium">Birra artigianale 0,4l</div></div>
                    <span class="text-nowrap">5,00 €</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div class="ph-label">
            <span class="t-it">Cliente · menu in sola lettura</span><span class="t-en"
              >Guest · read-only menu</span
            >
          </div>
        </div>

        <!-- arrow: waiter takes & confirms -->
        <div class="col-lg-auto col-12 text-center">
          <svg
            class="flow-arrow"
            width="46"
            height="24"
            viewBox="0 0 46 24"
            fill="none"
            aria-hidden="true"
            ><path
              d="M2 12h38m0 0-7-7m7 7-7 7"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            /></svg
          >
          <div class="small text-secondary mt-1">
            <span class="t-it">il cameriere prende e conferma</span><span class="t-en"
              >waiter takes &amp; confirms</span
            >
          </div>
        </div>

        <!-- cameriere device: order composer -->
        <div class="col-auto">
          <div class="device mx-auto" style="width:320px;">
            <nav class="navbar navbar-expand bg-body-tertiary border-bottom">
              <div class="container-fluid px-3">
                <span class="navbar-brand mb-0 fw-bold"
                  >DishDash · <span class="dd-brand">Cameriere</span></span
                >
              </div>
            </nav>
            <div class="device-body p-3">
              <label class="form-label small mb-1" for="pres-table">Tavolo / punto di ritiro</label>
              <select class="form-select form-select-sm mb-2" id="pres-table" disabled
                ><option>Tavolo 5</option></select
              >
              <ul class="list-group mb-2">
                <li
                  class="list-group-item d-flex justify-content-between align-items-center gap-2 py-1"
                >
                  <span class="small fw-medium">Hamburger classico</span>
                  <span class="d-flex align-items-center gap-2"
                    ><span class="small text-nowrap">8,50 €</span>
                    <span class="btn-group btn-group-sm"
                      ><span class="btn btn-outline-secondary disabled">−</span><span
                        class="btn btn-light disabled"
                        style="min-width:30px;">1</span
                      ><span class="btn btn-outline-secondary disabled">+</span></span
                    ></span
                  >
                </li>
                <li
                  class="list-group-item d-flex justify-content-between align-items-center gap-2 py-1"
                >
                  <span class="small fw-medium">Patatine fritte</span>
                  <span class="d-flex align-items-center gap-2"
                    ><span class="small text-nowrap">4,00 €</span>
                    <span class="btn-group btn-group-sm"
                      ><span class="btn btn-outline-secondary disabled">−</span><span
                        class="btn btn-light disabled"
                        style="min-width:30px;">1</span
                      ><span class="btn btn-outline-secondary disabled">+</span></span
                    ></span
                  >
                </li>
              </ul>
              <span class="btn btn-primary w-100 d-flex justify-content-between align-items-center"
                ><span
                  ><span class="t-it">Invia comanda</span><span class="t-en">Send order</span> · 2</span
                ><span class="fw-semibold">12,50 €</span></span
              >
              <div class="text-center text-secondary mt-2" style="font-size:11px;">
                <span class="t-it">Confermata e inviata subito in cucina</span><span class="t-en"
                  >Confirmed and sent straight to the kitchen</span
                >
              </div>
            </div>
          </div>
          <div class="ph-label text-center mt-2">
            <span class="t-it">Cameriere · prende la comanda</span><span class="t-en"
              >Waiter · takes the order</span
            >
          </div>
        </div>
      </div>

      <p class="text-secondary small text-center mt-4 mb-0">
        <span class="t-it"
          >La comanda salta la coda di attesa del gestore ed entra diretta nella coda dei
          lavoratori, con il suo numero. Attivi e disattivi la modalità quando vuoi, per ogni
          locale.</span
        ><span class="t-en"
          >The order skips the manager's pending queue and goes straight to the kitchen queue, with
          its number. Turn the mode on or off anytime, per venue.</span
        >
      </p>
    </div>
  </section>

  <!-- ============================ REPORT ============================ -->
  <section class="sec anchor-offset" id="report">
    <div class="container">
      <div class="row mb-5">
        <div class="col-lg-8">
          <div class="eyebrow mb-2">
            <span class="t-it">Report &amp; analisi</span><span class="t-en"
              >Reports &amp; analytics</span
            >
          </div>
          <h2 class="display-tight h1 mb-3">
            <span class="t-it">Sai sempre come va il locale</span><span class="t-en"
              >Always know how the venue is doing</span
            >
          </h2>
          <p class="lede">
            <span class="t-it"
              >Report giornaliero e mensile: incasso, scontrino medio, articoli più venduti e canale
              tavolo / asporto. Calcolati dalle comande consegnate.</span
            ><span class="t-en"
              >Daily and monthly reports: revenue, average ticket, best sellers and table / takeaway
              split. Computed from delivered orders.</span
            >
          </p>
        </div>
      </div>

      <div class="device">
        <nav class="navbar navbar-expand bg-body-tertiary border-bottom">
          <div class="container-fluid px-3">
            <span class="navbar-brand mb-0 fw-bold"
              >DishDash · <span class="dd-brand">Gestore</span></span
            >
            <ul class="navbar-nav me-auto">
              <li class="nav-item d-none d-sm-block"><span class="nav-link">Coda</span></li>
              <li class="nav-item"><span class="nav-link active">Report</span></li>
            </ul>
            <div class="btn-group btn-group-sm">
              <span class="btn btn-outline-secondary disabled">Giornaliero</span><span
                class="btn btn-primary disabled">Mensile</span
              >
            </div>
          </div>
        </nav>
        <div class="device-body p-3 p-lg-4">
          <p class="text-secondary small mb-3">Mensile · maggio 2026 · 31 giorni</p>
          <div class="row g-3 mb-4">
            <div class="col-6 col-lg-3">
              <div class="card h-100">
                <div class="card-body">
                  <div class="text-secondary small">
                    <span class="t-it">Comande del mese</span><span class="t-en"
                      >Orders this month</span
                    >
                  </div>
                  <div class="h3 mb-0 mt-1">{intIt(totalOrders)}</div>
                </div>
              </div>
            </div>
            <div class="col-6 col-lg-3">
              <div class="card h-100">
                <div class="card-body">
                  <div class="text-secondary small">
                    <span class="t-it">Incasso totale</span><span class="t-en">Total revenue</span>
                  </div>
                  <div class="h3 mb-0 mt-1">{euros(totalRevenue)}</div>
                </div>
              </div>
            </div>
            <div class="col-6 col-lg-3">
              <div class="card h-100">
                <div class="card-body">
                  <div class="text-secondary small">
                    <span class="t-it">Scontrino medio</span><span class="t-en">Average ticket</span
                    >
                  </div>
                  <div class="h3 mb-0 mt-1">{euros(avgTicket)}</div>
                </div>
              </div>
            </div>
            <div class="col-6 col-lg-3">
              <div class="card h-100">
                <div class="card-body">
                  <div class="text-secondary small">
                    <span class="t-it">Giorno migliore</span><span class="t-en">Best day</span>
                  </div>
                  <div class="h3 mb-0 mt-1">{best.d} mag</div>
                  <div class="text-secondary small mt-1">{euros(best.revenue)}</div>
                </div>
              </div>
            </div>
          </div>

          <div class="card mb-4">
            <div
              class="card-header bg-body-tertiary fw-medium d-flex justify-content-between align-items-center"
            >
              <span
                ><span class="t-it">Incasso giornaliero</span><span class="t-en">Daily revenue</span
                ></span
              >
              <span class="text-secondary small fw-normal">€ · maggio 2026</span>
            </div>
            <div class="card-body">
              <div class="dd-bars" role="img" aria-label="Grafico incasso giornaliero del mese">
                {#each rows as r (r.d)}
                  <div
                    class="dd-bar-col"
                    title="{r.d} mag · {euros(r.revenue)} · {r.orders} comande"
                  >
                    <div
                      class="dd-bar"
                      style="height:{barHeight(r.revenue)};background:{r.weekend
                        ? 'var(--bs-primary)'
                        : 'var(--dd-orange-3)'};"
                    ></div>
                    {#if r.d % 5 === 0}<span class="dd-bar-lbl">{r.d}</span>{/if}
                  </div>
                {/each}
              </div>
              <div class="d-flex gap-3 mt-3 small text-secondary">
                <span class="d-inline-flex align-items-center gap-1"
                  ><span class="dd-legend" style="background:var(--bs-primary);"></span> Ven/Sab</span
                >
                <span class="d-inline-flex align-items-center gap-1"
                  ><span class="dd-legend" style="background:var(--dd-orange-3);"></span> Feriali</span
                >
              </div>
            </div>
          </div>

          <div class="row g-3">
            <div class="col-12 col-lg-7">
              <div class="card h-100">
                <div class="card-header bg-body-tertiary fw-medium">
                  <span class="t-it">Più venduti</span><span class="t-en">Best sellers</span>
                </div>
                <table class="table align-middle mb-0">
                  <thead
                    ><tr
                      ><th><span class="t-it">Articolo</span><span class="t-en">Item</span></th><th
                        class="text-end"
                        ><span class="t-it">Quantità</span><span class="t-en">Qty</span></th
                      ><th class="text-end"
                        ><span class="t-it">Incasso</span><span class="t-en">Revenue</span></th
                      ></tr
                    ></thead
                  >
                  <tbody>
                    <tr
                      ><td class="fw-medium">Hamburger classico</td><td class="text-end">412</td><td
                        class="text-end">3.502,00 €</td
                      ></tr
                    >
                    <tr
                      ><td class="fw-medium">Patatine fritte</td><td class="text-end">389</td><td
                        class="text-end">1.556,00 €</td
                      ></tr
                    >
                    <tr
                      ><td class="fw-medium">Panino pulled pork</td><td class="text-end">358</td><td
                        class="text-end">2.685,00 €</td
                      ></tr
                    >
                    <tr
                      ><td class="fw-medium">Birra artigianale 0,4l</td><td class="text-end">301</td
                      ><td class="text-end">1.505,00 €</td></tr
                    >
                    <tr
                      ><td class="fw-medium">Hot dog gigante</td><td class="text-end">274</td><td
                        class="text-end">1.781,00 €</td
                      ></tr
                    >
                  </tbody>
                </table>
              </div>
            </div>
            <div class="col-12 col-lg-5">
              <div class="card h-100">
                <div class="card-header bg-body-tertiary fw-medium">
                  <span class="t-it">Canale</span><span class="t-en">Channel</span>
                </div>
                <ul class="list-group list-group-flush">
                  <li class="list-group-item d-flex justify-content-between">
                    <span><span class="t-it">Al tavolo</span><span class="t-en">Dine-in</span></span
                    ><span class="fw-medium">{intIt(tavolo)}</span>
                  </li>
                  <li class="list-group-item d-flex justify-content-between">
                    <span><span class="t-it">Asporto</span><span class="t-en">Takeaway</span></span
                    ><span class="fw-medium">{intIt(asporto)}</span>
                  </li>
                  <li class="list-group-item">
                    <div class="progress" style="height:10px;">
                      <div
                        class="progress-bar"
                        style="width:{pctT}%;background:var(--bs-primary);"
                      ></div>
                      <div
                        class="progress-bar"
                        style="width:{pctA}%;background:var(--dd-orange-3);"
                      ></div>
                    </div>
                    <div class="d-flex justify-content-between small text-secondary mt-1">
                      <span>{pctT}% tavolo</span><span>{pctA}% asporto</span>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- ============================ PERCHÉ ============================ -->
  <section class="sec sec-tert anchor-offset" id="perche">
    <div class="container">
      <div class="text-center mb-5">
        <div class="eyebrow mb-2">
          <span class="t-it">Perché DishDash QR</span><span class="t-en">Why DishDash QR</span>
        </div>
        <h2 class="display-tight h1 mb-0">
          <span class="t-it">Fatto per il ritmo del banco</span><span class="t-en"
            >Built for the pace of the counter</span
          >
        </h2>
      </div>
      <div class="row g-4">
        <div class="col-md-6 col-lg-4">
          <div class="card h-100">
            <div class="card-body p-4">
              <div class="feat-chip mb-3">QR</div>
              <h3 class="h5">
                <span class="t-it">Zero hardware</span><span class="t-en">Zero hardware</span>
              </h3>
              <p class="text-secondary mb-0">
                <span class="t-it"
                  >Niente palmari né casse dedicate. Stampi i QR e usi un tablet che hai già.</span
                ><span class="t-en"
                  >No handhelds or dedicated tills. Print the QRs and use a tablet you already own.</span
                >
              </p>
            </div>
          </div>
        </div>
        <div class="col-md-6 col-lg-4">
          <div class="card h-100">
            <div class="card-body p-4">
              <div class="feat-chip mb-3">↺</div>
              <h3 class="h5">
                <span class="t-it">Nessuna registrazione</span><span class="t-en">No sign-up</span>
              </h3>
              <p class="text-secondary mb-0">
                <span class="t-it"
                  >Il cliente ordina con un nickname e basta. Meno attriti, più ordini.</span
                ><span class="t-en"
                  >Guests order with just a nickname. Less friction, more orders.</span
                >
              </p>
            </div>
          </div>
        </div>
        <div class="col-md-6 col-lg-4">
          <div class="card h-100">
            <div class="card-body p-4">
              <div class="feat-chip mb-3">€</div>
              <h3 class="h5">
                <span class="t-it">Contanti alla consegna</span><span class="t-en"
                  >Cash on delivery</span
                >
              </h3>
              <p class="text-secondary mb-0">
                <span class="t-it"
                  >Nessun pagamento online da gestire: si paga al ritiro, come hai sempre fatto.</span
                ><span class="t-en"
                  >No online payments to manage: pay on collection, just as always.</span
                >
              </p>
            </div>
          </div>
        </div>
        <div class="col-md-6 col-lg-4">
          <div class="card h-100">
            <div class="card-body p-4">
              <div class="feat-chip mb-3">⚡</div>
              <h3 class="h5">
                <span class="t-it">In tempo reale</span><span class="t-en">Real-time</span>
              </h3>
              <p class="text-secondary mb-0">
                <span class="t-it"
                  >La comanda passa da telefono a cucina all'istante. Il cliente vede sempre lo
                  stato.</span
                ><span class="t-en"
                  >Orders move from phone to kitchen instantly. Guests always see the status.</span
                >
              </p>
            </div>
          </div>
        </div>
        <div class="col-md-6 col-lg-4">
          <div class="card h-100">
            <div class="card-body p-4">
              <div class="feat-chip mb-3">⊞</div>
              <h3 class="h5">
                <span class="t-it">Un'app, più locali</span><span class="t-en"
                  >One app, many venues</span
                >
              </h3>
              <p class="text-secondary mb-0">
                <span class="t-it"
                  >Multitenant: ogni locale ha menu, QR, comande e staff separati e isolati.</span
                ><span class="t-en"
                  >Multitenant: every venue has its own menu, QRs, orders and staff, fully isolated.</span
                >
              </p>
            </div>
          </div>
        </div>
        <div class="col-md-6 col-lg-4">
          <div class="card h-100">
            <div class="card-body p-4">
              <div class="feat-chip mb-3">↑</div>
              <h3 class="h5">
                <span class="t-it">Pronto in giornata</span><span class="t-en">Live in a day</span>
              </h3>
              <p class="text-secondary mb-0">
                <span class="t-it"
                  >Carichi il menu, generi i QR, crei lo staff. Sei operativo senza integrazioni.</span
                ><span class="t-en"
                  >Load the menu, generate the QRs, create your staff. Up and running, no
                  integrations.</span
                >
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- ============================ CTA ============================ -->
  <section class="sec anchor-offset" id="contatti">
    <div class="container">
      <div
        class="card border-0"
        style="background:var(--bs-dark);color:#fff;border-radius:var(--bs-border-radius-xl);"
      >
        <div class="card-body p-4 p-lg-5 text-center">
          <h2 class="display-tight h1 mb-3">
            <span class="t-it">Pronto a far ordinare il tuo locale?</span><span class="t-en"
              >Ready to get your venue ordering?</span
            >
          </h2>
          <p class="lede mx-auto mb-4" style="color:rgba(255,255,255,.75);">
            <span class="t-it"
              >Ti mostriamo DishDash QR sul tuo menu, dal vivo. Bastano dieci minuti.</span
            ><span class="t-en"
              >We'll show you DishDash QR on your own menu, live. It takes ten minutes.</span
            >
          </p>
          <div class="d-flex flex-wrap gap-2 justify-content-center mb-3">
            <a href="mailto:demo@dishdashqr.it" class="btn btn-primary btn-lg"
              ><span class="t-it">Richiedi una demo</span><span class="t-en">Book a demo</span></a
            >
            <a href="mailto:demo@dishdashqr.it" class="btn btn-outline-light btn-lg"
              >demo@dishdashqr.it</a
            >
          </div>
          <div class="small" style="color:rgba(255,255,255,.6);">
            <span class="t-it">Nessun impegno · Configurazione inclusa</span><span class="t-en"
              >No commitment · Setup included</span
            >
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- ============================ FOOTER ============================ -->
  <footer class="border-top py-4">
    <div class="container d-flex flex-wrap align-items-center justify-content-between gap-2">
      <span class="fw-bold">DishDash <span class="dd-brand">QR</span></span>
      <span class="text-secondary small"
        ><span class="t-it">Ordini con QR per pub e street food</span><span class="t-en"
          >QR ordering for pubs &amp; street food</span
        ></span
      >
      <span class="text-secondary small">© 2026 DishDash QR</span>
    </div>
  </footer>
</div>

<style>
  /* Page-local design tokens the original colors_and_type.css supplied. The
     --bs-* tokens and the dd-branded orange primary come from Bootstrap + the
     global app.css; only these few are not already global. */
  .dd-presentation {
    --fw-light: 300;
    --fw-medium: 500;
    --fw-semibold: 600;
    --fw-bold: 700;
    --fs-lead: 1.25rem;
    --dd-orange-0: #fff4e6;
    --dd-orange-2: #ffd8a8;
    --dd-orange-3: #ffc078;
    color: var(--bs-body-color);
  }

  :global(html) {
    scroll-behavior: smooth;
  }

  /* ---- bilingual toggle: IT default, EN shown when the page has .lang-en ---- */
  .t-en {
    display: none;
  }
  .lang-en .t-it {
    display: none;
  }
  .lang-en .t-en {
    display: inline;
  }

  /* ---- layout rhythm ---- */
  .sec {
    padding: 84px 0;
  }
  .sec-tert {
    background: var(--bs-tertiary-bg);
    border-top: 1px solid var(--bs-border-color);
    border-bottom: 1px solid var(--bs-border-color);
  }
  .eyebrow {
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-size: 0.8125rem;
    font-weight: var(--fw-semibold);
    color: var(--dd-brand);
  }
  .lede {
    font-size: var(--fs-lead);
    font-weight: var(--fw-light);
    color: var(--bs-secondary-color);
    max-width: 42ch;
  }
  .display-tight {
    font-weight: var(--fw-bold);
    letter-spacing: -0.015em;
    line-height: 1.08;
    text-wrap: balance;
  }

  /* ---- sticky nav ---- */
  .dd-nav {
    position: sticky;
    top: 0;
    z-index: 1030;
    background: rgba(255, 255, 255, 0.94);
    backdrop-filter: saturate(1.4) blur(2px);
    border-bottom: 1px solid var(--bs-border-color);
  }
  .dd-nav .nav-link {
    color: var(--bs-secondary-color);
    font-size: 0.9375rem;
  }
  .dd-nav .nav-link:hover {
    color: var(--bs-body-color);
  }
  .lang-seg .btn {
    --bs-btn-padding-y: 0.15rem;
    --bs-btn-padding-x: 0.5rem;
    font-size: 0.8125rem;
    font-weight: var(--fw-medium);
  }

  /* ---- phone frame ---- */
  .ph {
    position: relative;
    width: 288px;
    flex: none;
    border: 9px solid #1b1c1f;
    border-radius: 34px;
    background: #1b1c1f;
    box-shadow: var(--bs-box-shadow-lg);
  }
  .ph-notch {
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 118px;
    height: 20px;
    background: #1b1c1f;
    border-radius: 0 0 13px 13px;
    z-index: 5;
  }
  .ph-screen {
    height: 568px;
    background: #fff;
    border-radius: 25px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    font-size: 14px;
  }
  .ph-screen :global(.list-group-item) {
    padding-top: 0.5rem;
    padding-bottom: 0.5rem;
  }
  .ph-label {
    font-size: 0.8125rem;
    color: var(--bs-secondary-color);
    font-weight: var(--fw-medium);
  }

  /* ---- staff device frame ---- */
  .device {
    border: 1px solid var(--bs-border-color);
    border-radius: 14px;
    overflow: hidden;
    background: #fff;
    box-shadow: var(--bs-box-shadow);
  }
  .device :global(.navbar) {
    padding-top: 0.4rem;
    padding-bottom: 0.4rem;
  }
  .device-body {
    background: #fff;
  }

  /* ---- tracking stepper ---- */
  .dd-step-dot {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    flex: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 600;
  }
  .dd-pulse {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--bs-primary);
    display: inline-block;
    animation: dd-pulse 1.2s ease-in-out infinite;
  }
  @keyframes dd-pulse {
    0%,
    100% {
      opacity: 0.25;
      transform: scale(0.8);
    }
    50% {
      opacity: 1;
      transform: scale(1.25);
    }
  }

  /* ---- step number badges (come funziona) ---- */
  .step-num {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    flex: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-weight: var(--fw-bold);
    background: var(--dd-orange-0);
    color: var(--dd-brand);
    border: 1px solid var(--dd-orange-2);
  }

  /* ---- QR glyph ---- */
  .qr-glyph {
    background: repeating-conic-gradient(#212529 0 25%, #fff 0 50%) 0 0 / 16px 16px;
    border: 4px solid #212529;
    border-radius: 6px;
  }

  /* ---- feature icon chip ---- */
  .feat-chip {
    width: 40px;
    height: 40px;
    border-radius: 9px;
    flex: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: var(--dd-orange-0);
    color: var(--dd-brand);
    border: 1px solid var(--dd-orange-2);
    font-weight: var(--fw-bold);
    font-size: 1.0625rem;
  }

  /* ---- monthly bar chart ---- */
  .dd-bars {
    display: flex;
    align-items: flex-end;
    gap: 3px;
    height: 150px;
    padding-bottom: 18px;
  }
  .dd-bar-col {
    position: relative;
    flex: 1 1 0;
    min-width: 0;
    height: 100%;
    display: flex;
    align-items: flex-end;
    justify-content: center;
  }
  .dd-bar {
    width: 100%;
    max-width: 16px;
    border-radius: 3px 3px 0 0;
  }
  .dd-bar-lbl {
    position: absolute;
    bottom: -16px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 10px;
    color: var(--bs-gray-500);
  }
  .dd-legend {
    width: 12px;
    height: 12px;
    border-radius: 3px;
    display: inline-block;
  }

  /* connector arrow in hero */
  .flow-arrow {
    color: var(--bs-gray-400);
  }
  @media (max-width: 991px) {
    .flow-arrow {
      transform: rotate(90deg);
    }
  }

  .anchor-offset {
    scroll-margin-top: 76px;
  }
</style>
