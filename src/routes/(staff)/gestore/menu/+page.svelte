<script lang="ts">
  import { enhance } from '$app/forms';
  import type { PageData } from './$types';
  import { formatEuros } from '$lib/format';
  import Modal from '$lib/components/Modal.svelte';

  let { data }: { data: PageData } = $props();

  let showCreate = $state(false);
  let name = $state('');
  let category = $state('');
  let price = $state('');

  const canAdd = $derived(name.trim().length > 0 && price.trim().length > 0);

  function openCreate() {
    name = '';
    price = '';
    category = data.categories[0] ?? '';
    showCreate = true;
  }
</script>

<svelte:head><title>Menu — Gestore</title></svelte:head>

<div class="d-flex align-items-baseline justify-content-between mb-3">
  <h1 class="h3 mb-0">Menu</h1>
  <button class="btn btn-sm btn-primary" onclick={openCreate}>+ Nuovo elemento</button>
</div>

<div class="table-responsive">
  <table class="table align-middle">
    <thead>
      <tr>
        <th>Nome</th>
        <th>Categoria</th>
        <th class="text-end">Prezzo</th>
        <th class="text-center">Disponibile</th>
      </tr>
    </thead>
    <tbody>
      {#each data.menu as item (item.id)}
        <tr>
          <td>
            <div class="fw-medium">{item.name}</div>
            {#if item.description}<small class="text-secondary">{item.description}</small>{/if}
          </td>
          <td><span class="badge text-bg-light border">{item.category}</span></td>
          <td class="text-end">{formatEuros(item.price)}</td>
          <td class="text-center">
            <form method="POST" action="?/toggle" use:enhance>
              <input type="hidden" name="itemId" value={item.id} />
              <div class="form-check form-switch d-inline-block">
                <input
                  class="form-check-input"
                  type="checkbox"
                  role="switch"
                  aria-label="Disponibile"
                  checked={item.available}
                  onchange={(e) => e.currentTarget.form?.requestSubmit()}
                />
              </div>
            </form>
          </td>
        </tr>
      {/each}
      {#if data.menu.length === 0}
        <tr><td colspan="4" class="text-secondary">Nessun elemento nel menu.</td></tr>
      {/if}
    </tbody>
  </table>
</div>
<p class="text-secondary small">
  Disattiva un elemento per segnarlo come <em>esaurito</em>: sparisce subito dal menu del cliente.
</p>

{#if showCreate}
  <Modal title="Nuovo elemento" onClose={() => (showCreate = false)}>
    <form
      id="create-item"
      method="POST"
      action="?/create"
      use:enhance={() =>
        async ({ result, update }) => {
          await update();
          if (result.type === 'success') showCreate = false;
        }}
    >
      <div class="mb-3">
        <label class="form-label" for="item-name">Nome</label>
        <input
          class="form-control"
          id="item-name"
          name="name"
          bind:value={name}
          placeholder="es. Nachos"
        />
      </div>
      <div class="row g-3">
        <div class="col-7">
          <label class="form-label" for="item-cat">Categoria</label>
          {#if data.categories.length > 0}
            <select class="form-select" id="item-cat" name="category" bind:value={category}>
              {#each data.categories as c (c)}
                <option>{c}</option>
              {/each}
            </select>
          {:else}
            <input
              class="form-control"
              id="item-cat"
              name="category"
              bind:value={category}
              placeholder="es. Panini"
            />
          {/if}
        </div>
        <div class="col-5">
          <label class="form-label" for="item-price">Prezzo (€)</label>
          <input
            class="form-control"
            id="item-price"
            name="price"
            bind:value={price}
            placeholder="5,00"
            inputmode="decimal"
          />
        </div>
      </div>
    </form>
    {#snippet footer()}
      <button class="btn btn-outline-secondary" onclick={() => (showCreate = false)}>Annulla</button
      >
      <button class="btn btn-primary" type="submit" form="create-item" disabled={!canAdd}>
        Aggiungi
      </button>
    {/snippet}
  </Modal>
{/if}
