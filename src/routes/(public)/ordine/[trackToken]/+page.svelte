<script lang="ts">
  import type { PageData } from './$types';
  import { formatEuros } from '$lib/format';
  import type { OrderStatus } from '$lib/types';

  let { data }: { data: PageData } = $props();

  const STATUS_LABEL: Record<OrderStatus, string> = {
    CARRELLO: 'Carrello',
    IN_ATTESA: 'In attesa di conferma',
    CONFERMATA: 'Confermata',
    IN_PREPARAZIONE: 'In preparazione',
    PRONTA: 'Pronta',
    IN_CONSEGNA: 'In consegna',
    CONSEGNATA: 'Consegnata',
    RIFIUTATA: 'Rifiutata',
    ANNULLATA: 'Annullata'
  };

  const STATUS_CLASS: Record<OrderStatus, string> = {
    CARRELLO: 'text-bg-secondary',
    IN_ATTESA: 'text-bg-warning',
    CONFERMATA: 'text-bg-info',
    IN_PREPARAZIONE: 'text-bg-info',
    PRONTA: 'text-bg-success',
    IN_CONSEGNA: 'text-bg-info',
    CONSEGNATA: 'text-bg-success',
    RIFIUTATA: 'text-bg-danger',
    ANNULLATA: 'text-bg-danger'
  };
</script>

<svelte:head>
  <title>Comanda — {data.order.nickname}</title>
</svelte:head>

<main class="container py-4" style="max-width: 560px;">
  <div class="d-flex justify-content-between align-items-center mb-3">
    <h1 class="h4 mb-0">Comanda di {data.order.nickname}</h1>
    <span class="badge {STATUS_CLASS[data.order.status]}">{STATUS_LABEL[data.order.status]}</span>
  </div>

  {#if data.order.number !== null}
    <p class="display-6 text-center my-3">N° {data.order.number}</p>
  {/if}

  <ul class="list-group mb-3">
    {#each data.order.items as item (item.menuItemId)}
      <li class="list-group-item d-flex justify-content-between">
        <span>{item.qty}× {item.name}</span>
        <span>{formatEuros(item.unitPrice * item.qty)}</span>
      </li>
    {/each}
  </ul>

  <div class="d-flex justify-content-between">
    <strong>Totale</strong>
    <strong>{formatEuros(data.order.total)}</strong>
  </div>

  <!-- Realtime status (SSE/polling) lands in M6/M7. -->
</main>
