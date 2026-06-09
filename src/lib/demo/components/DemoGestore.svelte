<script lang="ts">
  // Gestore (manager) — tablet/desktop. Live order queue (confirm assigns N° /
  // reject), menu manager (availability), QR generator, lavoratori (create),
  // daily/monthly report. All reads/writes go through the shared demo store.
  import { getDemoStore, type DemoMenuItem } from '$lib/demo/store.svelte';
  import { buildMonth } from '$lib/demo/report';
  import { formatEuros, parseEurosToCents } from '$lib/format';
  import DemoStaffNavbar from './DemoStaffNavbar.svelte';
  import DemoOrderCard from './DemoOrderCard.svelte';
  import QrGlyph from './QrGlyph.svelte';
  import Modal from '$lib/components/Modal.svelte';

  let { onLogout }: { onLogout: () => void } = $props();

  const dd = getDemoStore();
  const tabs = ['Coda', 'Menu', 'QR code', 'Lavoratori', 'Report'];
  let tab = $state('Coda');

  // --- Coda ---
  const attesa = $derived(dd.orders.filter((o) => o.status === 'IN_ATTESA'));
  const lavorazione = $derived(
    dd.orders.filter((o) => ['CONFERMATA', 'IN_PREPARAZIONE', 'PRONTA'].includes(o.status))
  );
  const chiuse = $derived(
    dd.orders.filter((o) => ['CONSEGNATA', 'RIFIUTATA', 'ANNULLATA'].includes(o.status))
  );

  // --- Menu manager modal ---
  let showItem = $state(false);
  let itemForm = $state<{ name: string; category: string; price: string }>({
    name: '',
    category: 'Panini',
    price: ''
  });
  const categories = $derived([...new Set(dd.menu.map((m) => m.category))]);
  function submitItem() {
    const cents = parseEurosToCents(itemForm.price);
    if (!itemForm.name.trim() || !cents) return;
    dd.addItem({
      name: itemForm.name.trim(),
      description: '',
      category: itemForm.category,
      price: cents
    } satisfies Omit<DemoMenuItem, 'id' | 'available'>);
    itemForm = { name: '', category: 'Panini', price: '' };
    showItem = false;
  }

  // --- QR generator (local to this surface — generating QR is demo-only here) ---
  let spots = $state<string[]>([...dd.sources]);
  function addSpot() {
    const n = spots.filter((x) => x.startsWith('Tavolo')).length + 1;
    spots = [...spots, `Tavolo ${n}`];
  }

  // --- Lavoratori modal ---
  let showWorker = $state(false);
  let workerUser = $state('');
  const workerRows = $derived(dd.lavoratori.filter((l) => l.tenant === dd.tenant.name));
  function submitWorker() {
    if (!workerUser.trim()) return;
    dd.addLavoratore(workerUser.trim(), dd.tenant.name);
    workerUser = '';
    showWorker = false;
  }

  // --- Report ---
  let period = $state<'Giornaliero' | 'Mensile'>('Giornaliero');
  const consegnate = $derived(dd.orders.filter((o) => o.status === 'CONSEGNATA'));
  const incasso = $derived(
    consegnate.reduce((s, o) => s + o.items.reduce((a, i) => a + i.price * i.qty, 0), 0)
  );
  const dailyStats = $derived([
    { k: 'Comande oggi', v: String(dd.orders.length) },
    { k: 'Consegnate', v: String(consegnate.length) },
    {
      k: 'In lavorazione',
      v: String(
        dd.orders.filter((o) =>
          ['IN_ATTESA', 'CONFERMATA', 'IN_PREPARAZIONE', 'PRONTA'].includes(o.status)
        ).length
      )
    },
    { k: 'Incasso (consegnate)', v: formatEuros(incasso) }
  ]);

  const month = $derived(buildMonth(dd.menu));
  const monthlyStats = $derived([
    { k: 'Comande del mese', v: month.totalOrders.toLocaleString('it-IT') },
    { k: 'Incasso totale', v: formatEuros(month.totalRevenue) },
    { k: 'Scontrino medio', v: formatEuros(month.avgTicket) },
    { k: 'Giorno migliore', v: `${month.best.d} mag`, sub: formatEuros(month.best.revenue) }
  ]);

  function nowHM(): string {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }
</script>

<div class="bg-body h-100 overflow-auto">
  <DemoStaffNavbar
    role="Gestore"
    user="gestore@pubdelcentro"
    {tabs}
    active={tab}
    onTab={(t) => (tab = t)}
    {onLogout}
  />
  <div class="container-fluid px-3 px-lg-4 py-4">
    {#if tab === 'Coda'}
      <div class="d-flex align-items-baseline justify-content-between mb-3">
        <h1 class="h3 mb-0">Coda comande</h1>
        <span class="text-secondary small">{attesa.length} in attesa di conferma</span>
      </div>
      <div class="row g-3">
        {#if attesa.length === 0}
          <p class="text-secondary">Nessuna comanda in attesa.</p>
        {/if}
        {#each attesa as o (o.id + ':' + o.flashAt)}
          <div class="col-12 col-md-6 col-xl-4">
            <DemoOrderCard order={o}>
              {#snippet actions()}
                <div class="d-flex gap-2">
                  <button
                    class="btn btn-sm btn-primary flex-grow-1"
                    onclick={() => dd.confirm(o.id)}
                  >
                    Conferma
                  </button>
                  <button
                    class="btn btn-sm btn-outline-danger"
                    onclick={() => dd.reject(o.id, o.nickname)}
                  >
                    Rifiuta
                  </button>
                </div>
              {/snippet}
            </DemoOrderCard>
          </div>
        {/each}
      </div>

      {#if lavorazione.length > 0}
        <h2
          class="h6 text-uppercase text-secondary fw-semibold mt-4 mb-3"
          style="letter-spacing:.04em;"
        >
          In lavorazione
        </h2>
        <div class="row g-3">
          {#each lavorazione as o (o.id + ':' + o.flashAt)}
            <div class="col-12 col-md-6 col-xl-4"><DemoOrderCard order={o} /></div>
          {/each}
        </div>
      {/if}

      {#if chiuse.length > 0}
        <h2
          class="h6 text-uppercase text-secondary fw-semibold mt-4 mb-3"
          style="letter-spacing:.04em;"
        >
          Concluse
        </h2>
        <div class="row g-3">
          {#each chiuse as o (o.id + ':' + o.flashAt)}
            <div class="col-12 col-md-6 col-xl-4"><DemoOrderCard order={o} /></div>
          {/each}
        </div>
      {/if}
    {:else if tab === 'Menu'}
      <div class="d-flex align-items-baseline justify-content-between mb-3">
        <h1 class="h3 mb-0">Menu</h1>
        <button class="btn btn-sm btn-primary" onclick={() => (showItem = true)}>
          + Nuovo elemento
        </button>
      </div>
      <div class="table-responsive">
        <table class="table align-middle">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Categoria</th>
              <th class="text-end">Prezzo</th>
              <th class="text-center">Disponibile</th>
            </tr>
          </thead>
          <tbody>
            {#each dd.menu as m (m.id)}
              <tr>
                <td>
                  <div class="fw-medium">{m.name}</div>
                  {#if m.description}<small class="text-secondary">{m.description}</small>{/if}
                </td>
                <td><span class="badge text-bg-light border">{m.category}</span></td>
                <td class="text-end">{formatEuros(m.price)}</td>
                <td class="text-center">
                  <div class="form-check form-switch d-inline-block">
                    <input
                      class="form-check-input"
                      type="checkbox"
                      role="switch"
                      checked={m.available}
                      onchange={() => dd.toggleItem(m.id)}
                      aria-label="Disponibile"
                    />
                  </div>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
      <p class="text-secondary small">
        Disattiva un elemento per segnarlo come <em>esaurito</em>: sparisce subito dal menu del
        cliente.
      </p>
    {:else if tab === 'QR code'}
      <div class="d-flex align-items-baseline justify-content-between mb-3">
        <h1 class="h3 mb-0">QR code</h1>
        <button class="btn btn-sm btn-primary" onclick={addSpot}>+ Genera QR</button>
      </div>
      <div class="row g-3">
        {#each spots as s (s)}
          <div class="col-6 col-md-4 col-lg-3">
            <div class="card text-center h-100">
              <div class="card-body">
                <div class="d-flex justify-content-center mb-2"><QrGlyph size={96} /></div>
                <div class="fw-medium">{s}</div>
                <button class="btn btn-sm btn-outline-secondary mt-2">Scarica</button>
              </div>
            </div>
          </div>
        {/each}
      </div>
    {:else if tab === 'Lavoratori'}
      <div class="d-flex align-items-baseline justify-content-between mb-3">
        <h1 class="h3 mb-0">Lavoratori</h1>
        <button class="btn btn-sm btn-primary" onclick={() => (showWorker = true)}>
          + Nuovo lavoratore
        </button>
      </div>
      <div class="table-responsive">
        <table class="table align-middle">
          <thead>
            <tr><th>Username</th><th>Tenant</th><th></th></tr>
          </thead>
          <tbody>
            {#if workerRows.length === 0}
              <tr><td colspan="3" class="text-secondary">Nessun lavoratore.</td></tr>
            {/if}
            {#each workerRows as r (r.id)}
              <tr>
                <td class="fw-medium">{r.user}</td>
                <td>{r.tenant}</td>
                <td class="text-end">
                  <button class="btn btn-sm btn-outline-secondary">Reimposta password</button>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {:else if tab === 'Report'}
      <div class="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
        <h1 class="h3 mb-0">Report</h1>
        <div class="btn-group btn-group-sm" role="group">
          {#each ['Giornaliero', 'Mensile'] as const as p (p)}
            <button
              class="btn {period === p ? 'btn-primary' : 'btn-outline-secondary'}"
              onclick={() => (period = p)}
            >
              {p}
            </button>
          {/each}
        </div>
      </div>

      {#if period === 'Giornaliero'}
        <p class="text-secondary small mb-3">Giornaliero · oggi {nowHM()}</p>
        <div class="row g-3 mb-4">
          {#each dailyStats as s (s.k)}
            <div class="col-6 col-lg-3">
              <div class="card h-100">
                <div class="card-body">
                  <div class="text-secondary small">{s.k}</div>
                  <div class="h3 mb-0 mt-1">{s.v}</div>
                </div>
              </div>
            </div>
          {/each}
        </div>
        <div class="card">
          <div class="card-header bg-body-tertiary fw-medium">Attività recente</div>
          <ul class="list-group list-group-flush">
            {#if dd.log.length === 0}
              <li class="list-group-item text-secondary">Nessuna attività ancora.</li>
            {/if}
            {#each dd.log as e, k (k)}
              <li class="list-group-item d-flex gap-3">
                <span class="text-secondary small" style="width:44px;flex:none;">{e.t}</span>
                <span>{e.msg}</span>
              </li>
            {/each}
          </ul>
        </div>
      {:else}
        <p class="text-secondary small mb-3">Mensile · {month.label} · {month.days} giorni</p>
        <div class="row g-3 mb-4">
          {#each monthlyStats as s (s.k)}
            <div class="col-6 col-lg-3">
              <div class="card h-100">
                <div class="card-body">
                  <div class="text-secondary small">{s.k}</div>
                  <div class="h3 mb-0 mt-1">{s.v}</div>
                  {#if s.sub}<div class="text-secondary small mt-1">{s.sub}</div>{/if}
                </div>
              </div>
            </div>
          {/each}
        </div>

        <div class="card mb-4">
          <div
            class="card-header bg-body-tertiary fw-medium d-flex justify-content-between align-items-center"
          >
            <span>Incasso giornaliero</span>
            <span class="text-secondary small fw-normal">€ per giorno · {month.label}</span>
          </div>
          <div class="card-body">
            <div class="dd-bars" role="img" aria-label="Grafico incasso giornaliero del mese">
              {#each month.rows as r (r.d)}
                <div
                  class="dd-bar-col"
                  title={`${r.d} mag (${r.wd}) · ${formatEuros(r.revenue)} · ${r.orders} comande`}
                >
                  <div
                    class="dd-bar"
                    style="height:{Math.max(
                      4,
                      Math.round((r.revenue / month.maxRev) * 100)
                    )}%;background:{r.weekend ? 'var(--bs-primary)' : 'var(--dd-orange-3)'};"
                  ></div>
                  {#if r.d % 5 === 0}<span class="dd-bar-lbl">{r.d}</span>{/if}
                </div>
              {/each}
            </div>
            <div class="d-flex gap-3 mt-3 small text-secondary">
              <span class="d-inline-flex align-items-center gap-1">
                <span class="dd-legend" style="background:var(--bs-primary);"></span> Ven/Sab
              </span>
              <span class="d-inline-flex align-items-center gap-1">
                <span class="dd-legend" style="background:var(--dd-orange-3);"></span> Feriali
              </span>
            </div>
          </div>
        </div>

        <div class="row g-3">
          <div class="col-12 col-lg-7">
            <div class="card h-100">
              <div class="card-header bg-body-tertiary fw-medium">Più venduti</div>
              <div class="table-responsive">
                <table class="table align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Articolo</th>
                      <th class="text-end">Quantità</th>
                      <th class="text-end">Incasso</th>
                    </tr>
                  </thead>
                  <tbody>
                    {#each month.sellers as s, k (k)}
                      <tr>
                        <td class="fw-medium">{s.name}</td>
                        <td class="text-end">{s.qty.toLocaleString('it-IT')}</td>
                        <td class="text-end">{formatEuros(s.qty * s.price)}</td>
                      </tr>
                    {/each}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <div class="col-12 col-lg-5">
            <div class="card h-100">
              <div class="card-header bg-body-tertiary fw-medium">Canale</div>
              <ul class="list-group list-group-flush">
                <li class="list-group-item d-flex justify-content-between">
                  <span>Al tavolo</span><span class="fw-medium"
                    >{month.tavolo.toLocaleString('it-IT')}</span
                  >
                </li>
                <li class="list-group-item d-flex justify-content-between">
                  <span>Asporto</span><span class="fw-medium"
                    >{month.asporto.toLocaleString('it-IT')}</span
                  >
                </li>
                <li class="list-group-item">
                  <div class="progress" style="height:10px;">
                    <div
                      class="progress-bar"
                      style="width:{Math.round(
                        (month.tavolo / month.totalOrders) * 100
                      )}%;background:var(--bs-primary);"
                    ></div>
                    <div
                      class="progress-bar"
                      style="width:{Math.round(
                        (month.asporto / month.totalOrders) * 100
                      )}%;background:var(--dd-orange-3);"
                    ></div>
                  </div>
                  <div class="d-flex justify-content-between small text-secondary mt-1">
                    <span>{Math.round((month.tavolo / month.totalOrders) * 100)}% tavolo</span>
                    <span>{Math.round((month.asporto / month.totalOrders) * 100)}% asporto</span>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <p class="text-secondary small mt-3 mb-0">
          Dati del mese precedente (esempio). Il report reale è calcolato dalle comande consegnate
          del periodo.
        </p>
      {/if}
    {/if}
  </div>
</div>

{#if showItem}
  <Modal title="Nuovo elemento" onClose={() => (showItem = false)}>
    <div class="mb-3">
      <label class="form-label" for="dd-item-name">Nome</label>
      <input
        id="dd-item-name"
        class="form-control"
        bind:value={itemForm.name}
        placeholder="es. Nachos"
      />
    </div>
    <div class="row g-3">
      <div class="col-7">
        <label class="form-label" for="dd-item-cat">Categoria</label>
        <select id="dd-item-cat" class="form-select" bind:value={itemForm.category}>
          {#each categories as c (c)}
            <option>{c}</option>
          {/each}
        </select>
      </div>
      <div class="col-5">
        <label class="form-label" for="dd-item-price">Prezzo (€)</label>
        <input
          id="dd-item-price"
          class="form-control"
          bind:value={itemForm.price}
          placeholder="5,00"
          inputmode="decimal"
        />
      </div>
    </div>
    {#snippet footer()}
      <button class="btn btn-outline-secondary" onclick={() => (showItem = false)}>Annulla</button>
      <button
        class="btn btn-primary"
        onclick={submitItem}
        disabled={!itemForm.name.trim() || !itemForm.price}
      >
        Aggiungi
      </button>
    {/snippet}
  </Modal>
{/if}

{#if showWorker}
  <Modal title="Nuovo lavoratore" onClose={() => (showWorker = false)}>
    <label class="form-label" for="dd-worker-user">Username</label>
    <input
      id="dd-worker-user"
      class="form-control"
      bind:value={workerUser}
      placeholder="es. cucina-3"
    />
    <div class="form-text">
      Assegnato a {dd.tenant.name}. La password iniziale viene generata e mostrata una sola volta.
    </div>
    {#snippet footer()}
      <button class="btn btn-outline-secondary" onclick={() => (showWorker = false)}>Annulla</button
      >
      <button class="btn btn-primary" onclick={submitWorker} disabled={!workerUser.trim()}
        >Crea</button
      >
    {/snippet}
  </Modal>
{/if}
