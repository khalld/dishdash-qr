<script lang="ts">
  import type { LayoutData } from './$types';
  import type { Snippet } from 'svelte';

  let { data, children }: { data: LayoutData; children: Snippet } = $props();
</script>

<nav class="navbar navbar-expand bg-body-tertiary border-bottom">
  <div class="container">
    <span class="navbar-brand">DishDash · <span class="dd-brand">Gestore</span></span>
    <ul class="navbar-nav me-auto">
      <li class="nav-item"><a class="nav-link" href="/gestore/coda">Coda</a></li>
      <li class="nav-item"><a class="nav-link" href="/gestore/menu">Menu</a></li>
      <li class="nav-item"><a class="nav-link" href="/gestore/qrcodes">QR code</a></li>
      <li class="nav-item"><a class="nav-link" href="/gestore/lavoratori">Lavoratori</a></li>
      <li class="nav-item"><a class="nav-link" href="/gestore/report">Report</a></li>
    </ul>
    <span class="navbar-text">{data.user.username}</span>
  </div>
</nav>

<main class="container py-4">
  {@render children()}
</main>
