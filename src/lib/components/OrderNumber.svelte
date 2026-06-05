<script lang="ts">
  // Progressive order number, rendered "N° 42". Assigned only on manager
  // confirm, so an order still IN_ATTESA has no number yet → muted "N° —".
  let { n }: { n: number | null } = $props();
</script>

{#if n == null}
  <span class="text-secondary small">N° —</span>
{:else}
  <span class="badge text-bg-dark">N° {n}</span>
{/if}
