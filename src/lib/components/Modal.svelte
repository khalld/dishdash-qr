<script lang="ts">
  // Lightweight Bootstrap-styled modal with no Bootstrap JS dependency: a fixed
  // backdrop around a .modal-content. Closes on backdrop click and Escape.
  import type { Snippet } from 'svelte';

  let {
    title,
    onClose,
    children,
    footer
  }: {
    title: string;
    onClose: () => void;
    children: Snippet;
    footer?: Snippet;
  } = $props();

  function onBackdrop(e: MouseEvent) {
    if (e.target === e.currentTarget) onClose();
  }
</script>

<svelte:window onkeydown={(e) => e.key === 'Escape' && onClose()} />

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="dd-modal-backdrop" onmousedown={onBackdrop}>
  <div class="modal-dialog" role="dialog" aria-modal="true">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">{title}</h5>
        <button type="button" class="btn-close" aria-label="Chiudi" onclick={onClose}></button>
      </div>
      <div class="modal-body">{@render children()}</div>
      {#if footer}
        <div class="modal-footer">{@render footer()}</div>
      {/if}
    </div>
  </div>
</div>
