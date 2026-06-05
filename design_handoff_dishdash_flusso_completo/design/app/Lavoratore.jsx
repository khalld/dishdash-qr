// Lavoratore (worker) — tablet. Preparation queue fed by the shared store:
// confirmed orders arrive → take in charge → segna pronta → consegnata.
const { useState: useStateL } = React;

function LavoratoreApp({ onLogout }) {
  const { state, actions } = useDD();
  const active = state.orders
    .filter((o) => ['CONFERMATA', 'IN_PREPARAZIONE', 'PRONTA'].includes(o.status))
    .sort((a, b) => (a.number || 999) - (b.number || 999));

  return (
    <div className="bg-body h-100 overflow-auto">
      <StaffNavbar
        role="Lavoratore"
        user="cucina-1"
        tabs={['Comande']}
        active="Comande"
        onLogout={onLogout}
      />
      <div className="container-fluid px-3 px-lg-4 py-4">
        <div className="d-flex align-items-baseline justify-content-between mb-3">
          <h1 className="h3 mb-0">Comande da preparare</h1>
          <span className="text-secondary small">{active.length} attive</span>
        </div>
        <div className="row g-3">
          {active.length === 0 && (
            <p className="text-secondary">
              Nessuna comanda da preparare. In attesa di conferme dal gestore…
            </p>
          )}
          {active.map((o) => (
            <div className="col-12 col-md-6 col-xl-4" key={o.id}>
              <OrderCard
                o={o}
                actions={
                  o.status === 'CONFERMATA' ? (
                    <button
                      className="btn btn-sm btn-primary w-100"
                      onClick={() => actions.take(o.id)}
                    >
                      Prendi in carico
                    </button>
                  ) : o.status === 'IN_PREPARAZIONE' ? (
                    <button
                      className="btn btn-sm btn-success w-100"
                      onClick={() => actions.ready(o.id, o.number)}
                    >
                      Segna pronta
                    </button>
                  ) : (
                    <button
                      className="btn btn-sm btn-outline-secondary w-100"
                      onClick={() => actions.deliver(o.id)}
                    >
                      Consegnata
                    </button>
                  )
                }
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { LavoratoreApp });
