// Shell — the connected console. Customer phone + staff device share ONE store.
// Staff device is gated by a login screen, then switches between the three
// staff roles. Tweaks: primary color, demo auto-pilot + speed, venue name.
const { useState: useStateSh, useEffect: useEffectSh, useRef: useRefSh } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/ {
  primary: '#d9480f',
  autopilot: false,
  speed: 1.6,
  venue: 'Pub del Centro'
}; /*EDITMODE-END*/

const STAFF_ROLES = [
  { key: 'gestore', label: 'Gestore', user: 'gestore@pubdelcentro' },
  { key: 'lavoratore', label: 'Lavoratore', user: 'cucina-1' },
  { key: 'superuser', label: 'Superuser', user: 'superadmin' }
];

function darken(hex, amt) {
  return `color-mix(in srgb, ${hex} ${amt}%, black)`;
}

function AppShell() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const { state, actions } = useDD();
  const [view, setView] = useStateSh('split'); // split | cliente | staff
  const [authed, setAuthed] = useStateSh(false);
  const [role, setRole] = useStateSh('gestore');
  const [resetKey, setResetKey] = useStateSh(0);
  const doReset = () => {
    actions.reset();
    setAuthed(false);
    setResetKey((k) => k + 1);
  };

  // venue name → store
  useEffectSh(() => {
    if (t.venue && t.venue !== state.tenant.name) actions.setTenantName(t.venue);
  }, [t.venue]);

  // auto-pilot: push orders through the kitchen hands-free
  useEffectSh(() => {
    if (!t.autopilot) return;
    const ms = Math.max(400, Math.round((t.speed || 1.6) * 1000));
    const id = setInterval(() => actions.autoStep(), ms);
    return () => clearInterval(id);
  }, [t.autopilot, t.speed]);

  const brandStyle = {
    '--dd-brand': t.primary,
    '--dd-brand-hover': darken(t.primary, 88),
    '--dd-brand-active': darken(t.primary, 78)
  };

  const showCliente = view !== 'staff';
  const showStaff = view !== 'cliente';

  const waiting = state.orders.filter((o) => o.status === 'IN_ATTESA').length;
  const prepping = state.orders.filter((o) =>
    ['CONFERMATA', 'IN_PREPARAZIONE', 'PRONTA'].includes(o.status)
  ).length;

  return (
    <div className="dd-branded dd-app" style={brandStyle}>
      {/* top toolbar */}
      <header className="dd-topbar">
        <div className="d-flex align-items-center gap-2">
          <span className="fw-bold">
            DishDash <span className="dd-brand">QR</span>
          </span>
          <span className="text-secondary small d-none d-md-inline">· Flusso completo</span>
        </div>
        <div className="btn-group btn-group-sm dd-viewseg" role="group">
          {[
            ['split', 'Affiancato'],
            ['cliente', 'Cliente'],
            ['staff', 'Staff']
          ].map(([k, l]) => (
            <button
              key={k}
              className={`btn ${view === k ? 'btn-primary' : 'btn-outline-secondary'}`}
              onClick={() => setView(k)}
            >
              {l}
            </button>
          ))}
        </div>
        <div className="d-flex align-items-center gap-2">
          <span className="badge text-bg-warning rounded-pill" title="In attesa di conferma">
            {waiting} in attesa
          </span>
          <span
            className="badge text-bg-info rounded-pill d-none d-sm-inline"
            title="In lavorazione"
          >
            {prepping} in coda
          </span>
          <button className="btn btn-sm btn-outline-secondary text-nowrap" onClick={doReset}>
            Reset demo
          </button>
        </div>
      </header>

      {/* stage */}
      <main className="dd-stage">
        {showCliente && (
          <section className="dd-pane-cliente">
            <ClienteApp key={resetKey} />
          </section>
        )}
        {showStaff && (
          <section className="dd-pane-staff">
            {!authed ? (
              <StaffLogin
                role={role}
                setRole={setRole}
                onLogin={(r) => {
                  setRole(r);
                  setAuthed(true);
                }}
                venue={state.tenant.name}
              />
            ) : (
              <div className="dd-staff-device">
                <div className="dd-rolebar">
                  <span className="text-secondary small me-1">Dispositivo staff:</span>
                  <div className="btn-group btn-group-sm" role="group">
                    {STAFF_ROLES.map((r) => (
                      <button
                        key={r.key}
                        className={`btn ${role === r.key ? 'btn-dark' : 'btn-outline-secondary'}`}
                        onClick={() => setRole(r.key)}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="dd-staff-screen">
                  {role === 'gestore' && <GestoreApp onLogout={() => setAuthed(false)} />}
                  {role === 'lavoratore' && <LavoratoreApp onLogout={() => setAuthed(false)} />}
                  {role === 'superuser' && <AdminApp onLogout={() => setAuthed(false)} />}
                </div>
              </div>
            )}
          </section>
        )}
      </main>

      <TweaksPanel>
        <TweakSection label="Brand" />
        <TweakColor
          label="Colore primario"
          value={t.primary}
          options={['#d9480f', '#0d6efd', '#198754', '#6f42c1', '#d6336c']}
          onChange={(v) => setTweak('primary', v)}
        />
        <TweakText label="Nome del locale" value={t.venue} onChange={(v) => setTweak('venue', v)} />
        <TweakSection label="Demo" />
        <TweakToggle
          label="Auto-pilota cucina"
          value={t.autopilot}
          onChange={(v) => setTweak('autopilot', v)}
        />
        <TweakSlider
          label="Velocità"
          value={t.speed}
          min={0.6}
          max={4}
          step={0.2}
          unit="s/step"
          onChange={(v) => setTweak('speed', v)}
        />
        <div className="text-secondary small mt-2" style={{ lineHeight: 1.4 }}>
          L'auto-pilota fa avanzare da solo le comande in cucina. Invia ordini dal telefono e
          guardali muoversi.
        </div>
      </TweaksPanel>
    </div>
  );
}

function StaffLogin({ role, setRole, onLogin, venue }) {
  const cur = STAFF_ROLES.find((r) => r.key === role) || STAFF_ROLES[0];
  const dark = role === 'superuser';
  return (
    <div className="dd-login-wrap">
      <div className="card dd-login-card">
        <div className={`card-header ${dark ? 'bg-dark text-white' : 'bg-body-tertiary'} fw-bold`}>
          DishDash · <span className="dd-brand">{cur.label}</span>
        </div>
        <div className="card-body">
          <p className="text-secondary small mb-3">
            Accesso staff. Gli account vengono creati dall'alto (superuser → gestori → lavoratori):
            non esiste registrazione pubblica.
          </p>
          <label className="form-label small text-secondary">Ruolo</label>
          <div className="btn-group btn-group-sm w-100 mb-3" role="group">
            {STAFF_ROLES.map((r) => (
              <button
                key={r.key}
                className={`btn ${role === r.key ? 'btn-primary' : 'btn-outline-secondary'}`}
                onClick={() => setRole(r.key)}
              >
                {r.label}
              </button>
            ))}
          </div>
          <label className="form-label">Username</label>
          <input className="form-control mb-2" defaultValue={cur.user} key={cur.user} />
          <label className="form-label">Password</label>
          <input className="form-control mb-3" type="password" defaultValue="demo1234" />
          <button className="btn btn-primary w-100" onClick={() => onLogin(role)}>
            Accedi
          </button>
        </div>
      </div>
      <div className="text-secondary small mt-3 text-center" style={{ maxWidth: 320 }}>
        {role === 'superuser'
          ? 'Il superuser gestisce tutti i locali (tenant) della piattaforma.'
          : `${cur.label} di "${venue}".`}
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <DDProvider>
    <AppShell />
  </DDProvider>
);
