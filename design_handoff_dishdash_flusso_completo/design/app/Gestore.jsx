// Gestore (manager) — tablet/desktop. Live order queue (confirm assigns N° / reject),
// menu manager (availability), QR generator, lavoratori (create), report.
const { useState: useStateG } = React;

// Shared order card used by gestore + lavoratore. Pulses when freshly changed.
function OrderCard({ o, actions }) {
  const DD = window.DD;
  const total = DD.orderTotal(o);
  return (
    <div className={`card h-100 ${isFresh(o) ? 'dd-flash' : ''}`}>
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-start mb-2">
          <div>
            <span className="fw-semibold">{o.nickname}</span>
            <span className="text-secondary small ms-2">
              {o.source} · {o.createdAt}
            </span>
          </div>
          <OrderNumber n={o.number} />
        </div>
        <div className="mb-2">
          <StatusBadge status={o.status} />
        </div>
        <ul className="list-unstyled mb-2 small">
          {o.items.map((i, k) => (
            <li key={k} className="d-flex justify-content-between">
              <span>
                <span className="text-secondary">{i.qty}×</span> {i.name}
                {i.notes && <em className="text-secondary"> · {i.notes}</em>}
              </span>
              <span className="text-nowrap">{DD.euros(i.price * i.qty)}</span>
            </li>
          ))}
        </ul>
        <div className="d-flex justify-content-between fw-semibold border-top pt-2 mb-2">
          <span>Totale</span>
          <span>{DD.euros(total)}</span>
        </div>
        {actions}
      </div>
    </div>
  );
}

function GestoreApp({ onLogout }) {
  const { state, actions } = useDD();
  const [tab, setTab] = useStateG('Coda');
  return (
    <div className="bg-body h-100 overflow-auto">
      <StaffNavbar
        role="Gestore"
        user="gestore@pubdelcentro"
        onLogout={onLogout}
        tabs={['Coda', 'Menu', 'QR code', 'Lavoratori', 'Report']}
        active={tab}
        onTab={setTab}
      />
      <div className="container-fluid px-3 px-lg-4 py-4">
        {tab === 'Coda' && <GestoreCoda state={state} actions={actions} />}
        {tab === 'Menu' && <GestoreMenu state={state} actions={actions} />}
        {tab === 'QR code' && <GestoreQR state={state} />}
        {tab === 'Lavoratori' && <GestoreLavoratori state={state} actions={actions} />}
        {tab === 'Report' && <GestoreReport state={state} />}
      </div>
    </div>
  );
}

function GestoreCoda({ state, actions }) {
  const attesa = state.orders.filter((o) => o.status === 'IN_ATTESA');
  const lavorazione = state.orders.filter((o) =>
    ['CONFERMATA', 'IN_PREPARAZIONE', 'PRONTA'].includes(o.status)
  );
  const chiuse = state.orders.filter((o) =>
    ['CONSEGNATA', 'RIFIUTATA', 'ANNULLATA'].includes(o.status)
  );
  return (
    <React.Fragment>
      <div className="d-flex align-items-baseline justify-content-between mb-3">
        <h1 className="h3 mb-0">Coda comande</h1>
        <span className="text-secondary small">{attesa.length} in attesa di conferma</span>
      </div>
      <div className="row g-3">
        {attesa.length === 0 && <p className="text-secondary">Nessuna comanda in attesa.</p>}
        {attesa.map((o) => (
          <div className="col-12 col-md-6 col-xl-4" key={o.id}>
            <OrderCard
              o={o}
              actions={
                <div className="d-flex gap-2">
                  <button
                    className="btn btn-sm btn-primary flex-grow-1"
                    onClick={() => actions.confirm(o.id)}
                  >
                    Conferma
                  </button>
                  <button
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => actions.reject(o.id, o.nickname)}
                  >
                    Rifiuta
                  </button>
                </div>
              }
            />
          </div>
        ))}
      </div>

      {lavorazione.length > 0 && (
        <React.Fragment>
          <h2
            className="h6 text-uppercase text-secondary fw-semibold mt-4 mb-3"
            style={{ letterSpacing: '.04em' }}
          >
            In lavorazione
          </h2>
          <div className="row g-3">
            {lavorazione.map((o) => (
              <div className="col-12 col-md-6 col-xl-4" key={o.id}>
                <OrderCard o={o} />
              </div>
            ))}
          </div>
        </React.Fragment>
      )}

      {chiuse.length > 0 && (
        <React.Fragment>
          <h2
            className="h6 text-uppercase text-secondary fw-semibold mt-4 mb-3"
            style={{ letterSpacing: '.04em' }}
          >
            Concluse
          </h2>
          <div className="row g-3">
            {chiuse.map((o) => (
              <div className="col-12 col-md-6 col-xl-4" key={o.id}>
                <OrderCard o={o} />
              </div>
            ))}
          </div>
        </React.Fragment>
      )}
    </React.Fragment>
  );
}

function GestoreMenu({ state, actions }) {
  const DD = window.DD;
  const [show, setShow] = useStateG(false);
  const [form, setForm] = useStateG({ name: '', category: 'Panini', price: '' });
  const submit = () => {
    const cents = Math.round(parseFloat((form.price || '0').replace(',', '.')) * 100);
    if (!form.name.trim() || !cents) return;
    actions.addItem({
      name: form.name.trim(),
      description: '',
      category: form.category,
      price: cents
    });
    setForm({ name: '', category: 'Panini', price: '' });
    setShow(false);
  };
  return (
    <React.Fragment>
      <div className="d-flex align-items-baseline justify-content-between mb-3">
        <h1 className="h3 mb-0">Menu</h1>
        <button className="btn btn-sm btn-primary" onClick={() => setShow(true)}>
          + Nuovo elemento
        </button>
      </div>
      <div className="table-responsive">
        <table className="table align-middle">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Categoria</th>
              <th className="text-end">Prezzo</th>
              <th className="text-center">Disponibile</th>
            </tr>
          </thead>
          <tbody>
            {state.menu.map((m) => (
              <tr key={m.id}>
                <td>
                  <div className="fw-medium">{m.name}</div>
                  {m.description && <small className="text-secondary">{m.description}</small>}
                </td>
                <td>
                  <span className="badge text-bg-light border">{m.category}</span>
                </td>
                <td className="text-end">{DD.euros(m.price)}</td>
                <td className="text-center">
                  <div className="form-check form-switch d-inline-block">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      role="switch"
                      checked={m.available}
                      onChange={() => actions.toggleItem(m.id)}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-secondary small">
        Disattiva un elemento per segnarlo come <em>esaurito</em>: sparisce subito dal menu del
        cliente.
      </p>

      {show && (
        <Modal
          title="Nuovo elemento"
          onClose={() => setShow(false)}
          footer={
            <React.Fragment>
              <button className="btn btn-outline-secondary" onClick={() => setShow(false)}>
                Annulla
              </button>
              <button
                className="btn btn-primary"
                onClick={submit}
                disabled={!form.name.trim() || !form.price}
              >
                Aggiungi
              </button>
            </React.Fragment>
          }
        >
          <div className="mb-3">
            <label className="form-label">Nome</label>
            <input
              className="form-control"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="es. Nachos"
            />
          </div>
          <div className="row g-3">
            <div className="col-7">
              <label className="form-label">Categoria</label>
              <select
                className="form-select"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {[...new Set(state.menu.map((m) => m.category))].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="col-5">
              <label className="form-label">Prezzo (€)</label>
              <input
                className="form-control"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                placeholder="5,00"
                inputMode="decimal"
              />
            </div>
          </div>
        </Modal>
      )}
    </React.Fragment>
  );
}

function GestoreQR({ state }) {
  const [spots, setSpots] = useStateG(window.DD.sources);
  const add = () =>
    setSpots((s) => [...s, `Tavolo ${s.filter((x) => x.startsWith('Tavolo')).length + 1}`]);
  return (
    <React.Fragment>
      <div className="d-flex align-items-baseline justify-content-between mb-3">
        <h1 className="h3 mb-0">QR code</h1>
        <button className="btn btn-sm btn-primary" onClick={add}>
          + Genera QR
        </button>
      </div>
      <div className="row g-3">
        {spots.map((s) => (
          <div className="col-6 col-md-4 col-lg-3" key={s}>
            <div className="card text-center h-100">
              <div className="card-body">
                <div className="d-flex justify-content-center mb-2">
                  <QrGlyph size={96} />
                </div>
                <div className="fw-medium">{s}</div>
                <button className="btn btn-sm btn-outline-secondary mt-2">Scarica</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </React.Fragment>
  );
}

function GestoreLavoratori({ state, actions }) {
  const [show, setShow] = useStateG(false);
  const [user, setUser] = useStateG('');
  const rows = state.lavoratori.filter((l) => l.tenant === state.tenant.name);
  const submit = () => {
    if (!user.trim()) return;
    actions.addLavoratore(user.trim(), state.tenant.name);
    setUser('');
    setShow(false);
  };
  return (
    <React.Fragment>
      <div className="d-flex align-items-baseline justify-content-between mb-3">
        <h1 className="h3 mb-0">Lavoratori</h1>
        <button className="btn btn-sm btn-primary" onClick={() => setShow(true)}>
          + Nuovo lavoratore
        </button>
      </div>
      <div className="table-responsive">
        <table className="table align-middle">
          <thead>
            <tr>
              <th>Username</th>
              <th>Tenant</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan="3" className="text-secondary">
                  Nessun lavoratore.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="fw-medium">{r.user}</td>
                <td>{r.tenant}</td>
                <td className="text-end">
                  <button className="btn btn-sm btn-outline-secondary">Reimposta password</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {show && (
        <Modal
          title="Nuovo lavoratore"
          onClose={() => setShow(false)}
          footer={
            <React.Fragment>
              <button className="btn btn-outline-secondary" onClick={() => setShow(false)}>
                Annulla
              </button>
              <button className="btn btn-primary" onClick={submit} disabled={!user.trim()}>
                Crea
              </button>
            </React.Fragment>
          }
        >
          <label className="form-label">Username</label>
          <input
            className="form-control"
            value={user}
            onChange={(e) => setUser(e.target.value)}
            placeholder="es. cucina-3"
          />
          <div className="form-text">
            Assegnato a {state.tenant.name}. La password iniziale viene generata e mostrata una sola
            volta.
          </div>
        </Modal>
      )}
    </React.Fragment>
  );
}

function StatCards({ stats }) {
  return (
    <div className="row g-3 mb-4">
      {stats.map((s) => (
        <div className="col-6 col-lg-3" key={s.k}>
          <div className="card h-100">
            <div className="card-body">
              <div className="text-secondary small">{s.k}</div>
              <div className="h3 mb-0 mt-1">{s.v}</div>
              {s.sub && <div className="text-secondary small mt-1">{s.sub}</div>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function GestoreReport({ state }) {
  const [period, setPeriod] = useStateG('Giornaliero');
  return (
    <React.Fragment>
      <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
        <h1 className="h3 mb-0">Report</h1>
        <div className="btn-group btn-group-sm" role="group">
          {['Giornaliero', 'Mensile'].map((p) => (
            <button
              key={p}
              className={`btn ${period === p ? 'btn-primary' : 'btn-outline-secondary'}`}
              onClick={() => setPeriod(p)}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
      {period === 'Giornaliero' ? <ReportDaily state={state} /> : <ReportMonthly state={state} />}
    </React.Fragment>
  );
}

function ReportDaily({ state }) {
  const DD = window.DD;
  const consegnate = state.orders.filter((o) => o.status === 'CONSEGNATA');
  const incasso = consegnate.reduce((s, o) => s + DD.orderTotal(o), 0);
  const stats = [
    { k: 'Comande oggi', v: state.orders.length },
    { k: 'Consegnate', v: consegnate.length },
    {
      k: 'In lavorazione',
      v: state.orders.filter((o) =>
        ['IN_ATTESA', 'CONFERMATA', 'IN_PREPARAZIONE', 'PRONTA'].includes(o.status)
      ).length
    },
    { k: 'Incasso (consegnate)', v: DD.euros(incasso) }
  ];
  return (
    <React.Fragment>
      <p className="text-secondary small mb-3">Giornaliero · oggi {DD.nowHM()}</p>
      <StatCards stats={stats} />
      <div className="card">
        <div className="card-header bg-body-tertiary fw-medium">Attività recente</div>
        <ul className="list-group list-group-flush">
          {state.log.length === 0 && (
            <li className="list-group-item text-secondary">Nessuna attività ancora.</li>
          )}
          {state.log.map((e, k) => (
            <li key={k} className="list-group-item d-flex gap-3">
              <span className="text-secondary small" style={{ width: 44, flex: 'none' }}>
                {e.t}
              </span>
              <span>{e.msg}</span>
            </li>
          ))}
        </ul>
      </div>
    </React.Fragment>
  );
}

// Deterministic month aggregate (stable across renders) — a completed month so
// totals read sensibly. Real data would come from the orders collection.
function buildMonth(state) {
  const DD = window.DD;
  const YEAR = 2026,
    MONTH = 4; // Maggio (May) 2026
  const days = 31;
  const GIORNI = ['dom', 'lun', 'mar', 'mer', 'gio', 'ven', 'sab'];
  const rows = [];
  for (let d = 1; d <= days; d++) {
    const wd = new Date(YEAR, MONTH, d).getDay();
    const weekend = wd === 5 || wd === 6; // ven/sab busier
    const slow = wd === 1; // lunedì più calmo
    const jitter = ((d * 73) % 19) / 19; // 0..1, stable
    let n = Math.round((weekend ? 58 : slow ? 26 : 38) + jitter * 18);
    const avg = 1650 + Math.round(jitter * 520); // scontrino medio in cents
    rows.push({ d, wd: GIORNI[wd], weekend, orders: n, revenue: n * avg });
  }
  const totalOrders = rows.reduce((s, r) => s + r.orders, 0);
  const totalRevenue = rows.reduce((s, r) => s + r.revenue, 0);
  const avgTicket = Math.round(totalRevenue / totalOrders);
  const best = rows.reduce((a, b) => (b.revenue > a.revenue ? b : a), rows[0]);
  const maxRev = Math.max(...rows.map((r) => r.revenue));

  // best sellers: weight each menu item, derive monthly qty
  const weights = [22, 18, 14, 20, 9, 16, 12, 6];
  const wsum = weights.reduce((a, b) => a + b, 0);
  const sellers = DD.menu
    .map((m, i) => ({
      name: m.name,
      price: m.price,
      qty: Math.round((weights[i % weights.length] / wsum) * totalOrders * 1.6)
    }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  // channel split
  const asporto = Math.round(totalOrders * 0.36);
  const tavolo = totalOrders - asporto;

  return {
    label: 'maggio 2026',
    days,
    rows,
    totalOrders,
    totalRevenue,
    avgTicket,
    best,
    maxRev,
    sellers,
    asporto,
    tavolo
  };
}

function ReportMonthly({ state }) {
  const DD = window.DD;
  const m = buildMonth(state);
  const stats = [
    { k: 'Comande del mese', v: m.totalOrders.toLocaleString('it-IT') },
    { k: 'Incasso totale', v: DD.euros(m.totalRevenue) },
    { k: 'Scontrino medio', v: DD.euros(m.avgTicket) },
    { k: 'Giorno migliore', v: `${m.best.d} mag`, sub: DD.euros(m.best.revenue) }
  ];
  return (
    <React.Fragment>
      <p className="text-secondary small mb-3">
        Mensile · {m.label} · {m.days} giorni
      </p>
      <StatCards stats={stats} />

      <div className="card mb-4">
        <div className="card-header bg-body-tertiary fw-medium d-flex justify-content-between align-items-center">
          <span>Incasso giornaliero</span>
          <span className="text-secondary small fw-normal">€ per giorno · {m.label}</span>
        </div>
        <div className="card-body">
          <div className="dd-bars" role="img" aria-label="Grafico incasso giornaliero del mese">
            {m.rows.map((r) => (
              <div
                key={r.d}
                className="dd-bar-col"
                title={`${r.d} mag (${r.wd}) · ${DD.euros(r.revenue)} · ${r.orders} comande`}
              >
                <div
                  className="dd-bar"
                  style={{
                    height: Math.max(4, Math.round((r.revenue / m.maxRev) * 100)) + '%',
                    background: r.weekend ? 'var(--bs-primary)' : 'var(--dd-orange-3)'
                  }}
                ></div>
                {r.d % 5 === 0 && <span className="dd-bar-lbl">{r.d}</span>}
              </div>
            ))}
          </div>
          <div className="d-flex gap-3 mt-3 small text-secondary">
            <span className="d-inline-flex align-items-center gap-1">
              <span className="dd-legend" style={{ background: 'var(--bs-primary)' }}></span>{' '}
              Ven/Sab
            </span>
            <span className="d-inline-flex align-items-center gap-1">
              <span className="dd-legend" style={{ background: 'var(--dd-orange-3)' }}></span>{' '}
              Feriali
            </span>
          </div>
        </div>
      </div>

      <div className="row g-3">
        <div className="col-12 col-lg-7">
          <div className="card h-100">
            <div className="card-header bg-body-tertiary fw-medium">Più venduti</div>
            <div className="table-responsive">
              <table className="table align-middle mb-0">
                <thead>
                  <tr>
                    <th>Articolo</th>
                    <th className="text-end">Quantità</th>
                    <th className="text-end">Incasso</th>
                  </tr>
                </thead>
                <tbody>
                  {m.sellers.map((s, k) => (
                    <tr key={k}>
                      <td className="fw-medium">{s.name}</td>
                      <td className="text-end">{s.qty.toLocaleString('it-IT')}</td>
                      <td className="text-end">{DD.euros(s.qty * s.price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div className="col-12 col-lg-5">
          <div className="card h-100">
            <div className="card-header bg-body-tertiary fw-medium">Canale</div>
            <ul className="list-group list-group-flush">
              <li className="list-group-item d-flex justify-content-between">
                <span>Al tavolo</span>
                <span className="fw-medium">{m.tavolo.toLocaleString('it-IT')}</span>
              </li>
              <li className="list-group-item d-flex justify-content-between">
                <span>Asporto</span>
                <span className="fw-medium">{m.asporto.toLocaleString('it-IT')}</span>
              </li>
              <li className="list-group-item">
                <div className="progress" style={{ height: 10 }}>
                  <div
                    className="progress-bar"
                    style={{
                      width: Math.round((m.tavolo / m.totalOrders) * 100) + '%',
                      background: 'var(--bs-primary)'
                    }}
                  ></div>
                  <div
                    className="progress-bar"
                    style={{
                      width: Math.round((m.asporto / m.totalOrders) * 100) + '%',
                      background: 'var(--dd-orange-3)'
                    }}
                  ></div>
                </div>
                <div className="d-flex justify-content-between small text-secondary mt-1">
                  <span>{Math.round((m.tavolo / m.totalOrders) * 100)}% tavolo</span>
                  <span>{Math.round((m.asporto / m.totalOrders) * 100)}% asporto</span>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <p className="text-secondary small mt-3 mb-0">
        Dati del mese precedente (esempio). Il report reale è calcolato dalle comande consegnate del
        periodo.
      </p>
    </React.Fragment>
  );
}

Object.assign(window, { GestoreApp, OrderCard });
