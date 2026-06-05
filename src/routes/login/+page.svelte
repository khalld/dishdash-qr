<script lang="ts">
  import { enhance } from '$app/forms';
  import type { ActionData } from './$types';

  let { form }: { form: ActionData } = $props();
</script>

<svelte:head>
  <title>Accedi — DishDash</title>
</svelte:head>

<main class="container py-5">
  <div class="mx-auto" style="max-width: 360px;">
    <div class="text-center mb-4">
      <div class="fw-bold" style="font-size: 28px;">
        DishDash · <span class="dd-brand">Staff</span>
      </div>
      <p class="text-secondary small mb-0">Accedi con le credenziali del tuo account.</p>
    </div>

    <div class="card">
      <div class="card-body">
        <form method="POST" use:enhance>
          {#if form?.error}
            <div class="alert alert-danger py-2" role="alert">{form.error}</div>
          {/if}
          <div class="mb-3">
            <label class="form-label" for="username">Username</label>
            <input
              class="form-control"
              id="username"
              name="username"
              autocomplete="username"
              value={form?.username ?? ''}
              required
            />
          </div>
          <div class="mb-3">
            <label class="form-label" for="password">Password</label>
            <input
              class="form-control"
              id="password"
              name="password"
              type="password"
              autocomplete="current-password"
              required
            />
          </div>
          <button class="btn btn-primary w-100" type="submit">Accedi</button>
        </form>
      </div>
    </div>

    <div class="text-center mt-3">
      <a class="text-secondary text-decoration-none small" href="/">← Torna alla home</a>
    </div>
  </div>
</main>
