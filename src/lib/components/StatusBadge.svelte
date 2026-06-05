<script lang="ts">
  // Order status as a Bootstrap pill text badge (never an icon). The label is
  // the human-readable Sentence-case string; the contextual color encodes state.
  import type { OrderStatus } from '$lib/types';
  import { STATUS_LABEL, STATUS_CLASS } from '$lib/status';

  let { status }: { status: OrderStatus } = $props();
</script>

<span class="badge rounded-pill {STATUS_CLASS[status]}">{STATUS_LABEL[status]}</span>
