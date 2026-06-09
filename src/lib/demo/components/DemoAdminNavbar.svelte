<script lang="ts">
  // Dark superuser navbar for the demo — same structure as DemoStaffNavbar but
  // bg-dark with the dark Bootstrap theme and a light Esci button.
  let {
    tabs,
    active,
    onTab,
    user,
    onLogout
  }: {
    tabs: string[];
    active: string;
    onTab: (t: string) => void;
    user: string;
    onLogout: () => void;
  } = $props();
</script>

<nav class="navbar navbar-expand bg-dark border-bottom border-body" data-bs-theme="dark">
  <div class="container-fluid px-3">
    <span class="navbar-brand mb-0 fw-bold">DishDash · <span class="dd-brand">Superuser</span></span
    >
    <ul class="navbar-nav me-auto">
      {#each tabs as tab (tab)}
        <li class="nav-item">
          <button
            type="button"
            class="nav-link border-0 bg-transparent"
            class:active={tab === active}
            aria-current={tab === active ? 'page' : undefined}
            onclick={() => onTab(tab)}>{tab}</button
          >
        </li>
      {/each}
    </ul>
    <span class="navbar-text small me-3 d-none d-md-inline">{user}</span>
    <button class="btn btn-sm btn-outline-light" type="button" onclick={onLogout}>Esci</button>
  </div>
</nav>
