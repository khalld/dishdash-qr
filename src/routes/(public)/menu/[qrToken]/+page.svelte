<script lang="ts">
  import type { PageData } from './$types';
  import { formatEuros } from '$lib/format';

  let { data }: { data: PageData } = $props();

  // Client-side cart (runes). Submission + server-side price recompute land in M5.
  let cart = $state<Record<string, number>>({});

  const itemsById = $derived(new Map(data.menu.map((m) => [m.id, m])));
  const total = $derived(
    Object.entries(cart).reduce((sum, [id, qty]) => {
      const item = itemsById.get(id);
      return item ? sum + item.price * qty : sum;
    }, 0)
  );

  function add(id: string) {
    cart[id] = (cart[id] ?? 0) + 1;
  }
  function remove(id: string) {
    const next = (cart[id] ?? 0) - 1;
    if (next <= 0) delete cart[id];
    else cart[id] = next;
  }
</script>

<svelte:head>
  <title>{data.tenant.name} — Menu</title>
</svelte:head>

<main class="container py-4" style="max-width: 720px;">
  <header class="d-flex align-items-center gap-3 mb-4">
    {#if data.tenant.logoUrl}
      <img src={data.tenant.logoUrl} alt={data.tenant.name} height="48" />
    {/if}
    <div>
      <h1 class="h4 mb-0">{data.tenant.name}</h1>
      <small class="text-secondary">{data.qrSource.label}</small>
    </div>
  </header>

  {#if data.menu.length === 0}
    <p class="text-secondary">Nessun elemento disponibile al momento.</p>
  {:else}
    <ul class="list-group mb-4">
      {#each data.menu as item (item.id)}
        <li class="list-group-item d-flex justify-content-between align-items-center">
          <div>
            <div class="fw-medium">{item.name}</div>
            {#if item.description}
              <small class="text-secondary">{item.description}</small>
            {/if}
          </div>
          <div class="d-flex align-items-center gap-2">
            <span class="text-nowrap">{formatEuros(item.price)}</span>
            <div class="btn-group btn-group-sm" role="group" aria-label="Quantità">
              <button class="btn btn-outline-secondary" onclick={() => remove(item.id)}>−</button>
              <span class="btn btn-light disabled">{cart[item.id] ?? 0}</span>
              <button class="btn btn-outline-secondary" onclick={() => add(item.id)}>+</button>
            </div>
          </div>
        </li>
      {/each}
    </ul>

    <div class="d-flex justify-content-between align-items-center">
      <strong>Totale</strong>
      <strong>{formatEuros(total)}</strong>
    </div>
    <button class="btn btn-primary w-100 mt-3" disabled> Invia ordine (milestone M5) </button>
  {/if}
</main>
