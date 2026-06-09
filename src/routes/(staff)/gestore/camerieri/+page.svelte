<script lang="ts">
  import { enhance } from '$app/forms';
  import type { PageData, ActionData } from './$types';
  import Modal from '$lib/components/Modal.svelte';
  import CredentialAlert from '$lib/components/CredentialAlert.svelte';

  let { data, form }: { data: PageData; form: ActionData } = $props();

  let showCreate = $state(false);
  let username = $state('');

  const created = $derived(form && 'created' in form ? form.created : null);
  const reset = $derived(form && 'reset' in form ? form.reset : null);
  const error = $derived(form && 'error' in form ? form.error : null);
</script>

<svelte:head><title>Camerieri — Gestore</title></svelte:head>

<div class="d-flex align-items-baseline justify-content-between mb-3">
  <h1 class="h3 mb-0">Camerieri</h1>
  <button
    class="btn btn-sm btn-primary"
    onclick={() => {
      username = '';
      showCreate = true;
    }}
  >
    + Nuovo cameriere
  </button>
</div>

<!-- Waiter-ordering mode toggle (CLAUDE.md §3) -->
<div class="card mb-3">
  <div class="card-body d-flex align-items-center justify-content-between gap-3">
    <div>
      <div class="fw-semibold">Modalità cameriere</div>
      <div class="small text-secondary">
        Con la modalità attiva i clienti vedono il menu in sola lettura dal QR e la comanda viene
        presa e confermata da un cameriere.
      </div>
    </div>
    <form method="POST" action="?/toggleMode" use:enhance>
      <div class="form-check form-switch fs-5 mb-0">
        <input
          class="form-check-input"
          type="checkbox"
          role="switch"
          id="waiter-mode"
          aria-label="Attiva la modalità cameriere"
          checked={data.waiterOrdering}
          onchange={(e) => e.currentTarget.form?.requestSubmit()}
        />
      </div>
    </form>
  </div>
</div>

{#if error}<div class="alert alert-danger py-2">{error}</div>{/if}
{#if created}<CredentialAlert
    username={created.username}
    password={created.initialPassword}
    title="Cameriere creato"
  />{/if}
{#if reset}<CredentialAlert
    username={reset.username}
    password={reset.initialPassword}
    title="Password reimpostata"
  />{/if}

<div class="table-responsive">
  <table class="table align-middle">
    <thead><tr><th>Username</th><th>Tenant</th><th></th></tr></thead>
    <tbody>
      {#if data.camerieri.length === 0}
        <tr><td colspan="3" class="text-secondary">Nessun cameriere.</td></tr>
      {/if}
      {#each data.camerieri as c (c.id)}
        <tr>
          <td class="fw-medium">{c.username}</td>
          <td>{c.tenant}</td>
          <td class="text-end">
            <form method="POST" action="?/resetPassword" use:enhance>
              <input type="hidden" name="userId" value={c.id} />
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
  <Modal title="Nuovo cameriere" onClose={() => (showCreate = false)}>
    <form
      id="create-cameriere"
      method="POST"
      action="?/create"
      use:enhance={() =>
        async ({ result, update }) => {
          await update();
          if (result.type === 'success') showCreate = false;
        }}
    >
      <label class="form-label" for="c-username">Username</label>
      <input
        class="form-control"
        id="c-username"
        name="username"
        bind:value={username}
        placeholder="es. sala-1"
      />
      <div class="form-text">
        Assegnato a {data.tenantName}. La password iniziale viene generata e mostrata una sola
        volta.
      </div>
    </form>
    {#snippet footer()}
      <button class="btn btn-outline-secondary" onclick={() => (showCreate = false)}>Annulla</button
      >
      <button
        class="btn btn-primary"
        type="submit"
        form="create-cameriere"
        disabled={!username.trim()}
      >
        Crea
      </button>
    {/snippet}
  </Modal>
{/if}
