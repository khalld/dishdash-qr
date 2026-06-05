<script lang="ts">
  // Bootstrap 5.3 CSS only — no jQuery, no Bootstrap JS bundle (CLAUDE.md §4).
  // Prefer Svelte runes/components for interactivity.
  import 'bootstrap/dist/css/bootstrap.min.css';
  import '../app.css';
  import type { Snippet } from 'svelte';

  let { children }: { children: Snippet } = $props();
</script>

<svelte:head>
  <title>DishDash QR</title>
</svelte:head>

{@render children()}
