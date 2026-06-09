<script lang="ts">
  import type { LayoutData } from './$types';
  import type { Snippet } from 'svelte';
  import StaffNavbar from '$lib/components/StaffNavbar.svelte';

  let { data, children }: { data: LayoutData; children: Snippet } = $props();

  const tabs = [{ label: 'Nuova comanda', href: '/cameriere' }];
</script>

<StaffNavbar role="Cameriere" {tabs} user={data.user.username} />

<main class="container-fluid px-3 px-lg-4 py-4">
  {@render children()}
</main>
