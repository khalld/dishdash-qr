// Superuser (admin) — global, dark navbar. Tenants / gestori / lavoratori with
// working create flows (top-down provisioning — there is no public sign-up).
const { useState: useStateA } = React;

function AdminApp({ onLogout }) {
  const { state, actions } = useDD();
  const [tab, setTab] = useStateA('Tenant');
  return (
    <div className="bg-body h-100 overflow-auto">
      <AdminNavbar
        tabs={['Tenant', 'Gestori', 'Lavoratori']}
        active={tab}
        onTab={setTab}
        user="superadmin"
        onLogout={onLogout}
      />
      <div className="container-fluid px-3 px-lg-4 py-4">
        {tab === 'Tenant' && <AdminTenants state={state} actions={actions} />}
        {tab === 'Gestori' && <AdminGestori state={state} actions={actions} />}
        {tab === 'Lavoratori' && <AdminLavoratori state={state} actions={actions} />}
      </div>
    </div>
  );
}

function AdminTenants({ state, actions }) {
  const [show, setShow] = useStateA(false);
  const [name, setName] = useStateA('');
  const submit = () => {
    if (!name.trim()) return;
    actions.addTenant({ name: name.trim(), gestore: '—' });
    setName('');
    setShow(false);
  };
  return (
    <React.Fragment>
      <div className="d-flex align-items-baseline justify-content-between mb-3">
        <h1 className="h3 mb-0">Tenant</h1>
        <button className="btn btn-sm btn-primary" onClick={() => setShow(true)}>
          + Nuovo tenant
        </button>
      </div>
      <div className="row g-3">
        {state.tenants.map((t) => (
          <div className="col-12 col-md-6 col-lg-4" key={t.id}>
            <div className="card h-100">
              <div className="card-body">
                <div className="d-flex align-items-center gap-2 mb-2">
                  <div className="dd-tenant-logo">
                    {t.name
                      .split(' ')
                      .map((w) => w[0])
                      .join('')
                      .slice(0, 2)}
                  </div>
                  <div>
                    <div className="fw-semibold">{t.name}</div>
                    <div className="small text-secondary">gestore: {t.gestore}</div>
                  </div>
                </div>
                <div className="d-flex align-items-center justify-content-between">
                  <span className="small text-secondary">{t.lavoratori} lavoratori</span>
                  {t.attivo ? (
                    <span className="badge rounded-pill text-bg-success">attivo</span>
                  ) : (
                    <span className="badge rounded-pill text-bg-secondary">sospeso</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      {show && (
        <Modal
          title="Nuovo tenant"
          onClose={() => setShow(false)}
          footer={
            <React.Fragment>
              <button className="btn btn-outline-secondary" onClick={() => setShow(false)}>
                Annulla
              </button>
              <button className="btn btn-primary" onClick={submit} disabled={!name.trim()}>
                Crea tenant
              </button>
            </React.Fragment>
          }
        >
          <label className="form-label">Nome del locale</label>
          <input
            className="form-control mb-3"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="es. Taproom Navigli"
          />
          <label className="form-label">Logo</label>
          <div className="d-flex align-items-center gap-2">
            <div className="dd-tenant-logo">
              {(name.trim() || '··')
                .split(' ')
                .map((w) => w[0])
                .join('')
                .slice(0, 2)}
            </div>
            <button className="btn btn-outline-secondary btn-sm" disabled>
              Carica logo…
            </button>
          </div>
          <div className="form-text">
            Il superuser crea il tenant e ne assegna il logo. Il gestore verrà associato nel passo
            successivo.
          </div>
        </Modal>
      )}
    </React.Fragment>
  );
}

function AdminGestori({ state, actions }) {
  const [show, setShow] = useStateA(false);
  const [form, setForm] = useStateA({ user: '', tenant: '' });
  const rows = state.tenants.map((t) => ({ user: t.gestore, tenant: t.name, attivo: t.attivo }));
  const submit = () => {
    if (!form.user.trim() || !form.tenant) return;
    actions.addGestore(form.user.trim(), form.tenant);
    setForm({ user: '', tenant: '' });
    setShow(false);
  };
  return (
    <React.Fragment>
      <div className="d-flex align-items-baseline justify-content-between mb-3">
        <h1 className="h3 mb-0">Gestori</h1>
        <button
          className="btn btn-sm btn-primary"
          onClick={() => {
            setForm({ user: '', tenant: state.tenants[0]?.name || '' });
            setShow(true);
          }}
        >
          + Nuovo gestore
        </button>
      </div>
      <div className="table-responsive">
        <table className="table align-middle">
          <thead>
            <tr>
              <th>Username</th>
              <th>Tenant</th>
              <th>Stato</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, k) => (
              <tr key={k}>
                <td className="fw-medium">{r.user}</td>
                <td>{r.tenant}</td>
                <td>
                  {r.attivo ? (
                    <span className="badge rounded-pill text-bg-success">attivo</span>
                  ) : (
                    <span className="badge rounded-pill text-bg-secondary">sospeso</span>
                  )}
                </td>
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
          title="Nuovo gestore"
          onClose={() => setShow(false)}
          footer={
            <React.Fragment>
              <button className="btn btn-outline-secondary" onClick={() => setShow(false)}>
                Annulla
              </button>
              <button
                className="btn btn-primary"
                onClick={submit}
                disabled={!form.user.trim() || !form.tenant}
              >
                Crea gestore
              </button>
            </React.Fragment>
          }
        >
          <div className="mb-3">
            <label className="form-label">Username</label>
            <input
              className="form-control"
              value={form.user}
              onChange={(e) => setForm({ ...form, user: e.target.value })}
              placeholder="es. anna.v"
            />
          </div>
          <label className="form-label">Tenant</label>
          <select
            className="form-select"
            value={form.tenant}
            onChange={(e) => setForm({ ...form, tenant: e.target.value })}
          >
            {state.tenants.map((t) => (
              <option key={t.id}>{t.name}</option>
            ))}
          </select>
          <div className="form-text">Un gestore gestisce un solo tenant.</div>
        </Modal>
      )}
    </React.Fragment>
  );
}

function AdminLavoratori({ state, actions }) {
  const [show, setShow] = useStateA(false);
  const [form, setForm] = useStateA({ user: '', tenant: '' });
  const submit = () => {
    if (!form.user.trim() || !form.tenant) return;
    actions.addLavoratore(form.user.trim(), form.tenant);
    setForm({ user: '', tenant: '' });
    setShow(false);
  };
  return (
    <React.Fragment>
      <div className="d-flex align-items-baseline justify-content-between mb-3">
        <h1 className="h3 mb-0">Lavoratori</h1>
        <button
          className="btn btn-sm btn-primary"
          onClick={() => {
            setForm({ user: '', tenant: state.tenants[0]?.name || '' });
            setShow(true);
          }}
        >
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
            {state.lavoratori.map((r) => (
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
              <button
                className="btn btn-primary"
                onClick={submit}
                disabled={!form.user.trim() || !form.tenant}
              >
                Crea lavoratore
              </button>
            </React.Fragment>
          }
        >
          <div className="mb-3">
            <label className="form-label">Username</label>
            <input
              className="form-control"
              value={form.user}
              onChange={(e) => setForm({ ...form, user: e.target.value })}
              placeholder="es. cucina-3"
            />
          </div>
          <label className="form-label">Tenant</label>
          <select
            className="form-select"
            value={form.tenant}
            onChange={(e) => setForm({ ...form, tenant: e.target.value })}
          >
            {state.tenants.map((t) => (
              <option key={t.id}>{t.name}</option>
            ))}
          </select>
        </Modal>
      )}
    </React.Fragment>
  );
}

Object.assign(window, { AdminApp });
