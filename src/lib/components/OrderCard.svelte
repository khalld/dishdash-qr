<script lang="ts">
  // Order card shared by the manager queue and the worker queue. Shows nickname,
  // source · time, the order number, status badge, the item lines and total,
  // then an optional action slot. Pulses once (dd-flash) when freshly changed —
  // the parent keys this card on updatedAt so the animation replays on change.
  import type { Snippet } from 'svelte';
  import type { OrderView } from '$lib/types';
  import { formatEuros, formatTime } from '$lib/format';
  import StatusBadge from './StatusBadge.svelte';
  import OrderNumber from './OrderNumber.svelte';

  let {
    order,
    flash = false,
    actions
  }: { order: OrderView; flash?: boolean; actions?: Snippet } = $props();
</script>

<div class="card h-100" class:dd-flash={flash}>
  <div class="card-body">
    <div class="d-flex justify-content-between align-items-start mb-2">
      <div>
        <span class="fw-semibold">{order.nickname}</span>
        <span class="text-secondary small ms-2">{order.source} · {formatTime(order.createdAt)}</span
        >
      </div>
      <OrderNumber n={order.number} />
    </div>
    <div class="mb-2"><StatusBadge status={order.status} /></div>
    <ul class="list-unstyled mb-2 small">
      {#each order.items as item, i (i)}
        <li class="d-flex justify-content-between">
          <span>
            <span class="text-secondary">{item.qty}×</span>
            {item.name}{#if item.notes}<em class="text-secondary"> · {item.notes}</em>{/if}
          </span>
          <span class="text-nowrap">{formatEuros(item.unitPrice * item.qty)}</span>
        </li>
      {/each}
    </ul>
    <div class="d-flex justify-content-between fw-semibold border-top pt-2 mb-2">
      <span>Totale</span><span>{formatEuros(order.total)}</span>
    </div>
    {#if actions}{@render actions()}{/if}
  </div>
</div>
