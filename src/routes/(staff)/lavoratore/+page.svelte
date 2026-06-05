<script lang="ts">
  import { onMount } from 'svelte';
  import { invalidateAll } from '$app/navigation';
  import { enhance } from '$app/forms';
  import type { PageData } from './$types';
  import type { OrderView } from '$lib/types';
  import OrderCard from '$lib/components/OrderCard.svelte';

  let { data }: { data: PageData } = $props();

  // Already sorted by order number server-side.
  const active = $derived(data.orders);

  let now = $state(Date.now());
  const isFresh = (o: OrderView) => now - new Date(o.updatedAt).getTime() < 3200;

  onMount(() => {
    const tick = setInterval(() => (now = Date.now()), 1000);
    const poll = setInterval(() => invalidateAll(), 3000);
    return () => {
      clearInterval(tick);
      clearInterval(poll);
    };
  });
</script>

<svelte:head><title>Comande da preparare — Lavoratore</title></svelte:head>

<div class="d-flex align-items-baseline justify-content-between mb-3">
  <h1 class="h3 mb-0">Comande da preparare</h1>
  <span class="text-secondary small">{active.length} attive</span>
</div>

<div class="row g-3">
  {#if active.length === 0}
    <p class="text-secondary">Nessuna comanda da preparare. In attesa di conferme dal gestore…</p>
  {/if}
  {#each active as o (o.id)}
    <div class="col-12 col-md-6 col-xl-4">
      {#key o.updatedAt}
        <OrderCard order={o} flash={isFresh(o)}>
          {#snippet actions()}
            {#if o.status === 'CONFERMATA'}
              <form method="POST" action="?/take" use:enhance>
                <input type="hidden" name="orderId" value={o.id} />
                <button class="btn btn-sm btn-primary w-100" type="submit">Prendi in carico</button>
              </form>
            {:else if o.status === 'IN_PREPARAZIONE'}
              <form method="POST" action="?/ready" use:enhance>
                <input type="hidden" name="orderId" value={o.id} />
                <button class="btn btn-sm btn-success w-100" type="submit">Segna pronta</button>
              </form>
            {:else}
              <form method="POST" action="?/deliver" use:enhance>
                <input type="hidden" name="orderId" value={o.id} />
                <button class="btn btn-sm btn-outline-secondary w-100" type="submit"
                  >Consegnata</button
                >
              </form>
            {/if}
          {/snippet}
        </OrderCard>
      {/key}
    </div>
  {/each}
</div>
