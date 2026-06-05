<script lang="ts">
  // Quantity stepper: a Bootstrap small button group with a − (U+2212, disabled
  // at min), a disabled count in the middle, and a +. Emits the next value.
  let {
    value,
    min = 0,
    onChange
  }: { value: number; min?: number; onChange: (next: number) => void } = $props();
</script>

<div class="btn-group btn-group-sm" role="group" aria-label="Quantità">
  <button
    type="button"
    class="btn btn-outline-secondary"
    disabled={value <= min}
    onclick={() => onChange(value - 1)}
    aria-label="Diminuisci">−</button
  >
  <span class="btn btn-light disabled" style="min-width: 40px;">{value}</span>
  <button
    type="button"
    class="btn btn-outline-secondary"
    onclick={() => onChange(value + 1)}
    aria-label="Aumenta">+</button
  >
</div>
