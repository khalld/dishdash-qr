<script lang="ts">
  import { enhance } from '$app/forms';
  import type { PageData, ActionData } from './$types';
  import { formatEuros } from '$lib/format';
  import QtyStepper from '$lib/components/QtyStepper.svelte';

  let { data, form }: { data: PageData; form: ActionData } = $props();

  // Local working cart (runes). The server recomputes prices/availability and
  // assigns the order number on submit — this is only the waiter's draft view.
  let qty = $state<Record<string, number>>({});
  let nickname = $state('');
  // Empty until the waiter explicitly picks a table/pickup point (avoids
  // mis-assigning an order to a default source).
  let qrSourceId = $state('');
  // Stable per-order key so a double submit can't create two comande (CLAUDE.md §8).
  let idempotencyKey = $state(crypto.randomUUID());
  let submitting = $state(false);

  const placed = $derived(form && 'placed' in form ? form.placed : null);
  const error = $derived(form && 'error' in form ? form.error : null);

  // Categories in first-seen order (the menu is already sorted by category).
  const categories = $derived([...new Set(data.menu.map((m) => m.category))]);

  const cart = $derived(
    data.menu.filter((m) => (qty[m.id] ?? 0) > 0).map((m) => ({ ...m, qty: qty[m.id] }))
  );
  const count = $derived(cart.reduce((s, i) => s + i.qty, 0));
  const total = $derived(cart.reduce((s, i) => s + i.price * i.qty, 0));
  const canSend = $derived(qrSourceId.length > 0 && count > 0 && data.waiterOrdering);

  // Serialized for the hidden form field consumed by the `place` action.
  const itemsJson = $derived(
    JSON.stringify(cart.map((i) => ({ menuItemId: i.id, qty: i.qty, notes: '' })))
  );

  function setItem(id: string, value: number) {
    qty[id] = Math.max(0, value);
    if (qty[id] === 0) delete qty[id];
  }
</script>

<svelte:head><title>Nuova comanda — Cameriere</title></svelte:head>

<div class="d-flex align-items-baseline justify-content-between mb-3">
  <h1 class="h3 mb-0">Nuova comanda</h1>
  <span class="text-secondary small">{data.tenantName}</span>
</div>

{#if !data.waiterOrdering}
  <div class="alert alert-warning" role="alert">
    La <strong>modalità cameriere</strong> non è attiva per questo locale. Chiedi al gestore (o al superuser)
    di attivarla per poter prendere le comande.
  </div>
{:else}
  {#if placed}
    <div class="alert alert-success" role="alert">
      Comanda <strong>N° {placed.number ?? '—'}</strong> confermata e inviata in cucina · {placed.source}
      · {formatEuros(placed.total)}.
    </div>
  {/if}
  {#if error}
    <div class="alert alert-danger py-2" role="alert">{error}</div>
  {/if}

  {#if data.sources.length === 0}
    <div class="alert alert-info" role="alert">
      Nessun tavolo o punto di ritiro attivo. Chiedi al gestore di generare almeno un QR.
    </div>
  {/if}

  <div class="row g-3" style="max-width: 900px;">
    <!-- Order header: table/pickup + optional nickname -->
    <div class="col-12">
      <div class="card">
        <div class="card-body row g-3">
          <div class="col-12 col-sm-6">
            <label class="form-label" for="c-source">Tavolo / punto di ritiro</label>
            <select
              class="form-select"
              id="c-source"
              bind:value={qrSourceId}
              disabled={data.sources.length === 0}
            >
              <option value="" disabled>Seleziona…</option>
              {#each data.sources as s (s.id)}
                <option value={s.id}>{s.label}</option>
              {/each}
            </select>
          </div>
          <div class="col-12 col-sm-6">
            <label class="form-label" for="c-nickname"
              >Nome cliente <span class="text-secondary">(facoltativo)</span></label
            >
            <input
              class="form-control"
              id="c-nickname"
              placeholder="es. Marco"
              bind:value={nickname}
              maxlength="40"
            />
            <div class="form-text">Se vuoto, usa l’etichetta del tavolo/punto di ritiro.</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Menu with steppers -->
    <div class="col-12">
      {#if data.menu.length === 0}
        <p class="text-secondary py-2">Nessun elemento disponibile al momento.</p>
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
      {/if}
    </div>
  </div>

  <!-- Sticky submit bar -->
  <div
    class="position-sticky bottom-0 bg-white border-top py-2 mt-3"
    style="box-shadow: 0 -.125rem .5rem rgba(0,0,0,.05); max-width: 900px;"
  >
    <form
      method="POST"
      action="?/place"
      use:enhance={() => {
        submitting = true;
        return async ({ result, update }) => {
          await update({ reset: false });
          submitting = false;
          // On success, clear the cart for the next order (keep the table selected).
          if (result.type === 'success') {
            qty = {};
            nickname = '';
            idempotencyKey = crypto.randomUUID();
          }
        };
      }}
    >
      <input type="hidden" name="items" value={itemsJson} />
      <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
      <input type="hidden" name="qrSourceId" value={qrSourceId} />
      <input type="hidden" name="nickname" value={nickname} />
      <button
        class="btn btn-primary w-100 d-flex justify-content-between align-items-center"
        type="submit"
        disabled={!canSend || submitting}
      >
        <span>{submitting ? 'Invio…' : `Invia comanda${count > 0 ? ` · ${count}` : ''}`}</span>
        <span class="fw-semibold">{formatEuros(total)}</span>
      </button>
      <div class="text-center text-secondary small mt-2">
        La comanda viene confermata e inviata subito in cucina.
      </div>
    </form>
  </div>
{/if}
