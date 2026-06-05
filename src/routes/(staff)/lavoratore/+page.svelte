<script lang="ts">
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
</script>

<nav class="navbar bg-body-tertiary border-bottom">
  <div class="container">
    <span class="navbar-brand">DishDash · <span class="dd-brand">Lavoratore</span></span>
    <span class="navbar-text">{data.user.username}</span>
  </div>
</nav>

<main class="container py-4">
  <h1 class="h3 mb-3">Comande da preparare</h1>
  <p class="text-secondary">
    Comande <code>CONFERMATA</code> del tenant: prendi in carico (<code>IN_PREPARAZIONE</code>),
    marca pronta (<code>PRONTA</code>) e consegnata (<code>CONSEGNATA</code>). (Milestone M7.)
  </p>
</main>
