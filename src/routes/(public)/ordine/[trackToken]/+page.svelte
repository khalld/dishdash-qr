<script lang="ts">
  import { onMount } from 'svelte';
  import { invalidateAll } from '$app/navigation';
  import { enhance } from '$app/forms';
  import type { PageData } from './$types';
  import { formatEuros } from '$lib/format';
  import { TRACK_STEPS, STEP_LABEL } from '$lib/status';
  import StatusBadge from '$lib/components/StatusBadge.svelte';

  let { data }: { data: PageData } = $props();

  const order = $derived(data.order);
  const isRejected = $derived(order.status === 'RIFIUTATA' || order.status === 'ANNULLATA');
  const isTerminal = $derived(
    order.status === 'CONSEGNATA' || order.status === 'RIFIUTATA' || order.status === 'ANNULLATA'
  );
  const stepIndex = $derived(TRACK_STEPS.indexOf(order.status as (typeof TRACK_STEPS)[number]));

  // Live updates: poll the load every 3s until the order reaches a terminal
  // state (MVP realtime per CLAUDE.md §4 — SSE is the future upgrade).
  onMount(() => {
    const id = setInterval(() => {
      if (!isTerminal) invalidateAll();
    }, 3000);
    return () => clearInterval(id);
  });
</script>

<svelte:head>
  <title>Comanda di {order.nickname}</title>
</svelte:head>

<main class="container py-4" style="max-width: 560px;">
  <div class="text-center mb-4">
    <div class="text-secondary small">Comanda di {order.nickname} · {order.source}</div>
    <div class="display-6">{order.number != null ? `N° ${order.number}` : '—'}</div>
    <div class="mt-2"><StatusBadge status={order.status} /></div>
  </div>

  {#if isRejected}
    <div
      class="alert {order.status === 'RIFIUTATA' ? 'alert-danger' : 'alert-secondary'} text-center"
      role="alert"
    >
      {order.status === 'RIFIUTATA'
        ? 'La comanda è stata rifiutata dal locale.'
        : 'Hai annullato la comanda.'}
    </div>
  {:else}
    <ol class="list-unstyled mb-4">
      {#each TRACK_STEPS as step, i (step)}
        {@const done = i < stepIndex}
        {@const current = i === stepIndex}
        <li class="d-flex align-items-center gap-3 mb-2">
          <span
            class="dd-step-dot"
            style:background={done || current ? 'var(--bs-primary)' : '#e9ecef'}
            style:color={done || current ? '#fff' : '#adb5bd'}
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
    {#each order.items as item, i (i)}
      <li class="list-group-item d-flex justify-content-between">
        <span><span class="text-secondary me-2">{item.qty}×</span>{item.name}</span>
        <span>{formatEuros(item.unitPrice * item.qty)}</span>
      </li>
    {/each}
    <li class="list-group-item d-flex justify-content-between fw-semibold">
      <span>Totale</span><span>{formatEuros(order.total)}</span>
    </li>
  </ul>

  <div class="d-flex flex-column gap-2">
    {#if order.status === 'IN_ATTESA'}
      <form method="POST" action="?/cancel" use:enhance>
        <button class="btn btn-outline-danger w-100" type="submit">Annulla comanda</button>
      </form>
    {:else if order.status === 'PRONTA'}
      <div class="alert alert-success mb-0 text-center py-2">
        La tua comanda è pronta. Ritirala al banco!
      </div>
    {:else if order.status === 'CONSEGNATA'}
      <div class="alert alert-success mb-0 text-center py-2">
        Comanda consegnata. Buon appetito!
      </div>
    {/if}
    <a class="btn btn-link text-secondary text-decoration-none" href="/">Nuovo ordine</a>
  </div>
</main>
