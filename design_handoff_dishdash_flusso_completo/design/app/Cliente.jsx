// Cliente (customer) — the phone surface. Public landing → QR scan → menu →
// cart/confirm → LIVE tracking. Tracking reads the shared store, so the status
// updates by itself as the manager and worker act on the order.
const { useState: useStateC, useEffect: useEffectC } = React;

function ClienteApp() {
  const { state, actions } = useDD();
  const DD = window.DD;
  const [screen, setScreen] = useStateC('landing'); // landing | scan | menu | confirm | track
  const [qty, setQty] = useStateC({});
  const [nickname, setNickname] = useStateC('');
  const [source, setSource] = useStateC('Tavolo 5');
  const [myToken, setMyToken] = useStateC(null);

  const setItem = (id, v) => setQty((q) => ({ ...q, [id]: Math.max(0, v) }));
  const cart = state.menu.filter((m) => qty[m.id] > 0).map((m) => ({ ...m, qty: qty[m.id] }));
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const count = cart.reduce((s, i) => s + i.qty, 0);
  const cats = [...new Set(state.menu.map((m) => m.category))];
  const myOrder = state.orders.find((o) => o.trackToken === myToken) || null;

  const send = () => {
    const items = cart.map((i) => ({
      id: i.id,
      name: i.name,
      qty: i.qty,
      price: i.price,
      notes: ''
    }));
    const tk = actions.place(nickname.trim(), source, items);
    setMyToken(tk);
    setScreen('track');
  };
  const newOrder = () => {
    setQty({});
    setNickname('');
    setMyToken(null);
    setScreen('landing');
  };

  return (
    <Phone label="Cliente · telefono">
      {screen !== 'landing' && screen !== 'scan' && (
        <div className="bg-body-tertiary border-bottom px-3 py-2 d-flex align-items-center justify-content-between flex-none">
          <div>
            <div className="navbar-brand mb-0 fw-bold" style={{ fontSize: 18 }}>
              DishDash <span className="dd-brand">QR</span>
            </div>
            <div className="small text-secondary text-nowrap">
              {state.tenant.name} · {source}
            </div>
          </div>
          {screen === 'menu' && count > 0 && (
            <span className="badge rounded-pill text-bg-secondary">{count} nel carrello</span>
          )}
        </div>
      )}

      {screen === 'landing' && <ClienteLanding onScan={() => setScreen('scan')} />}
      {screen === 'scan' && (
        <ClienteScan
          source={source}
          setSource={setSource}
          sources={DD.sources}
          tenant={state.tenant}
          onDone={() => setScreen('menu')}
          onBack={() => setScreen('landing')}
        />
      )}
      {screen === 'menu' && (
        <ClienteMenu
          cats={cats}
          menu={state.menu}
          qty={qty}
          setItem={setItem}
          total={total}
          count={count}
          euros={DD.euros}
          onCheckout={() => setScreen('confirm')}
        />
      )}
      {screen === 'confirm' && (
        <ClienteConfirm
          cart={cart}
          total={total}
          nickname={nickname}
          setNickname={setNickname}
          euros={DD.euros}
          onBack={() => setScreen('menu')}
          canSend={!!nickname.trim() && count > 0}
          onSend={send}
        />
      )}
      {screen === 'track' && (
        <ClienteTrack
          order={myOrder}
          euros={DD.euros}
          onCancel={() => myOrder && actions.cancel(myOrder.id)}
          onNew={newOrder}
        />
      )}
    </Phone>
  );
}

function ClienteLanding({ onScan }) {
  return (
    <div className="flex-grow-1 overflow-auto px-3 py-4 d-flex flex-column">
      <div className="text-center mb-4 mt-2">
        <div className="fw-bold" style={{ fontSize: 30, lineHeight: 1.1 }}>
          DishDash <span className="dd-brand">QR</span>
        </div>
        <p className="lead text-secondary mt-3 mb-0" style={{ fontSize: 16 }}>
          Ordina dal tuo tavolo scansionando il QR del locale. Nessuna registrazione: scegli un
          nickname e segui la tua comanda.
        </p>
      </div>
      <div className="d-flex flex-column gap-3">
        <div className="card">
          <div className="card-body">
            <h2 className="h6 card-title mb-1">Sei un cliente?</h2>
            <p className="card-text text-secondary small mb-3">
              Inquadra il QR code sul tavolo o al banco per aprire il menu del locale.
            </p>
            <button className="btn btn-primary w-100" onClick={onScan}>
              Inquadra il QR
            </button>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <h2 className="h6 card-title mb-1">Sei dello staff?</h2>
            <p className="card-text text-secondary small mb-0">
              Gestore e lavoratore accedono dal pannello staff con le proprie credenziali. →
            </p>
          </div>
        </div>
      </div>
      <div className="mt-auto text-center text-secondary small pt-4">
        Pagamento in contanti alla consegna
      </div>
    </div>
  );
}

function ClienteScan({ source, setSource, sources, tenant, onDone, onBack }) {
  const [phase, setPhase] = useStateC('scanning'); // scanning | found
  useEffectC(() => {
    const t = setTimeout(() => setPhase('found'), 1700);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className="flex-grow-1 d-flex flex-column" style={{ background: '#0b0b0c' }}>
      <div className="d-flex align-items-center px-3 py-2">
        <button className="btn btn-sm btn-dark text-white border-0" onClick={onBack}>
          ← Annulla
        </button>
      </div>
      <div className="flex-grow-1 d-flex flex-column align-items-center justify-content-center text-center px-4">
        <div className={`dd-scanframe ${phase === 'found' ? 'is-found' : ''}`}>
          <QrGlyph size={150} />
          {phase === 'scanning' && <div className="dd-scanline" aria-hidden="true"></div>}
        </div>
        {phase === 'scanning' ? (
          <div className="text-white-50 mt-4">Inquadra il QR code del tavolo…</div>
        ) : (
          <div className="mt-4 text-white">
            <div className="badge text-bg-success mb-2">QR rilevato</div>
            <div className="fw-bold" style={{ fontSize: 18 }}>
              {tenant.name}
            </div>
            <div className="text-white-50 small mb-3">
              Scegli (o conferma) la postazione del QR:
            </div>
            <select
              className="form-select form-select-sm mb-3"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              style={{ maxWidth: 220, margin: '0 auto' }}
            >
              {sources.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
            <button className="btn btn-primary w-100" onClick={onDone}>
              Apri il menu
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function ClienteMenu({ cats, menu, qty, setItem, total, count, euros, onCheckout }) {
  return (
    <React.Fragment>
      <div className="flex-grow-1 overflow-auto px-3 py-3" style={{ minHeight: 0 }}>
        {cats.map((cat) => (
          <div key={cat} className="mb-3">
            <h2
              className="text-uppercase text-secondary fw-semibold mb-2"
              style={{ letterSpacing: '.04em', fontSize: 12 }}
            >
              {cat}
            </h2>
            <ul className="list-group">
              {menu
                .filter((m) => m.category === cat)
                .map((m) => {
                  const off = !m.available;
                  return (
                    <li
                      key={m.id}
                      className="list-group-item d-flex justify-content-between align-items-center gap-2"
                    >
                      <div className={off ? 'text-secondary' : ''}>
                        <div className="fw-medium">
                          {m.name}
                          {off && <span className="badge text-bg-light border ms-2">esaurito</span>}
                        </div>
                        {m.description && <small className="text-secondary">{m.description}</small>}
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        <span className="text-nowrap">{euros(m.price)}</span>
                        {off ? (
                          <span className="btn btn-sm btn-light disabled">—</span>
                        ) : (
                          <QtyStepper value={qty[m.id] || 0} onChange={(v) => setItem(m.id, v)} />
                        )}
                      </div>
                    </li>
                  );
                })}
            </ul>
          </div>
        ))}
      </div>
      <div
        className="border-top bg-white px-3 py-2 flex-none"
        style={{ boxShadow: '0 -.125rem .5rem rgba(0,0,0,.05)' }}
      >
        <button
          className="btn btn-primary w-100 d-flex justify-content-between align-items-center"
          disabled={count === 0}
          onClick={onCheckout}
        >
          <span>Vai al carrello{count > 0 ? ` · ${count}` : ''}</span>
          <span className="fw-semibold">{euros(total)}</span>
        </button>
      </div>
    </React.Fragment>
  );
}

function ClienteConfirm({ cart, total, nickname, setNickname, euros, onBack, onSend, canSend }) {
  return (
    <div className="flex-grow-1 overflow-auto px-3 py-3 d-flex flex-column">
      <button
        className="btn btn-link p-0 mb-3 text-secondary text-decoration-none align-self-start"
        onClick={onBack}
      >
        ← Torna al menu
      </button>
      <h1 className="h4 mb-3">Il tuo ordine</h1>
      {cart.length === 0 ? (
        <p className="text-secondary">Il carrello è vuoto.</p>
      ) : (
        <ul className="list-group mb-3">
          {cart.map((i) => (
            <li
              key={i.id}
              className="list-group-item d-flex justify-content-between align-items-center"
            >
              <span>
                <span className="text-secondary me-2">{i.qty}×</span>
                {i.name}
              </span>
              <span className="text-nowrap">{euros(i.price * i.qty)}</span>
            </li>
          ))}
          <li className="list-group-item d-flex justify-content-between fw-semibold">
            <span>Totale</span>
            <span>{euros(total)}</span>
          </li>
        </ul>
      )}
      <label className="form-label">Scegli un nickname</label>
      <input
        type="text"
        className="form-control mb-1"
        placeholder="es. Marco"
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
      />
      <div className="form-text mb-3">
        Nessuna registrazione. Ti serve solo per ritirare la comanda.
      </div>
      <div className="mt-auto">
        <button className="btn btn-primary w-100" disabled={!canSend} onClick={onSend}>
          Invia ordine
        </button>
        <div className="text-center text-secondary small mt-2">
          Pagamento in contanti alla consegna
        </div>
      </div>
    </div>
  );
}

function ClienteTrack({ order, euros, onCancel, onNew }) {
  if (!order) return <div className="p-4 text-secondary">Comanda non trovata.</div>;
  const steps = ['IN_ATTESA', 'CONFERMATA', 'IN_PREPARAZIONE', 'PRONTA', 'CONSEGNATA'];
  const rejected = order.status === 'RIFIUTATA' || order.status === 'ANNULLATA';
  const idx = steps.indexOf(order.status);
  const total = order.items.reduce((s, i) => s + i.price * i.qty, 0);
  return (
    <div className="flex-grow-1 overflow-auto px-3 py-4 d-flex flex-column">
      <div className="text-center mb-4">
        <div className="text-secondary small">
          Comanda di {order.nickname || '—'} · {order.source}
        </div>
        <div className="display-6">{order.number != null ? `N° ${order.number}` : '—'}</div>
        <div className="mt-2">
          <StatusBadge status={order.status} />
        </div>
      </div>

      {rejected ? (
        <div
          className={`alert ${order.status === 'RIFIUTATA' ? 'alert-danger' : 'alert-secondary'} text-center`}
        >
          {order.status === 'RIFIUTATA'
            ? 'La comanda è stata rifiutata dal locale.'
            : 'Hai annullato la comanda.'}
        </div>
      ) : (
        <ol className="list-unstyled mb-4">
          {steps.map((k, i) => {
            const done = i < idx,
              current = i === idx;
            return (
              <li key={k} className="d-flex align-items-center gap-3 mb-2">
                <span
                  className="dd-step-dot"
                  style={{
                    background: done || current ? 'var(--bs-primary)' : '#e9ecef',
                    color: done || current ? '#fff' : '#adb5bd'
                  }}
                >
                  {done ? '✓' : i + 1}
                </span>
                <span className={current ? 'fw-semibold' : done ? '' : 'text-secondary'}>
                  {window.DD.STEP_LABEL[k]}
                </span>
                {current && <span className="dd-pulse ms-1" aria-hidden="true"></span>}
              </li>
            );
          })}
        </ol>
      )}

      <ul className="list-group mb-3">
        {order.items.map((i, k) => (
          <li key={k} className="list-group-item d-flex justify-content-between">
            <span>
              <span className="text-secondary me-2">{i.qty}×</span>
              {i.name}
            </span>
            <span>{euros(i.price * i.qty)}</span>
          </li>
        ))}
        <li className="list-group-item d-flex justify-content-between fw-semibold">
          <span>Totale</span>
          <span>{euros(total)}</span>
        </li>
      </ul>

      <div className="mt-auto d-flex flex-column gap-2">
        {order.status === 'IN_ATTESA' && (
          <button className="btn btn-outline-danger w-100" onClick={onCancel}>
            Annulla comanda
          </button>
        )}
        {order.status === 'PRONTA' && (
          <div className="alert alert-success mb-0 text-center py-2">
            La tua comanda è pronta. Ritirala al banco!
          </div>
        )}
        {order.status === 'CONSEGNATA' && (
          <div className="alert alert-success mb-0 text-center py-2">
            Comanda consegnata. Buon appetito!
          </div>
        )}
        <button className="btn btn-link text-secondary text-decoration-none" onClick={onNew}>
          Nuovo ordine
        </button>
      </div>
    </div>
  );
}

Object.assign(window, { ClienteApp });
