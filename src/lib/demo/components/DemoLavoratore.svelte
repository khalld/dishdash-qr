<script lang="ts">
  // Lavoratore (worker) — preparation queue fed by the shared store: confirmed
  // orders arrive → take in charge → segna pronta → consegnata.
  import { getDemoStore } from '$lib/demo/store.svelte';
  import DemoStaffNavbar from './DemoStaffNavbar.svelte';
  import DemoOrderCard from './DemoOrderCard.svelte';

  let { onLogout }: { onLogout: () => void } = $props();

  const dd = getDemoStore();
  const active = $derived(
    dd.orders
      .filter((o) => ['CONFERMATA', 'IN_PREPARAZIONE', 'PRONTA'].includes(o.status))
      .sort((a, b) => (a.number ?? 999) - (b.number ?? 999))
  );
</script>

<div class="bg-body h-100 overflow-auto">
  <DemoStaffNavbar
    role="Lavoratore"
    user="cucina-1"
    tabs={['Comande']}
    active="Comande"
    onTab={() => {}}
    {onLogout}
  />
  <div class="container-fluid px-3 px-lg-4 py-4">
    <div class="d-flex align-items-baseline justify-content-between mb-3">
      <h1 class="h3 mb-0">Comande da preparare</h1>
      <span class="text-secondary small">{active.length} attive</span>
    </div>
    <div class="row g-3">
      {#if active.length === 0}
        <p class="text-secondary">
          Nessuna comanda da preparare. In attesa di conferme dal gestore…
        </p>
      {/if}
      {#each active as o (o.id + ':' + o.flashAt)}
        <div class="col-12 col-md-6 col-xl-4">
          <DemoOrderCard order={o}>
            {#snippet actions()}
              {#if o.status === 'CONFERMATA'}
                <button class="btn btn-sm btn-primary w-100" onclick={() => dd.take(o.id)}>
                  Prendi in carico
                </button>
              {:else if o.status === 'IN_PREPARAZIONE'}
                <button
                  class="btn btn-sm btn-success w-100"
                  onclick={() => dd.ready(o.id, o.number)}
                >
                  Segna pronta
                </button>
              {:else}
                <button
                  class="btn btn-sm btn-outline-secondary w-100"
                  onclick={() => dd.deliver(o.id)}
                >
                  Consegnata
                </button>
              {/if}
            {/snippet}
          </DemoOrderCard>
        </div>
      {/each}
    </div>
  </div>
</div>
