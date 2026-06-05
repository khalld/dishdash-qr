// Shared order store for the DishDash QR full-flow prototype.
// One source of truth: every surface (cliente / gestore / lavoratore / superuser)
// reads and writes the SAME orders, so an order placed on the phone appears live
// in the manager's queue, flows to the worker, and updates the customer's tracking.
const { createContext, useContext, useReducer, useEffect, useRef, useCallback } = React;

const DDContext = createContext(null);

let _seq = 100;
const uid = (p) => `${p}-${++_seq}`;
const token = () => Math.random().toString(36).slice(2, 8);

function initState() {
  const DD = window.DD;
  return {
    tenant: { ...DD.tenant },
    menu: DD.menu.map((m) => ({ ...m })),
    orders: DD.seedOrders.map((o) => ({ ...o, trackToken: token(), flashAt: 0 })),
    counter: 42, // next daily order number assigned on confirm
    tenants: DD.tenants.map((t) => ({ ...t })),
    lavoratori: DD.lavoratori.map((l) => ({ ...l })),
    tick: 0,
    log: [] // recent activity feed (newest first)
  };
}

const FLASH = (o, status) => ({ ...o, status, flashAt: Date.now() });

function reducer(state, a) {
  switch (a.type) {
    case 'TICK':
      return { ...state, tick: state.tick + 1 };

    case 'PLACE': {
      const order = {
        id: a.id,
        trackToken: a.trackToken,
        number: null,
        nickname: a.nickname,
        source: a.source,
        status: 'IN_ATTESA',
        items: a.items,
        createdAt: window.DD.nowHM(),
        flashAt: Date.now()
      };
      return {
        ...state,
        orders: [order, ...state.orders],
        log: [
          { t: window.DD.nowHM(), msg: `Nuova comanda da ${a.nickname} (${a.source})` },
          ...state.log
        ].slice(0, 20)
      };
    }

    case 'CONFIRM': {
      const n = state.counter;
      return {
        ...state,
        counter: state.counter + 1,
        orders: state.orders.map((o) =>
          o.id === a.id ? { ...FLASH(o, 'CONFERMATA'), number: n } : o
        ),
        log: [{ t: window.DD.nowHM(), msg: `Comanda N° ${n} confermata` }, ...state.log].slice(
          0,
          20
        )
      };
    }
    case 'REJECT':
      return {
        ...state,
        orders: state.orders.map((o) => (o.id === a.id ? FLASH(o, 'RIFIUTATA') : o)),
        log: [
          { t: window.DD.nowHM(), msg: `Comanda di ${a.nickname || ''} rifiutata` },
          ...state.log
        ].slice(0, 20)
      };
    case 'CANCEL':
      return {
        ...state,
        orders: state.orders.map((o) => (o.id === a.id ? FLASH(o, 'ANNULLATA') : o)),
        log: [{ t: window.DD.nowHM(), msg: `Comanda annullata dal cliente` }, ...state.log].slice(
          0,
          20
        )
      };
    case 'TAKE':
      return {
        ...state,
        orders: state.orders.map((o) => (o.id === a.id ? FLASH(o, 'IN_PREPARAZIONE') : o))
      };
    case 'READY':
      return {
        ...state,
        orders: state.orders.map((o) => (o.id === a.id ? FLASH(o, 'PRONTA') : o)),
        log: [
          { t: window.DD.nowHM(), msg: `Comanda N° ${a.number || '—'} pronta` },
          ...state.log
        ].slice(0, 20)
      };
    case 'DELIVER':
      return {
        ...state,
        orders: state.orders.map((o) => (o.id === a.id ? FLASH(o, 'CONSEGNATA') : o))
      };

    case 'TOGGLE_ITEM':
      return {
        ...state,
        menu: state.menu.map((m) => (m.id === a.id ? { ...m, available: !m.available } : m))
      };
    case 'ADD_ITEM':
      return { ...state, menu: [...state.menu, { id: uid('m'), available: true, ...a.item }] };

    case 'SET_TENANT_NAME':
      return { ...state, tenant: { ...state.tenant, name: a.name } };

    case 'ADD_TENANT':
      return {
        ...state,
        tenants: [...state.tenants, { id: uid('t'), lavoratori: 0, attivo: true, ...a.tenant }]
      };
    case 'ADD_GESTORE':
      return {
        ...state,
        tenants: state.tenants.map((t) => (t.name === a.tenant ? { ...t, gestore: a.user } : t))
      };
    case 'ADD_LAVORATORE':
      return {
        ...state,
        lavoratori: [...state.lavoratori, { id: uid('l'), user: a.user, tenant: a.tenant }],
        tenants: state.tenants.map((t) =>
          t.name === a.tenant ? { ...t, lavoratori: t.lavoratori + 1 } : t
        )
      };

    case 'RESET':
      return initState();
    default:
      return state;
  }
}

function DDProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, initState);

  // 1s heartbeat — re-renders consumers so the "new order" highlight fades out
  useEffect(() => {
    const id = setInterval(() => dispatch({ type: 'TICK' }), 1000);
    return () => clearInterval(id);
  }, []);

  const actions = {
    place: useCallback((nickname, source, items) => {
      const id = uid('o');
      const tk = token();
      dispatch({ type: 'PLACE', id, trackToken: tk, nickname, source, items });
      return tk;
    }, []),
    confirm: useCallback((id) => dispatch({ type: 'CONFIRM', id }), []),
    reject: useCallback((id, nickname) => dispatch({ type: 'REJECT', id, nickname }), []),
    cancel: useCallback((id) => dispatch({ type: 'CANCEL', id }), []),
    take: useCallback((id) => dispatch({ type: 'TAKE', id }), []),
    ready: useCallback((id, number) => dispatch({ type: 'READY', id, number }), []),
    deliver: useCallback((id) => dispatch({ type: 'DELIVER', id }), []),
    toggleItem: useCallback((id) => dispatch({ type: 'TOGGLE_ITEM', id }), []),
    addItem: useCallback((item) => dispatch({ type: 'ADD_ITEM', item }), []),
    setTenantName: useCallback((name) => dispatch({ type: 'SET_TENANT_NAME', name }), []),
    addTenant: useCallback((tenant) => dispatch({ type: 'ADD_TENANT', tenant }), []),
    addGestore: useCallback((user, tenant) => dispatch({ type: 'ADD_GESTORE', user, tenant }), []),
    addLavoratore: useCallback(
      (user, tenant) => dispatch({ type: 'ADD_LAVORATORE', user, tenant }),
      []
    ),
    reset: useCallback(() => dispatch({ type: 'RESET' }), []),
    // one hands-free progression step for the auto-demo
    autoStep: useCallback(() => {
      dispatch(
        (function () {
          return { type: 'TICK' };
        })()
      ); // no-op placeholder; real logic below
    }, [])
  };

  // Auto-step needs current state — expose via ref + an imperative stepper
  const stateRef = useRef(state);
  stateRef.current = state;
  actions.autoStep = useCallback(() => {
    const s = stateRef.current;
    const pronta = s.orders.find((o) => o.status === 'PRONTA');
    if (pronta) return dispatch({ type: 'DELIVER', id: pronta.id });
    const prep = s.orders.find((o) => o.status === 'IN_PREPARAZIONE');
    if (prep) return dispatch({ type: 'READY', id: prep.id, number: prep.number });
    const conf = s.orders.find((o) => o.status === 'CONFERMATA');
    if (conf) return dispatch({ type: 'TAKE', id: conf.id });
    const att = s.orders.find((o) => o.status === 'IN_ATTESA');
    if (att) return dispatch({ type: 'CONFIRM', id: att.id });
  }, []);

  return <DDContext.Provider value={{ state, actions }}>{children}</DDContext.Provider>;
}

function useDD() {
  const ctx = useContext(DDContext);
  if (!ctx) throw new Error('useDD must be used within DDProvider');
  return ctx;
}

// Is this order "fresh"? (drives the highlight pulse). state.tick forces re-eval.
function isFresh(o) {
  return o.flashAt && Date.now() - o.flashAt < 3200;
}

Object.assign(window, { DDProvider, useDD, isFresh });
