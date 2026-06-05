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

<svelte:head><title>Lavoratori — Gestore</title></svelte:head>

<div class="d-flex align-items-baseline justify-content-between mb-3">
  <h1 class="h3 mb-0">Lavoratori</h1>
  <button
    class="btn btn-sm btn-primary"
    onclick={() => {
      username = '';
      showCreate = true;
    }}
  >
    + Nuovo lavoratore
  </button>
</div>

{#if error}<div class="alert alert-danger py-2">{error}</div>{/if}
{#if created}<CredentialAlert
    username={created.username}
    password={created.initialPassword}
    title="Lavoratore creato"
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
      {#if data.workers.length === 0}
        <tr><td colspan="3" class="text-secondary">Nessun lavoratore.</td></tr>
      {/if}
      {#each data.workers as w (w.id)}
        <tr>
          <td class="fw-medium">{w.username}</td>
          <td>{w.tenant}</td>
          <td class="text-end">
            <form method="POST" action="?/resetPassword" use:enhance>
              <input type="hidden" name="userId" value={w.id} />
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
  <Modal title="Nuovo lavoratore" onClose={() => (showCreate = false)}>
    <form
      id="create-worker"
      method="POST"
      action="?/create"
      use:enhance={() =>
        async ({ result, update }) => {
          await update();
          if (result.type === 'success') showCreate = false;
        }}
    >
      <label class="form-label" for="w-username">Username</label>
      <input
        class="form-control"
        id="w-username"
        name="username"
        bind:value={username}
        placeholder="es. cucina-3"
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
        form="create-worker"
        disabled={!username.trim()}
      >
        Crea
      </button>
    {/snippet}
  </Modal>
{/if}
