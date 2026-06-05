<script lang="ts">
  import type { LayoutData } from './$types';
  import type { Snippet } from 'svelte';

  let { data, children }: { data: LayoutData; children: Snippet } = $props();
</script>

<nav class="navbar navbar-expand bg-dark border-bottom border-body" data-bs-theme="dark">
  <div class="container">
    <span class="navbar-brand">DishDash · <span class="dd-brand">Superuser</span></span>
    <ul class="navbar-nav me-auto">
      <li class="nav-item"><a class="nav-link" href="/admin/tenants">Tenant</a></li>
      <li class="nav-item"><a class="nav-link" href="/admin/gestori">Gestori</a></li>
      <li class="nav-item"><a class="nav-link" href="/admin/lavoratori">Lavoratori</a></li>
    </ul>
    <span class="navbar-text">{data.user.username}</span>
  </div>
</nav>

<main class="container py-4">
  {@render children()}
</main>
