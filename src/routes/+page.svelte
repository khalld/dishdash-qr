<script lang="ts">
  // Public landing page. Clients reach a tenant by scanning a QR (→ /menu/[qrToken]);
  // staff sign in to their area. This is just an entry point / status page.
</script>

<main class="container py-5">
  <div class="text-center mx-auto" style="max-width: 640px;">
    <h1 class="display-5 fw-bold">DishDash <span class="dd-brand">QR</span></h1>
    <p class="lead text-secondary">
      Ordina dal tuo tavolo scansionando il QR del locale. Nessuna registrazione: scegli un nickname
      e segui la tua comanda.
    </p>

    <div class="row g-3 mt-4 text-start">
      <div class="col-12 col-md-6">
        <div class="card h-100">
          <div class="card-body">
            <h2 class="h5 card-title">Sei un cliente?</h2>
            <p class="card-text text-secondary mb-0">
              Inquadra il QR code sul tavolo o al banco per aprire il menu del locale.
            </p>
          </div>
        </div>
      </div>
      <div class="col-12 col-md-6">
        <div class="card h-100">
          <div class="card-body">
            <h2 class="h5 card-title">Sei dello staff?</h2>
            <p class="card-text text-secondary mb-0">
              Gestore e lavoratore accedono con le proprie credenziali. (Login — milestone M1.)
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</main>
