<script lang="ts">
  import type { PageData } from './$types';
  import type { OrderView } from '$lib/types';
  import { formatEuros, formatTime } from '$lib/format';

  let { data }: { data: PageData } = $props();

  let period = $state<'Giornaliero' | 'Mensile'>('Giornaliero');

  const it = (n: number) => n.toLocaleString('it-IT');

  // ---- Daily (derived from today's orders) ----
  const delivered = $derived(data.orders.filter((o) => o.status === 'CONSEGNATA'));
  const working = $derived(
    data.orders.filter((o) =>
      ['IN_ATTESA', 'CONFERMATA', 'IN_PREPARAZIONE', 'PRONTA'].includes(o.status)
    )
  );
  const dailyRevenue = $derived(delivered.reduce((s, o) => s + o.total, 0));

  function activityMsg(o: OrderView): string {
    switch (o.status) {
      case 'IN_ATTESA':
        return `Nuova comanda da ${o.nickname} (${o.source})`;
      case 'CONFERMATA':
        return `Comanda N° ${o.number ?? '—'} confermata`;
      case 'IN_PREPARAZIONE':
        return `Comanda N° ${o.number ?? '—'} in preparazione`;
      case 'PRONTA':
        return `Comanda N° ${o.number ?? '—'} pronta`;
      case 'CONSEGNATA':
        return `Comanda N° ${o.number ?? '—'} consegnata`;
      case 'RIFIUTATA':
        return `Comanda di ${o.nickname} rifiutata`;
      case 'ANNULLATA':
        return 'Comanda annullata dal cliente';
      default:
        return `Comanda di ${o.nickname}`;
    }
  }

  const activity = $derived(
    [...data.orders]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 20)
      .map((o) => ({ t: formatTime(o.updatedAt), msg: activityMsg(o) }))
  );

  const m = $derived(data.monthly);
  const pctTavolo = $derived(m.totalOrders ? Math.round((m.tavolo / m.totalOrders) * 100) : 0);
  const pctAsporto = $derived(m.totalOrders ? Math.round((m.asporto / m.totalOrders) * 100) : 0);

  function barHeight(revenue: number): number {
    return m.maxRev > 0 ? Math.max(4, Math.round((revenue / m.maxRev) * 100)) : 4;
  }
</script>

<svelte:head><title>Report — Gestore</title></svelte:head>

<div class="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
  <h1 class="h3 mb-0">Report</h1>
  <div class="btn-group btn-group-sm" role="group">
    {#each ['Giornaliero', 'Mensile'] as const as p (p)}
      <button
        class="btn {period === p ? 'btn-primary' : 'btn-outline-secondary'}"
        onclick={() => (period = p)}>{p}</button
      >
    {/each}
  </div>
</div>

{#if period === 'Giornaliero'}
  <p class="text-secondary small mb-3">Giornaliero · oggi {formatTime(new Date())}</p>
  <div class="row g-3 mb-4">
    {#each [{ k: 'Comande oggi', v: it(data.orders.length) }, { k: 'Consegnate', v: it(delivered.length) }, { k: 'In lavorazione', v: it(working.length) }, { k: 'Incasso (consegnate)', v: formatEuros(dailyRevenue) }] as s (s.k)}
      <div class="col-6 col-lg-3">
        <div class="card h-100">
          <div class="card-body">
            <div class="text-secondary small">{s.k}</div>
            <div class="h3 mb-0 mt-1">{s.v}</div>
          </div>
        </div>
      </div>
    {/each}
  </div>

  <div class="card">
    <div class="card-header bg-body-tertiary fw-medium">Attività recente</div>
    <ul class="list-group list-group-flush">
      {#if activity.length === 0}
        <li class="list-group-item text-secondary">Nessuna attività ancora.</li>
      {/if}
      {#each activity as e, i (i)}
        <li class="list-group-item d-flex gap-3">
          <span class="text-secondary small" style="width: 44px; flex: none;">{e.t}</span>
          <span>{e.msg}</span>
        </li>
      {/each}
    </ul>
  </div>
{:else}
  <p class="text-secondary small mb-3">Mensile · {m.label} · {m.days} giorni</p>
  <div class="row g-3 mb-4">
    {#each [{ k: 'Comande del mese', v: it(m.totalOrders) }, { k: 'Incasso totale', v: formatEuros(m.totalRevenue) }, { k: 'Scontrino medio', v: formatEuros(m.avgTicket) }, { k: 'Giorno migliore', v: m.best.label, sub: formatEuros(m.best.revenue) }] as s (s.k)}
      <div class="col-6 col-lg-3">
        <div class="card h-100">
          <div class="card-body">
            <div class="text-secondary small">{s.k}</div>
            <div class="h3 mb-0 mt-1">{s.v}</div>
            {#if s.sub}<div class="text-secondary small mt-1">{s.sub}</div>{/if}
          </div>
        </div>
      </div>
    {/each}
  </div>

  <div class="card mb-4">
    <div
      class="card-header bg-body-tertiary fw-medium d-flex justify-content-between align-items-center"
    >
      <span>Incasso giornaliero</span>
      <span class="text-secondary small fw-normal">€ per giorno · {m.label}</span>
    </div>
    <div class="card-body">
      <div class="dd-bars" role="img" aria-label="Grafico incasso giornaliero del mese">
        {#each m.rows as r (r.d)}
          <div
            class="dd-bar-col"
            title="{r.d} ({r.wd}) · {formatEuros(r.revenue)} · {r.orders} comande"
          >
            <div
              class="dd-bar"
              style:height="{barHeight(r.revenue)}%"
              style:background={r.weekend ? 'var(--bs-primary)' : 'var(--dd-orange-3)'}
            ></div>
            {#if r.d % 5 === 0}<span class="dd-bar-lbl">{r.d}</span>{/if}
          </div>
        {/each}
      </div>
      <div class="d-flex gap-3 mt-3 small text-secondary">
        <span class="d-inline-flex align-items-center gap-1">
          <span class="dd-legend" style="background: var(--bs-primary);"></span> Ven/Sab
        </span>
        <span class="d-inline-flex align-items-center gap-1">
          <span class="dd-legend" style="background: var(--dd-orange-3);"></span> Feriali
        </span>
      </div>
    </div>
  </div>

  <div class="row g-3">
    <div class="col-12 col-lg-7">
      <div class="card h-100">
        <div class="card-header bg-body-tertiary fw-medium">Più venduti</div>
        <div class="table-responsive">
          <table class="table align-middle mb-0">
            <thead>
              <tr
                ><th>Articolo</th><th class="text-end">Quantità</th><th class="text-end">Incasso</th
                ></tr
              >
            </thead>
            <tbody>
              {#if m.sellers.length === 0}
                <tr><td colspan="3" class="text-secondary">Nessun dato nel periodo.</td></tr>
              {/if}
              {#each m.sellers as s (s.name)}
                <tr>
                  <td class="fw-medium">{s.name}</td>
                  <td class="text-end">{it(s.qty)}</td>
                  <td class="text-end">{formatEuros(s.revenue)}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    <div class="col-12 col-lg-5">
      <div class="card h-100">
        <div class="card-header bg-body-tertiary fw-medium">Canale</div>
        <ul class="list-group list-group-flush">
          <li class="list-group-item d-flex justify-content-between">
            <span>Al tavolo</span><span class="fw-medium">{it(m.tavolo)}</span>
          </li>
          <li class="list-group-item d-flex justify-content-between">
            <span>Asporto</span><span class="fw-medium">{it(m.asporto)}</span>
          </li>
          <li class="list-group-item">
            <div class="progress" style="height: 10px;">
              <div
                class="progress-bar"
                style:width="{pctTavolo}%"
                style="background: var(--bs-primary);"
              ></div>
              <div
                class="progress-bar"
                style:width="{pctAsporto}%"
                style="background: var(--dd-orange-3);"
              ></div>
            </div>
            <div class="d-flex justify-content-between small text-secondary mt-1">
              <span>{pctTavolo}% tavolo</span>
              <span>{pctAsporto}% asporto</span>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </div>
  <p class="text-secondary small mt-3 mb-0">
    Report calcolato dalle comande consegnate del periodo.
  </p>
{/if}
