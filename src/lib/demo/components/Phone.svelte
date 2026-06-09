<script lang="ts">
  // Phone frame for the mobile customer surface in the demo console.
  import type { Snippet } from 'svelte';

  let { label, children }: { label?: string; children: Snippet } = $props();
</script>

<div class="dd-phone-wrap">
  {#if label}
    <div class="text-secondary small fw-medium mb-2 text-center">{label}</div>
  {/if}
  <div class="dd-phone">
    <div class="dd-phone-notch" aria-hidden="true"></div>
    <div class="dd-phone-screen">{@render children()}</div>
  </div>
</div>
