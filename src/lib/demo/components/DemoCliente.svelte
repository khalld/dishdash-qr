<script lang="ts">
  // Cliente (customer) — the phone surface. Public landing → QR scan → menu →
  // cart/confirm → LIVE tracking. Tracking reads the shared store, so the status
  // updates by itself as the manager and worker act on the order.
  import { getDemoStore } from '$lib/demo/store.svelte';
  import { formatEuros } from '$lib/format';
  import { STEP_LABEL, TRACK_STEPS } from '$lib/status';
  import Phone from './Phone.svelte';
  import QrGlyph from './QrGlyph.svelte';
  import StatusBadge from '$lib/components/StatusBadge.svelte';

  const dd = getDemoStore();

  type Screen = 'landing' | 'scan' | 'menu' | 'confirm' | 'track';
  let screen = $state<Screen>('landing');
  let qty = $state<Record<string, number>>({});
  let nickname = $state('');
  let source = $state('Tavolo 5');
  let myToken = $state<string | null>(null);
  let scanPhase = $state<'scanning' | 'found'>('scanning');

  const setItem = (id: string, v: number) => {
    qty = { ...qty, [id]: Math.max(0, v) };
  };

  const cart = $derived(
    dd.menu.filter((m) => (qty[m.id] ?? 0) > 0).map((m) => ({ ...m, qty: qty[m.id] }))
  );
  const total = $derived(cart.reduce((s, i) => s + i.price * i.qty, 0));
  const count = $derived(cart.reduce((s, i) => s + i.qty, 0));
  const cats = $derived([...new Set(dd.menu.map((m) => m.category))]);
  const myOrder = $derived(dd.orders.find((o) => o.trackToken === myToken) ?? null);

  // Scan animation: a short delay, then the "found" state. Re-armed whenever the
  // scan screen is (re)entered; the effect cleanup clears the pending timer.
  $effect(() => {
    if (screen !== 'scan') return;
    scanPhase = 'scanning';
    const t = setTimeout(() => (scanPhase = 'found'), 1700);
    return () => clearTimeout(t);
  });

  function send() {
    const items = cart.map((i) => ({
      id: i.id,
      name: i.name,
      qty: i.qty,
      price: i.price,
      notes: ''
    }));
    myToken = dd.place(nickname.trim(), source, items);
    screen = 'track';
  }

  function newOrder() {
    qty = {};
    nickname = '';
    myToken = null;
    screen = 'landing';
  }

  const trackTotal = $derived(myOrder ? myOrder.items.reduce((s, i) => s + i.price * i.qty, 0) : 0);
  const trackIdx = $derived(
    myOrder ? (TRACK_STEPS as readonly string[]).indexOf(myOrder.status) : -1
  );
  const rejected = $derived(myOrder?.status === 'RIFIUTATA' || myOrder?.status === 'ANNULLATA');
</script>

<Phone label="Cliente · telefono">
  {#if screen !== 'landing' && screen !== 'scan'}
    <div
      class="bg-body-tertiary border-bottom px-3 py-2 d-flex align-items-center justify-content-between flex-none"
    >
      <div>
        <div class="navbar-brand mb-0 fw-bold" style="font-size:18px;">
          DishDash <span class="dd-brand">QR</span>
        </div>
        <div class="small text-secondary text-nowrap">{dd.tenant.name} · {source}</div>
      </div>
      {#if screen === 'menu' && count > 0}
        <span class="badge rounded-pill text-bg-secondary">{count} nel carrello</span>
      {/if}
    </div>
  {/if}

  {#if screen === 'landing'}
    <div class="flex-grow-1 overflow-auto px-3 py-4 d-flex flex-column">
      <div class="text-center mb-4 mt-2">
        <div class="fw-bold" style="font-size:30px;line-height:1.1;">
          DishDash <span class="dd-brand">QR</span>
        </div>
        <p class="lead text-secondary mt-3 mb-0" style="font-size:16px;">
          Ordina dal tuo tavolo scansionando il QR del locale. Nessuna registrazione: scegli un
          nickname e segui la tua comanda.
        </p>
      </div>
      <div class="d-flex flex-column gap-3">
        <div class="card">
          <div class="card-body">
            <h2 class="h6 card-title mb-1">Sei un cliente?</h2>
            <p class="card-text text-secondary small mb-3">
              Inquadra il QR code sul tavolo o al banco per aprire il menu del locale.
            </p>
            <button class="btn btn-primary w-100" onclick={() => (screen = 'scan')}>
              Inquadra il QR
            </button>
          </div>
        </div>
        <div class="card">
          <div class="card-body">
            <h2 class="h6 card-title mb-1">Sei dello staff?</h2>
            <p class="card-text text-secondary small mb-0">
              Gestore e lavoratore accedono dal pannello staff con le proprie credenziali. →
            </p>
          </div>
        </div>
      </div>
      <div class="mt-auto text-center text-secondary small pt-4">
        Pagamento in contanti alla consegna
      </div>
    </div>
  {:else if screen === 'scan'}
    <div class="flex-grow-1 d-flex flex-column" style="background:#0b0b0c;">
      <div class="d-flex align-items-center px-3 py-2">
        <button
          class="btn btn-sm btn-dark text-white border-0"
          onclick={() => (screen = 'landing')}
        >
          ← Annulla
        </button>
      </div>
      <div
        class="flex-grow-1 d-flex flex-column align-items-center justify-content-center text-center px-4"
      >
        <div class="dd-scanframe" class:is-found={scanPhase === 'found'}>
          <QrGlyph size={150} />
          {#if scanPhase === 'scanning'}
            <div class="dd-scanline" aria-hidden="true"></div>
          {/if}
        </div>
        {#if scanPhase === 'scanning'}
          <div class="text-white-50 mt-4">Inquadra il QR code del tavolo…</div>
        {:else}
          <div class="mt-4 text-white">
            <div class="badge text-bg-success mb-2">QR rilevato</div>
            <div class="fw-bold" style="font-size:18px;">{dd.tenant.name}</div>
            <div class="text-white-50 small mb-3">Scegli (o conferma) la postazione del QR:</div>
            <select
              class="form-select form-select-sm mb-3"
              bind:value={source}
              style="max-width:220px;margin:0 auto;"
            >
              {#each dd.sources as s (s)}
                <option>{s}</option>
              {/each}
            </select>
            <button class="btn btn-primary w-100" onclick={() => (screen = 'menu')}>
              Apri il menu
            </button>
          </div>
        {/if}
      </div>
    </div>
  {:else if screen === 'menu'}
    <div class="flex-grow-1 overflow-auto px-3 py-3" style="min-height:0;">
      {#each cats as cat (cat)}
        <div class="mb-3">
          <h2
            class="text-uppercase text-secondary fw-semibold mb-2"
            style="letter-spacing:.04em;font-size:12px;"
          >
            {cat}
          </h2>
          <ul class="list-group">
            {#each dd.menu.filter((m) => m.category === cat) as m (m.id)}
              <li class="list-group-item d-flex justify-content-between align-items-center gap-2">
                <div class={m.available ? '' : 'text-secondary'}>
                  <div class="fw-medium">
                    {m.name}{#if !m.available}<span class="badge text-bg-light border ms-2"
                        >esaurito</span
                      >{/if}
                  </div>
                  {#if m.description}<small class="text-secondary">{m.description}</small>{/if}
                </div>
                <div class="d-flex align-items-center gap-2">
                  <span class="text-nowrap">{formatEuros(m.price)}</span>
                  {#if m.available}
                    <div class="btn-group btn-group-sm" role="group" aria-label="Quantità">
                      <button
                        type="button"
                        class="btn btn-outline-secondary"
                        disabled={(qty[m.id] ?? 0) <= 0}
                        onclick={() => setItem(m.id, (qty[m.id] ?? 0) - 1)}
                        aria-label="Diminuisci">−</button
                      >
                      <span class="btn btn-light disabled" style="min-width:40px;"
                        >{qty[m.id] ?? 0}</span
                      >
                      <button
                        type="button"
                        class="btn btn-outline-secondary"
                        onclick={() => setItem(m.id, (qty[m.id] ?? 0) + 1)}
                        aria-label="Aumenta">+</button
                      >
                    </div>
                  {:else}
                    <span class="btn btn-sm btn-light disabled">—</span>
                  {/if}
                </div>
              </li>
            {/each}
          </ul>
        </div>
      {/each}
    </div>
    <div
      class="border-top bg-white px-3 py-2 flex-none"
      style="box-shadow:0 -.125rem .5rem rgba(0,0,0,.05);"
    >
      <button
        class="btn btn-primary w-100 d-flex justify-content-between align-items-center"
        disabled={count === 0}
        onclick={() => (screen = 'confirm')}
      >
        <span>Vai al carrello{count > 0 ? ` · ${count}` : ''}</span>
        <span class="fw-semibold">{formatEuros(total)}</span>
      </button>
    </div>
  {:else if screen === 'confirm'}
    <div class="flex-grow-1 overflow-auto px-3 py-3 d-flex flex-column">
      <button
        class="btn btn-link p-0 mb-3 text-secondary text-decoration-none align-self-start"
        onclick={() => (screen = 'menu')}
      >
        ← Torna al menu
      </button>
      <h1 class="h4 mb-3">Il tuo ordine</h1>
      {#if cart.length === 0}
        <p class="text-secondary">Il carrello è vuoto.</p>
      {:else}
        <ul class="list-group mb-3">
          {#each cart as i (i.id)}
            <li class="list-group-item d-flex justify-content-between align-items-center">
              <span><span class="text-secondary me-2">{i.qty}×</span>{i.name}</span>
              <span class="text-nowrap">{formatEuros(i.price * i.qty)}</span>
            </li>
          {/each}
          <li class="list-group-item d-flex justify-content-between fw-semibold">
            <span>Totale</span><span>{formatEuros(total)}</span>
          </li>
        </ul>
      {/if}
      <label class="form-label" for="dd-nickname">Scegli un nickname</label>
      <input
        id="dd-nickname"
        type="text"
        class="form-control mb-1"
        placeholder="es. Marco"
        bind:value={nickname}
      />
      <div class="form-text mb-3">
        Nessuna registrazione. Ti serve solo per ritirare la comanda.
      </div>
      <div class="mt-auto">
        <button
          class="btn btn-primary w-100"
          disabled={!nickname.trim() || count === 0}
          onclick={send}
        >
          Invia ordine
        </button>
        <div class="text-center text-secondary small mt-2">Pagamento in contanti alla consegna</div>
      </div>
    </div>
  {:else if screen === 'track'}
    {#if !myOrder}
      <div class="p-4 text-secondary">Comanda non trovata.</div>
    {:else}
      <div class="flex-grow-1 overflow-auto px-3 py-4 d-flex flex-column">
        <div class="text-center mb-4">
          <div class="text-secondary small">
            Comanda di {myOrder.nickname || '—'} · {myOrder.source}
          </div>
          <div class="display-6">{myOrder.number != null ? `N° ${myOrder.number}` : '—'}</div>
          <div class="mt-2"><StatusBadge status={myOrder.status} /></div>
        </div>

        {#if rejected}
          <div
            class="alert {myOrder.status === 'RIFIUTATA'
              ? 'alert-danger'
              : 'alert-secondary'} text-center"
          >
            {myOrder.status === 'RIFIUTATA'
              ? 'La comanda è stata rifiutata dal locale.'
              : 'Hai annullato la comanda.'}
          </div>
        {:else}
          <ol class="list-unstyled mb-4">
            {#each TRACK_STEPS as step, i (step)}
              {@const done = i < trackIdx}
              {@const current = i === trackIdx}
              <li class="d-flex align-items-center gap-3 mb-2">
                <span
                  class="dd-step-dot"
                  style="background:{done || current
                    ? 'var(--bs-primary)'
                    : '#e9ecef'};color:{done || current ? '#fff' : '#adb5bd'};"
                >
                  {done ? '✓' : i + 1}
                </span>
                <span class={current ? 'fw-semibold' : done ? '' : 'text-secondary'}>
                  {STEP_LABEL[step]}
                </span>
                {#if current}<span class="dd-pulse ms-1" aria-hidden="true"></span>{/if}
              </li>
            {/each}
          </ol>
        {/if}

        <ul class="list-group mb-3">
          {#each myOrder.items as i, k (k)}
            <li class="list-group-item d-flex justify-content-between">
              <span><span class="text-secondary me-2">{i.qty}×</span>{i.name}</span>
              <span>{formatEuros(i.price * i.qty)}</span>
            </li>
          {/each}
          <li class="list-group-item d-flex justify-content-between fw-semibold">
            <span>Totale</span><span>{formatEuros(trackTotal)}</span>
          </li>
        </ul>

        <div class="mt-auto d-flex flex-column gap-2">
          {#if myOrder.status === 'IN_ATTESA'}
            <button class="btn btn-outline-danger w-100" onclick={() => dd.cancel(myOrder!.id)}>
              Annulla comanda
            </button>
          {/if}
          {#if myOrder.status === 'PRONTA'}
            <div class="alert alert-success mb-0 text-center py-2">
              La tua comanda è pronta. Ritirala al banco!
            </div>
          {/if}
          {#if myOrder.status === 'CONSEGNATA'}
            <div class="alert alert-success mb-0 text-center py-2">
              Comanda consegnata. Buon appetito!
            </div>
          {/if}
          <button class="btn btn-link text-secondary text-decoration-none" onclick={newOrder}>
            Nuovo ordine
          </button>
        </div>
      </div>
    {/if}
  {/if}
</Phone>
