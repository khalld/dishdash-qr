<script lang="ts">
  // Placeholder QR glyph rendered purely in CSS — the prototype has no real QR
  // images. In the real app this is replaced by `qrcode` package output.
  let { size = 96 }: { size?: number } = $props();
  const cell = $derived(Math.round(size / 6));
</script>

<div
  aria-hidden="true"
  style="width:{size}px;height:{size}px;background:repeating-conic-gradient(#212529 0 25%, #fff 0 50%) 0 0/{cell}px {cell}px;border:4px solid #212529;border-radius:6px;"
></div>
