<script lang="ts">
  import type { LayoutData } from './$types';
  import type { Snippet } from 'svelte';
  import AdminNavbar from '$lib/components/AdminNavbar.svelte';

  let { data, children }: { data: LayoutData; children: Snippet } = $props();

  const tabs = [
    { label: 'Tenant', href: '/admin/tenants' },
    { label: 'Gestori', href: '/admin/gestori' },
    { label: 'Lavoratori', href: '/admin/lavoratori' },
    { label: 'Camerieri', href: '/admin/camerieri' }
  ];
</script>

<AdminNavbar {tabs} user={data.user.username} />

<main class="container-fluid px-3 px-lg-4 py-4">
  {@render children()}
</main>
