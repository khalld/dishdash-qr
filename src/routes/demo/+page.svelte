<script lang="ts">
  // /demo — the connected-flow console. The customer phone and a staff device
  // share ONE in-memory store, so an order placed on the phone appears live in
  // the manager's queue, flows to the worker, and updates the customer's
  // tracking screen. This is a CLIENT-ONLY sandbox: it never touches MongoDB or
  // the real authenticated app. Ported from the design handoff's React harness.
  import './demo.css';
  import { provideDemoStore } from '$lib/demo/store.svelte';
  import DemoCliente from '$lib/demo/components/DemoCliente.svelte';
  import DemoGestore from '$lib/demo/components/DemoGestore.svelte';
  import DemoLavoratore from '$lib/demo/components/DemoLavoratore.svelte';
  import DemoSuperuser from '$lib/demo/components/DemoSuperuser.svelte';

  const dd = provideDemoStore();

  const STAFF_ROLES = [
    { key: 'gestore', label: 'Gestore', user: 'gestore@pubdelcentro' },
    { key: 'lavoratore', label: 'Lavoratore', user: 'cucina-1' },
    { key: 'superuser', label: 'Superuser', user: 'superadmin' }
  ] as const;
  type Role = (typeof STAFF_ROLES)[number]['key'];

  let view = $state<'split' | 'cliente' | 'staff'>('split');
  let authed = $state(false);
  let role = $state<Role>('gestore');
  let resetKey = $state(0); // remounts the phone (clears its local cart/screen) on reset

  // staff login (cosmetic — the demo has no real auth). Writable derived: it
  // resets to the selected role's default username, but stays editable until the
  // role changes again.
  let loginUser = $derived(STAFF_ROLES.find((r) => r.key === role)?.user ?? '');

  // auto-pilot: push orders through the kitchen hands-free so the flow is visible
  let autopilot = $state(false);
  let speed = $state(1.6);
  $effect(() => {
    if (!autopilot) return;
    const ms = Math.max(400, Math.round(speed * 1000));
    const id = setInterval(() => dd.autoStep(), ms);
    return () => clearInterval(id);
  });

  const showCliente = $derived(view !== 'staff');
  const showStaff = $derived(view !== 'cliente');
  const waiting = $derived(dd.orders.filter((o) => o.status === 'IN_ATTESA').length);
  const prepping = $derived(
    dd.orders.filter((o) => ['CONFERMATA', 'IN_PREPARAZIONE', 'PRONTA'].includes(o.status)).length
  );
  const cur = $derived(STAFF_ROLES.find((r) => r.key === role) ?? STAFF_ROLES[0]);

  function reset() {
    dd.reset();
    authed = false;
    resetKey += 1;
  }
</script>

<svelte:head>
  <title>DishDash QR — Demo flusso completo</title>
</svelte:head>

<div class="dd-app">
  <header class="dd-topbar">
    <div class="d-flex align-items-center gap-2">
      <span class="fw-bold">DishDash <span class="dd-brand">QR</span></span>
      <span class="text-secondary small d-none d-md-inline">· Demo flusso completo</span>
    </div>
    <div class="btn-group btn-group-sm dd-viewseg" role="group" aria-label="Vista">
      {#each [['split', 'Affiancato'], ['cliente', 'Cliente'], ['staff', 'Staff']] as const as [k, l] (k)}
        <button
          type="button"
          class="btn {view === k ? 'btn-primary' : 'btn-outline-secondary'}"
          onclick={() => (view = k)}>{l}</button
        >
      {/each}
    </div>
    <div class="d-flex align-items-center gap-2 flex-wrap">
      <span class="badge text-bg-warning rounded-pill" title="In attesa di conferma">
        {waiting} in attesa
      </span>
      <span class="badge text-bg-info rounded-pill d-none d-sm-inline" title="In lavorazione">
        {prepping} in coda
      </span>
      <div
        class="form-check form-switch m-0 d-flex align-items-center gap-1"
        title="Fa avanzare da solo le comande in cucina"
      >
        <input
          class="form-check-input m-0"
          type="checkbox"
          role="switch"
          id="dd-autopilot"
          bind:checked={autopilot}
        />
        <label class="form-check-label small text-secondary" for="dd-autopilot">Auto-pilota</label>
      </div>
      {#if autopilot}
        <input
          class="form-range d-none d-lg-inline"
          type="range"
          min="0.6"
          max="4"
          step="0.2"
          style="width:90px;"
          bind:value={speed}
          aria-label="Velocità auto-pilota"
        />
      {/if}
      <button class="btn btn-sm btn-outline-secondary text-nowrap" onclick={reset}
        >Reset demo</button
      >
    </div>
  </header>

  <main class="dd-stage">
    {#if showCliente}
      <section class="dd-pane-cliente">
        {#key resetKey}
          <DemoCliente />
        {/key}
      </section>
    {/if}

    {#if showStaff}
      <section class="dd-pane-staff">
        {#if !authed}
          <div class="dd-login-wrap">
            <div class="card dd-login-card">
              <div
                class="card-header fw-bold {role === 'superuser'
                  ? 'bg-dark text-white'
                  : 'bg-body-tertiary'}"
              >
                DishDash · <span class="dd-brand">{cur.label}</span>
              </div>
              <div class="card-body">
                <p class="text-secondary small mb-3">
                  Accesso staff. Gli account vengono creati dall'alto (superuser → gestori →
                  lavoratori): non esiste registrazione pubblica.
                </p>
                <span class="form-label small text-secondary">Ruolo</span>
                <div class="btn-group btn-group-sm w-100 mb-3" role="group" aria-label="Ruolo">
                  {#each STAFF_ROLES as r (r.key)}
                    <button
                      type="button"
                      class="btn {role === r.key ? 'btn-primary' : 'btn-outline-secondary'}"
                      onclick={() => (role = r.key)}>{r.label}</button
                    >
                  {/each}
                </div>
                <label class="form-label" for="dd-login-user">Username</label>
                <input id="dd-login-user" class="form-control mb-2" bind:value={loginUser} />
                <label class="form-label" for="dd-login-pw">Password</label>
                <input
                  id="dd-login-pw"
                  class="form-control mb-3"
                  type="password"
                  value="demo1234"
                />
                <button class="btn btn-primary w-100" onclick={() => (authed = true)}>Accedi</button
                >
              </div>
            </div>
            <div class="text-secondary small mt-3 text-center" style="max-width:320px;">
              {role === 'superuser'
                ? 'Il superuser gestisce tutti i locali (tenant) della piattaforma.'
                : `${cur.label} di "${dd.tenant.name}".`}
            </div>
          </div>
        {:else}
          <div class="dd-staff-device">
            <div class="dd-rolebar">
              <span class="text-secondary small me-1">Dispositivo staff:</span>
              <div class="btn-group btn-group-sm" role="group" aria-label="Ruolo dispositivo">
                {#each STAFF_ROLES as r (r.key)}
                  <button
                    type="button"
                    class="btn {role === r.key ? 'btn-dark' : 'btn-outline-secondary'}"
                    onclick={() => (role = r.key)}>{r.label}</button
                  >
                {/each}
              </div>
            </div>
            <div class="dd-staff-screen">
              {#if role === 'gestore'}
                <DemoGestore onLogout={() => (authed = false)} />
              {:else if role === 'lavoratore'}
                <DemoLavoratore onLogout={() => (authed = false)} />
              {:else}
                <DemoSuperuser onLogout={() => (authed = false)} />
              {/if}
            </div>
          </div>
        {/if}
      </section>
    {/if}
  </main>
</div>
