<script lang="ts">
  // Superuser (admin) — global, dark navbar. Tenants / gestori / lavoratori with
  // working create flows. Top-down provisioning — there is no public sign-up.
  import { getDemoStore } from '$lib/demo/store.svelte';
  import DemoAdminNavbar from './DemoAdminNavbar.svelte';
  import Modal from '$lib/components/Modal.svelte';

  let { onLogout }: { onLogout: () => void } = $props();

  const dd = getDemoStore();
  const tabs = ['Tenant', 'Gestori', 'Lavoratori'];
  let tab = $state('Tenant');

  function initials(name: string): string {
    return (name.trim() || '··')
      .split(' ')
      .map((w) => w[0])
      .join('')
      .slice(0, 2);
  }

  // --- Tenant modal ---
  let showTenant = $state(false);
  let tenantName = $state('');
  function submitTenant() {
    if (!tenantName.trim()) return;
    dd.addTenant(tenantName.trim());
    tenantName = '';
    showTenant = false;
  }

  // --- Gestore modal ---
  let showGestore = $state(false);
  let gestoreForm = $state<{ user: string; tenant: string }>({ user: '', tenant: '' });
  const gestoreRows = $derived(
    dd.tenants.map((t) => ({ user: t.gestore, tenant: t.name, attivo: t.attivo }))
  );
  function openGestore() {
    gestoreForm = { user: '', tenant: dd.tenants[0]?.name ?? '' };
    showGestore = true;
  }
  function submitGestore() {
    if (!gestoreForm.user.trim() || !gestoreForm.tenant) return;
    dd.addGestore(gestoreForm.user.trim(), gestoreForm.tenant);
    gestoreForm = { user: '', tenant: '' };
    showGestore = false;
  }

  // --- Lavoratore modal ---
  let showWorker = $state(false);
  let workerForm = $state<{ user: string; tenant: string }>({ user: '', tenant: '' });
  function openWorker() {
    workerForm = { user: '', tenant: dd.tenants[0]?.name ?? '' };
    showWorker = true;
  }
  function submitWorker() {
    if (!workerForm.user.trim() || !workerForm.tenant) return;
    dd.addLavoratore(workerForm.user.trim(), workerForm.tenant);
    workerForm = { user: '', tenant: '' };
    showWorker = false;
  }
</script>

<div class="bg-body h-100 overflow-auto">
  <DemoAdminNavbar {tabs} active={tab} onTab={(t) => (tab = t)} user="superadmin" {onLogout} />
  <div class="container-fluid px-3 px-lg-4 py-4">
    {#if tab === 'Tenant'}
      <div class="d-flex align-items-baseline justify-content-between mb-3">
        <h1 class="h3 mb-0">Tenant</h1>
        <button class="btn btn-sm btn-primary" onclick={() => (showTenant = true)}>
          + Nuovo tenant
        </button>
      </div>
      <div class="row g-3">
        {#each dd.tenants as t (t.id)}
          <div class="col-12 col-md-6 col-lg-4">
            <div class="card h-100">
              <div class="card-body">
                <div class="d-flex align-items-center gap-2 mb-2">
                  <div class="dd-tenant-logo">{initials(t.name)}</div>
                  <div>
                    <div class="fw-semibold">{t.name}</div>
                    <div class="small text-secondary">gestore: {t.gestore}</div>
                  </div>
                </div>
                <div class="d-flex align-items-center justify-content-between">
                  <span class="small text-secondary">{t.lavoratori} lavoratori</span>
                  {#if t.attivo}
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
    {:else if tab === 'Gestori'}
      <div class="d-flex align-items-baseline justify-content-between mb-3">
        <h1 class="h3 mb-0">Gestori</h1>
        <button class="btn btn-sm btn-primary" onclick={openGestore}>+ Nuovo gestore</button>
      </div>
      <div class="table-responsive">
        <table class="table align-middle">
          <thead>
            <tr><th>Username</th><th>Tenant</th><th>Stato</th><th></th></tr>
          </thead>
          <tbody>
            {#each gestoreRows as r, k (k)}
              <tr>
                <td class="fw-medium">{r.user}</td>
                <td>{r.tenant}</td>
                <td>
                  {#if r.attivo}
                    <span class="badge rounded-pill text-bg-success">attivo</span>
                  {:else}
                    <span class="badge rounded-pill text-bg-secondary">sospeso</span>
                  {/if}
                </td>
                <td class="text-end">
                  <button class="btn btn-sm btn-outline-secondary">Reimposta password</button>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {:else if tab === 'Lavoratori'}
      <div class="d-flex align-items-baseline justify-content-between mb-3">
        <h1 class="h3 mb-0">Lavoratori</h1>
        <button class="btn btn-sm btn-primary" onclick={openWorker}>+ Nuovo lavoratore</button>
      </div>
      <div class="table-responsive">
        <table class="table align-middle">
          <thead>
            <tr><th>Username</th><th>Tenant</th><th></th></tr>
          </thead>
          <tbody>
            {#each dd.lavoratori as r (r.id)}
              <tr>
                <td class="fw-medium">{r.user}</td>
                <td>{r.tenant}</td>
                <td class="text-end">
                  <button class="btn btn-sm btn-outline-secondary">Reimposta password</button>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </div>
</div>

{#if showTenant}
  <Modal title="Nuovo tenant" onClose={() => (showTenant = false)}>
    <label class="form-label" for="dd-tenant-name">Nome del locale</label>
    <input
      id="dd-tenant-name"
      class="form-control mb-3"
      bind:value={tenantName}
      placeholder="es. Taproom Navigli"
    />
    <span class="form-label">Logo</span>
    <div class="d-flex align-items-center gap-2">
      <div class="dd-tenant-logo">{initials(tenantName)}</div>
      <button class="btn btn-outline-secondary btn-sm" disabled>Carica logo…</button>
    </div>
    <div class="form-text">
      Il superuser crea il tenant e ne assegna il logo. Il gestore verrà associato nel passo
      successivo.
    </div>
    {#snippet footer()}
      <button class="btn btn-outline-secondary" onclick={() => (showTenant = false)}>Annulla</button
      >
      <button class="btn btn-primary" onclick={submitTenant} disabled={!tenantName.trim()}>
        Crea tenant
      </button>
    {/snippet}
  </Modal>
{/if}

{#if showGestore}
  <Modal title="Nuovo gestore" onClose={() => (showGestore = false)}>
    <div class="mb-3">
      <label class="form-label" for="dd-gestore-user">Username</label>
      <input
        id="dd-gestore-user"
        class="form-control"
        bind:value={gestoreForm.user}
        placeholder="es. anna.v"
      />
    </div>
    <label class="form-label" for="dd-gestore-tenant">Tenant</label>
    <select id="dd-gestore-tenant" class="form-select" bind:value={gestoreForm.tenant}>
      {#each dd.tenants as t (t.id)}
        <option>{t.name}</option>
      {/each}
    </select>
    <div class="form-text">Un gestore gestisce un solo tenant.</div>
    {#snippet footer()}
      <button class="btn btn-outline-secondary" onclick={() => (showGestore = false)}
        >Annulla</button
      >
      <button
        class="btn btn-primary"
        onclick={submitGestore}
        disabled={!gestoreForm.user.trim() || !gestoreForm.tenant}
      >
        Crea gestore
      </button>
    {/snippet}
  </Modal>
{/if}

{#if showWorker}
  <Modal title="Nuovo lavoratore" onClose={() => (showWorker = false)}>
    <div class="mb-3">
      <label class="form-label" for="dd-su-worker-user">Username</label>
      <input
        id="dd-su-worker-user"
        class="form-control"
        bind:value={workerForm.user}
        placeholder="es. cucina-3"
      />
    </div>
    <label class="form-label" for="dd-su-worker-tenant">Tenant</label>
    <select id="dd-su-worker-tenant" class="form-select" bind:value={workerForm.tenant}>
      {#each dd.tenants as t (t.id)}
        <option>{t.name}</option>
      {/each}
    </select>
    {#snippet footer()}
      <button class="btn btn-outline-secondary" onclick={() => (showWorker = false)}>Annulla</button
      >
      <button
        class="btn btn-primary"
        onclick={submitWorker}
        disabled={!workerForm.user.trim() || !workerForm.tenant}
      >
        Crea lavoratore
      </button>
    {/snippet}
  </Modal>
{/if}
