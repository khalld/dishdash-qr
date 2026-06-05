<script lang="ts">
  // Dark superuser navbar — same structure as StaffNavbar but bg-dark with the
  // dark Bootstrap theme and a light Esci button.
  import { page } from '$app/state';

  let { tabs, user }: { tabs: { label: string; href: string }[]; user: string } = $props();
</script>

<nav class="navbar navbar-expand bg-dark border-bottom border-body" data-bs-theme="dark">
  <div class="container-fluid px-3">
    <span class="navbar-brand mb-0 fw-bold">DishDash · <span class="dd-brand">Superuser</span></span
    >
    <ul class="navbar-nav me-auto">
      {#each tabs as tab (tab.href)}
        <li class="nav-item">
          <a
            class="nav-link"
            class:active={page.url.pathname.startsWith(tab.href)}
            aria-current={page.url.pathname.startsWith(tab.href) ? 'page' : undefined}
            href={tab.href}>{tab.label}</a
          >
        </li>
      {/each}
    </ul>
    <span class="navbar-text small me-3 d-none d-md-inline">{user}</span>
    <form method="POST" action="/logout">
      <button class="btn btn-sm btn-outline-light" type="submit">Esci</button>
    </form>
  </div>
</nav>
