<script lang="ts">
  import { enhance } from '$app/forms';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
</script>

<svelte:head><title>QR code — Gestore</title></svelte:head>

<div class="d-flex align-items-baseline justify-content-between mb-3">
  <h1 class="h3 mb-0">QR code</h1>
  <form method="POST" action="?/generate" use:enhance>
    <button class="btn btn-sm btn-primary" type="submit">+ Genera QR</button>
  </form>
</div>

{#if data.codes.length === 0}
  <p class="text-secondary">Nessun QR generato. Crea il primo con “+ Genera QR”.</p>
{/if}

<div class="row g-3">
  {#each data.codes as code (code.id)}
    <div class="col-6 col-md-4 col-lg-3">
      <div class="card text-center h-100">
        <div class="card-body">
          <div class="d-flex justify-content-center mb-2">
            <img
              src={code.dataUrl}
              alt="QR {code.label}"
              width="96"
              height="96"
              style="border: 4px solid #212529; border-radius: 6px;"
            />
          </div>
          <div class="fw-medium">{code.label}</div>
          <a
            class="btn btn-sm btn-outline-secondary mt-2"
            href={code.dataUrl}
            download="qr-{code.label.replace(/\s+/g, '-').toLowerCase()}.png">Scarica</a
          >
        </div>
      </div>
    </div>
  {/each}
</div>
