<script lang="ts">
  // Light staff navbar (gestore / lavoratore). Brand wordmark with the role as an
  // orange accent token, nav tabs (active = current route), the username and an
  // Esci button that posts to the logout action.
  import { page } from '$app/state';

  let {
    role,
    tabs,
    user
  }: { role: string; tabs: { label: string; href: string }[]; user: string } = $props();
</script>

<nav class="navbar navbar-expand bg-body-tertiary border-bottom">
  <div class="container-fluid px-3">
    <span class="navbar-brand mb-0 fw-bold">DishDash · <span class="dd-brand">{role}</span></span>
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
      <button class="btn btn-sm btn-outline-secondary" type="submit">Esci</button>
    </form>
  </div>
</nav>
