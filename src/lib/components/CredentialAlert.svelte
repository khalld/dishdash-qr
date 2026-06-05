<script lang="ts">
  // One-time reveal of a freshly generated staff password (creation or reset).
  // Shown once after the action — the password is not stored in plaintext and
  // cannot be retrieved again.
  let {
    username,
    password,
    title = 'Account creato'
  }: { username: string; password: string; title?: string } = $props();
</script>

<div class="alert alert-success" role="alert">
  <div class="fw-semibold">{title}</div>
  <div class="small">
    Username <code>{username}</code> · password iniziale <code>{password}</code>
  </div>
  <div class="small text-secondary">Annotala ora: viene mostrata una sola volta.</div>
</div>
