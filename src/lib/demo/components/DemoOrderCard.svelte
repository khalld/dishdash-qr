<script lang="ts">
  // Order card shared by the demo manager + worker queues. Mirrors the real
  // app's OrderCard, but reads the demo order shape (createdAt as "HH:MM",
  // item.price in cents). Pulses once via dd-flash when freshly changed — the
  // parent keys this card on `flashAt` so the one-shot ring replays on change.
  import type { Snippet } from 'svelte';
  import type { DemoOrder } from '$lib/demo/store.svelte';
  import { isFresh, orderTotal } from '$lib/demo/store.svelte';
  import { formatEuros } from '$lib/format';
  import StatusBadge from '$lib/components/StatusBadge.svelte';
  import OrderNumber from '$lib/components/OrderNumber.svelte';

  let { order, actions }: { order: DemoOrder; actions?: Snippet } = $props();
  const total = $derived(orderTotal(order));
</script>

<div class="card h-100" class:dd-flash={isFresh(order)}>
  <div class="card-body">
    <div class="d-flex justify-content-between align-items-start mb-2">
      <div>
        <span class="fw-semibold">{order.nickname}</span>
        <span class="text-secondary small ms-2">{order.source} · {order.createdAt}</span>
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
          <span class="text-nowrap">{formatEuros(item.price * item.qty)}</span>
        </li>
      {/each}
    </ul>
    <div class="d-flex justify-content-between fw-semibold border-top pt-2 mb-2">
      <span>Totale</span><span>{formatEuros(total)}</span>
    </div>
    {#if actions}{@render actions()}{/if}
  </div>
</div>
