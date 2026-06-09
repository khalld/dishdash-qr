<script lang="ts">
  import type { LayoutData } from './$types';
  import type { Snippet } from 'svelte';
  import StaffNavbar from '$lib/components/StaffNavbar.svelte';

  let { data, children }: { data: LayoutData; children: Snippet } = $props();

  const tabs = [
    { label: 'Coda', href: '/gestore/coda' },
    { label: 'Menu', href: '/gestore/menu' },
    { label: 'QR code', href: '/gestore/qrcodes' },
    { label: 'Lavoratori', href: '/gestore/lavoratori' },
    { label: 'Camerieri', href: '/gestore/camerieri' },
    { label: 'Report', href: '/gestore/report' }
  ];
</script>

<StaffNavbar role="Gestore" {tabs} user={data.user.username} />

<main class="container-fluid px-3 px-lg-4 py-4">
  {@render children()}
</main>
