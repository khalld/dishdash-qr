<script lang="ts">
  import { enhance } from '$app/forms';
  import type { PageData, ActionData } from './$types';
  import Modal from '$lib/components/Modal.svelte';

  let { data, form }: { data: PageData; form: ActionData } = $props();

  let showCreate = $state(false);
  let name = $state('');

  const error = $derived(form && 'error' in form ? form.error : null);

  function initials(value: string): string {
    const base = value.trim() || '··';
    return base
      .split(/\s+/)
      .map((w) => w[0] ?? '')
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }
</script>

<svelte:head><title>Tenant — Superuser</title></svelte:head>

<div class="d-flex align-items-baseline justify-content-between mb-3">
  <h1 class="h3 mb-0">Tenant</h1>
  <button
    class="btn btn-sm btn-primary"
    onclick={() => {
      name = '';
      showCreate = true;
    }}
  >
    + Nuovo tenant
  </button>
</div>

{#if error}<div class="alert alert-danger py-2">{error}</div>{/if}

<div class="row g-3">
  {#if data.tenants.length === 0}
    <p class="text-secondary">Nessun tenant. Crea il primo locale.</p>
  {/if}
  {#each data.tenants as t (t.id)}
    <div class="col-12 col-md-6 col-lg-4">
      <div class="card h-100">
        <div class="card-body">
          <div class="d-flex align-items-center gap-2 mb-2">
            {#if t.logoUrl}
              <img
                src={t.logoUrl}
                alt={t.name}
                width="40"
                height="40"
                style="border-radius: 8px;"
              />
            {:else}
              <div class="dd-tenant-logo">{initials(t.name)}</div>
            {/if}
            <div>
              <div class="fw-semibold">{t.name}</div>
              <div class="small text-secondary">gestore: {t.gestore}</div>
            </div>
          </div>
          <div class="d-flex align-items-center justify-content-between">
            <span class="small text-secondary">{t.workers} lavoratori</span>
            {#if t.active}
              <span class="badge rounded-pill text-bg-success">attivo</span>
            {:else}
              <span class="badge rounded-pill text-bg-secondary">sospeso</span>
            {/if}
          </div>
        </div>
      </div>
    </div>
  {/each}
</div>

{#if showCreate}
  <Modal title="Nuovo tenant" onClose={() => (showCreate = false)}>
    <form
      id="create-tenant"
      method="POST"
      action="?/create"
      use:enhance={() =>
        async ({ result, update }) => {
          await update();
          if (result.type === 'success') showCreate = false;
        }}
    >
      <label class="form-label" for="t-name">Nome del locale</label>
      <input
        class="form-control mb-3"
        id="t-name"
        name="name"
        bind:value={name}
        placeholder="es. Taproom Navigli"
      />
      <span class="form-label">Logo</span>
      <div class="d-flex align-items-center gap-2">
        <div class="dd-tenant-logo">{initials(name)}</div>
        <button type="button" class="btn btn-outline-secondary btn-sm" disabled>Carica logo…</button
        >
      </div>
      <div class="form-text">
        Il superuser crea il tenant e ne assegna il logo. Il gestore verrà associato nel passo
        successivo.
      </div>
    </form>
    {#snippet footer()}
      <button class="btn btn-outline-secondary" onclick={() => (showCreate = false)}>Annulla</button
      >
      <button class="btn btn-primary" type="submit" form="create-tenant" disabled={!name.trim()}>
        Crea tenant
      </button>
    {/snippet}
  </Modal>
{/if}
