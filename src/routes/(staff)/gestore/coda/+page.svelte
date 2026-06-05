<script lang="ts">
  import { onMount } from 'svelte';
  import { invalidateAll } from '$app/navigation';
  import { enhance } from '$app/forms';
  import type { PageData } from './$types';
  import type { OrderView } from '$lib/types';
  import OrderCard from '$lib/components/OrderCard.svelte';

  let { data }: { data: PageData } = $props();

  const attesa = $derived(data.orders.filter((o) => o.status === 'IN_ATTESA'));
  const lavorazione = $derived(
    data.orders.filter((o) => ['CONFERMATA', 'IN_PREPARAZIONE', 'PRONTA'].includes(o.status))
  );
  const chiuse = $derived(
    data.orders.filter((o) => ['CONSEGNATA', 'RIFIUTATA', 'ANNULLATA'].includes(o.status))
  );

  // 1s tick fades the fresh-change highlight; 3s poll keeps the queue live.
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

<svelte:head><title>Coda comande — Gestore</title></svelte:head>

<div class="d-flex align-items-baseline justify-content-between mb-3">
  <h1 class="h3 mb-0">Coda comande</h1>
  <span class="text-secondary small">{attesa.length} in attesa di conferma</span>
</div>

<div class="row g-3">
  {#if attesa.length === 0}
    <p class="text-secondary">Nessuna comanda in attesa.</p>
  {/if}
  {#each attesa as o (o.id)}
    <div class="col-12 col-md-6 col-xl-4">
      {#key o.updatedAt}
        <OrderCard order={o} flash={isFresh(o)}>
          {#snippet actions()}
            <div class="d-flex gap-2">
              <form method="POST" action="?/confirm" class="flex-grow-1" use:enhance>
                <input type="hidden" name="orderId" value={o.id} />
                <button class="btn btn-sm btn-primary w-100" type="submit">Conferma</button>
              </form>
              <form method="POST" action="?/reject" use:enhance>
                <input type="hidden" name="orderId" value={o.id} />
                <button class="btn btn-sm btn-outline-danger" type="submit">Rifiuta</button>
              </form>
            </div>
          {/snippet}
        </OrderCard>
      {/key}
    </div>
  {/each}
</div>

{#if lavorazione.length > 0}
  <h2 class="h6 text-uppercase text-secondary fw-semibold mt-4 mb-3" style="letter-spacing: .04em;">
    In lavorazione
  </h2>
  <div class="row g-3">
    {#each lavorazione as o (o.id)}
      <div class="col-12 col-md-6 col-xl-4">
        {#key o.updatedAt}
          <OrderCard order={o} flash={isFresh(o)} />
        {/key}
      </div>
    {/each}
  </div>
{/if}

{#if chiuse.length > 0}
  <h2 class="h6 text-uppercase text-secondary fw-semibold mt-4 mb-3" style="letter-spacing: .04em;">
    Concluse
  </h2>
  <div class="row g-3">
    {#each chiuse as o (o.id)}
      <div class="col-12 col-md-6 col-xl-4">
        {#key o.updatedAt}
          <OrderCard order={o} flash={isFresh(o)} />
        {/key}
      </div>
    {/each}
  </div>
{/if}
