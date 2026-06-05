<script lang="ts">
  import type { PageData, ActionData } from './$types';
  import { enhance } from '$app/forms';
  import { formatEuros } from '$lib/format';
  import QtyStepper from '$lib/components/QtyStepper.svelte';

  let { data, form }: { data: PageData; form: ActionData } = $props();

  // Local cart (runes). The server recomputes prices/availability on submit —
  // this is only for the customer's working view (CLAUDE.md §8).
  let qty = $state<Record<string, number>>({});
  let screen = $state<'menu' | 'confirm'>('menu');
  let nickname = $state('');
  // Stable per-cart key so a double submit can't create two orders (CLAUDE.md §8).
  let idempotencyKey = $state(crypto.randomUUID());
  let submitting = $state(false);

  // Categories in first-seen order (the menu is already sorted by category).
  const categories = $derived([...new Set(data.menu.map((m) => m.category))]);

  const cart = $derived(
    data.menu.filter((m) => (qty[m.id] ?? 0) > 0).map((m) => ({ ...m, qty: qty[m.id] }))
  );
  const count = $derived(cart.reduce((s, i) => s + i.qty, 0));
  const total = $derived(cart.reduce((s, i) => s + i.price * i.qty, 0));
  const canSend = $derived(nickname.trim().length > 0 && count > 0);

  // Serialized for the hidden form field consumed by the `place` action.
  const itemsJson = $derived(
    JSON.stringify(cart.map((i) => ({ menuItemId: i.id, qty: i.qty, notes: '' })))
  );

  function setItem(id: string, value: number) {
    qty[id] = Math.max(0, value);
    if (qty[id] === 0) delete qty[id];
  }
</script>

<svelte:head>
  <title>{data.tenant.name} — Menu</title>
</svelte:head>

<!-- Persistent sub-header: wordmark + venue · source, cart-count pill on menu. -->
<div class="bg-body-tertiary border-bottom">
  <div
    class="container d-flex align-items-center justify-content-between py-2"
    style="max-width: 720px;"
  >
    <div class="d-flex align-items-center gap-2">
      {#if data.tenant.logoUrl}
        <img src={data.tenant.logoUrl} alt={data.tenant.name} height="32" />
      {/if}
      <div>
        <div class="fw-bold" style="font-size: 18px;">
          DishDash <span class="dd-brand">QR</span>
        </div>
        <div class="small text-secondary text-nowrap">
          {data.tenant.name} · {data.qrSource.label}
        </div>
      </div>
    </div>
    {#if screen === 'menu' && count > 0}
      <span class="badge rounded-pill text-bg-secondary">{count} nel carrello</span>
    {/if}
  </div>
</div>

<main class="container py-3 pb-5" style="max-width: 720px;">
  {#if screen === 'menu'}
    {#if data.menu.length === 0}
      <p class="text-secondary py-4">Nessun elemento disponibile al momento.</p>
    {:else}
      {#each categories as cat (cat)}
        <div class="mb-3">
          <h2
            class="text-uppercase text-secondary fw-semibold mb-2"
            style="letter-spacing: .04em; font-size: 12px;"
          >
            {cat}
          </h2>
          <ul class="list-group">
            {#each data.menu.filter((m) => m.category === cat) as item (item.id)}
              <li class="list-group-item d-flex justify-content-between align-items-center gap-2">
                <div>
                  <div class="fw-medium">{item.name}</div>
                  {#if item.description}
                    <small class="text-secondary">{item.description}</small>
                  {/if}
                </div>
                <div class="d-flex align-items-center gap-2">
                  <span class="text-nowrap">{formatEuros(item.price)}</span>
                  <QtyStepper value={qty[item.id] ?? 0} onChange={(v) => setItem(item.id, v)} />
                </div>
              </li>
            {/each}
          </ul>
        </div>
      {/each}

      <!-- Sticky cart bar -->
      <div
        class="position-sticky bottom-0 bg-white border-top py-2"
        style="box-shadow: 0 -.125rem .5rem rgba(0,0,0,.05);"
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
    {/if}
  {:else}
    <button
      class="btn btn-link p-0 mb-3 text-secondary text-decoration-none"
      onclick={() => (screen = 'menu')}>← Torna al menu</button
    >
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

    {#if form?.error}
      <div class="alert alert-danger py-2" role="alert">{form.error}</div>
    {/if}

    <form
      method="POST"
      action="?/place"
      use:enhance={() => {
        submitting = true;
        return async ({ update }) => {
          await update();
          submitting = false;
        };
      }}
    >
      <input type="hidden" name="items" value={itemsJson} />
      <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
      <label class="form-label" for="nickname">Scegli un nickname</label>
      <input
        class="form-control mb-1"
        id="nickname"
        name="nickname"
        placeholder="es. Marco"
        bind:value={nickname}
        maxlength="40"
      />
      <div class="form-text mb-3">
        Nessuna registrazione. Ti serve solo per ritirare la comanda.
      </div>
      <button class="btn btn-primary w-100" type="submit" disabled={!canSend || submitting}>
        {submitting ? 'Invio…' : 'Invia ordine'}
      </button>
      <div class="text-center text-secondary small mt-2">Pagamento in contanti alla consegna</div>
    </form>
  {/if}
</main>
