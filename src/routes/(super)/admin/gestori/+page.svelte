<script lang="ts">
  import { enhance } from '$app/forms';
  import type { PageData, ActionData } from './$types';
  import Modal from '$lib/components/Modal.svelte';
  import CredentialAlert from '$lib/components/CredentialAlert.svelte';

  let { data, form }: { data: PageData; form: ActionData } = $props();

  let showCreate = $state(false);
  let username = $state('');
  let tenantId = $state('');

  const created = $derived(form && 'created' in form ? form.created : null);
  const reset = $derived(form && 'reset' in form ? form.reset : null);
  const error = $derived(form && 'error' in form ? form.error : null);

  function openCreate() {
    username = '';
    tenantId = data.tenants[0]?.id ?? '';
    showCreate = true;
  }
</script>

<svelte:head><title>Gestori — Superuser</title></svelte:head>

<div class="d-flex align-items-baseline justify-content-between mb-3">
  <h1 class="h3 mb-0">Gestori</h1>
  <button class="btn btn-sm btn-primary" onclick={openCreate} disabled={data.tenants.length === 0}>
    + Nuovo gestore
  </button>
</div>

{#if error}<div class="alert alert-danger py-2">{error}</div>{/if}
{#if created}<CredentialAlert
    username={created.username}
    password={created.initialPassword}
    title="Gestore creato"
  />{/if}
{#if reset}<CredentialAlert
    username={reset.username}
    password={reset.initialPassword}
    title="Password reimpostata"
  />{/if}

<div class="table-responsive">
  <table class="table align-middle">
    <thead><tr><th>Username</th><th>Tenant</th><th>Stato</th><th></th></tr></thead>
    <tbody>
      {#if data.gestori.length === 0}
        <tr><td colspan="4" class="text-secondary">Nessun gestore.</td></tr>
      {/if}
      {#each data.gestori as g (g.id)}
        <tr>
          <td class="fw-medium">{g.username}</td>
          <td>{g.tenant}</td>
          <td>
            {#if g.active}
              <span class="badge rounded-pill text-bg-success">attivo</span>
            {:else}
              <span class="badge rounded-pill text-bg-secondary">sospeso</span>
            {/if}
          </td>
          <td class="text-end">
            <form method="POST" action="?/resetPassword" use:enhance>
              <input type="hidden" name="userId" value={g.id} />
              <button class="btn btn-sm btn-outline-secondary" type="submit"
                >Reimposta password</button
              >
            </form>
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>

{#if showCreate}
  <Modal title="Nuovo gestore" onClose={() => (showCreate = false)}>
    <form
      id="create-gestore"
      method="POST"
      action="?/create"
      use:enhance={() =>
        async ({ result, update }) => {
          await update();
          if (result.type === 'success') showCreate = false;
        }}
    >
      <div class="mb-3">
        <label class="form-label" for="g-username">Username</label>
        <input
          class="form-control"
          id="g-username"
          name="username"
          bind:value={username}
          placeholder="es. anna.v"
        />
      </div>
      <label class="form-label" for="g-tenant">Tenant</label>
      <select class="form-select" id="g-tenant" name="tenantId" bind:value={tenantId}>
        {#each data.tenants as t (t.id)}
          <option value={t.id}>{t.name}</option>
        {/each}
      </select>
      <div class="form-text">Un gestore gestisce un solo tenant.</div>
    </form>
    {#snippet footer()}
      <button class="btn btn-outline-secondary" onclick={() => (showCreate = false)}>Annulla</button
      >
      <button
        class="btn btn-primary"
        type="submit"
        form="create-gestore"
        disabled={!username.trim() || !tenantId}
      >
        Crea gestore
      </button>
    {/snippet}
  </Modal>
{/if}
