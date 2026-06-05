<script lang="ts">
  // Public landing page. Clients reach a tenant by scanning a physical QR
  // (→ /menu/[qrToken]); staff sign in to their area from here.
</script>

<svelte:head>
  <title>DishDash QR</title>
</svelte:head>

<main class="container py-5">
  <div class="mx-auto" style="max-width: 640px;">
    <div class="text-center mb-4">
      <h1 class="display-5 fw-bold">DishDash <span class="dd-brand">QR</span></h1>
      <p class="lead text-secondary mb-0">
        Ordina dal tuo tavolo scansionando il QR del locale. Nessuna registrazione: scegli un
        nickname e segui la tua comanda.
      </p>
    </div>

    <div class="d-flex flex-column gap-3">
      <div class="card">
        <div class="card-body">
          <h2 class="h5 card-title mb-1">Sei un cliente?</h2>
          <p class="card-text text-secondary mb-0">
            Inquadra il QR code sul tavolo o al banco per aprire il menu del locale.
          </p>
        </div>
      </div>
      <div class="card">
        <div class="card-body">
          <h2 class="h5 card-title mb-1">Sei dello staff?</h2>
          <p class="card-text text-secondary mb-3">
            Gestore e lavoratore accedono dal pannello staff con le proprie credenziali.
          </p>
          <a class="btn btn-primary" href="/login">Accedi al pannello staff</a>
        </div>
      </div>
    </div>

    <p class="text-center text-secondary small mt-4 mb-0">Pagamento in contanti alla consegna</p>
  </div>
</main>
