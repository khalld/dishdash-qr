// Shared order store for the `/demo` interactive sandbox (ported from the design
// handoff's React `store.jsx`). ONE source of truth: every surface
// (cliente / gestore / lavoratore / superuser) reads and writes the SAME orders,
// so an order placed on the phone appears live in the manager's queue, flows to
// the worker, and updates the customer's tracking screen — no manual refresh.
//
// This is a CLIENT-ONLY demo: nothing here touches MongoDB or the real domain
// services. It mirrors the product's state machine and copy for showcasing.
import { getContext, setContext } from 'svelte';
import type { OrderStatus } from '$lib/types';

export interface DemoOrderItem {
  id: string;
  name: string;
  qty: number;
  price: number; // integer cents — never floats
  notes: string;
}

export interface DemoOrder {
  id: string;
  trackToken: string;
  number: number | null; // assigned only on manager confirm
  nickname: string;
  source: string; // QrSource label, e.g. "Tavolo 5"
  status: OrderStatus;
  items: DemoOrderItem[];
  createdAt: string; // "HH:MM" clock snapshot
  flashAt: number; // epoch ms of the last status change; drives the fresh-card pulse
}

export interface DemoMenuItem {
  id: string;
  name: string;
  description: string;
  price: number; // cents
  category: string;
  available: boolean;
}

export interface DemoTenant {
  id: string;
  name: string;
  gestore: string;
  lavoratori: number;
  attivo: boolean;
}

export interface DemoWorker {
  id: string;
  user: string;
  tenant: string;
}

export interface DemoLogEntry {
  t: string; // "HH:MM"
  msg: string;
}

// QR sources for the demo tenant (each QR is tied to a table or pickup point).
export const DEMO_SOURCES = [
  'Tavolo 1',
  'Tavolo 2',
  'Tavolo 3',
  'Tavolo 4',
  'Tavolo 5',
  'Asporto'
] as const;

let _seq = 100;
const uid = (p: string) => `${p}-${++_seq}`;
const token = () => Math.random().toString(36).slice(2, 8);

function nowHM(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// "Fresh" orders pulse once (dd-flash). The 3.2s window matches the animation;
// queue cards are keyed on `flashAt`, so a status change remounts the card and
// replays the one-shot ring.
export function isFresh(o: DemoOrder): boolean {
  return o.flashAt > 0 && Date.now() - o.flashAt < 3200;
}

function seedMenu(): DemoMenuItem[] {
  return [
    {
      id: 'm1',
      name: 'Panino pulled pork',
      description: 'Pulled pork, coleslaw, salsa BBQ',
      price: 750,
      category: 'Panini',
      available: true
    },
    {
      id: 'm2',
      name: 'Hamburger classico',
      description: 'Manzo, cheddar, insalata, pomodoro',
      price: 850,
      category: 'Panini',
      available: true
    },
    {
      id: 'm3',
      name: 'Hot dog gigante',
      description: 'Würstel, senape, cipolla croccante',
      price: 650,
      category: 'Panini',
      available: true
    },
    {
      id: 'm4',
      name: 'Patatine fritte',
      description: 'Porzione abbondante',
      price: 400,
      category: 'Contorni',
      available: true
    },
    {
      id: 'm5',
      name: 'Onion rings',
      description: 'Anelli di cipolla in pastella',
      price: 450,
      category: 'Contorni',
      available: true
    },
    {
      id: 'm6',
      name: 'Birra artigianale 0,4l',
      description: 'Bionda alla spina',
      price: 500,
      category: 'Bevande',
      available: true
    },
    {
      id: 'm7',
      name: 'Acqua naturale 0,5l',
      description: '',
      price: 150,
      category: 'Bevande',
      available: true
    },
    {
      id: 'm8',
      name: 'Cola in lattina',
      description: '33cl',
      price: 300,
      category: 'Bevande',
      available: false
    }
  ];
}

// Orders already in the queues when the demo loads.
function seedOrders(): DemoOrder[] {
  const base: Omit<DemoOrder, 'trackToken' | 'flashAt'>[] = [
    {
      id: 'o-luca',
      nickname: 'Luca',
      source: 'Tavolo 2',
      status: 'CONFERMATA',
      number: 41,
      items: [{ id: 'm3', name: 'Hot dog gigante', qty: 3, price: 650, notes: 'extra senape' }],
      createdAt: '20:09'
    },
    {
      id: 'o-sara',
      nickname: 'Sara',
      source: 'Tavolo 1',
      status: 'IN_PREPARAZIONE',
      number: 40,
      items: [
        { id: 'm5', name: 'Onion rings', qty: 2, price: 450, notes: '' },
        { id: 'm7', name: 'Acqua naturale 0,5l', qty: 2, price: 150, notes: '' }
      ],
      createdAt: '20:02'
    },
    {
      id: 'o-davide',
      nickname: 'Davide',
      source: 'Asporto',
      status: 'PRONTA',
      number: 39,
      items: [{ id: 'm1', name: 'Panino pulled pork', qty: 1, price: 750, notes: '' }],
      createdAt: '19:58'
    },
    {
      id: 'o-marco',
      nickname: 'Marco',
      source: 'Tavolo 5',
      status: 'IN_ATTESA',
      number: null,
      items: [
        { id: 'm2', name: 'Hamburger classico', qty: 1, price: 850, notes: 'ben cotto' },
        { id: 'm4', name: 'Patatine fritte', qty: 1, price: 400, notes: '' }
      ],
      createdAt: '20:14'
    }
  ];
  return base.map((o) => ({ ...o, trackToken: token(), flashAt: 0 }));
}

function seedTenants(): DemoTenant[] {
  return [
    { id: 't1', name: 'Pub del Centro', gestore: 'gestore', lavoratori: 2, attivo: true },
    { id: 't2', name: 'Street Burger Co', gestore: 'marco.b', lavoratori: 3, attivo: true },
    { id: 't3', name: 'Birrificio Etna', gestore: 'andrea.r', lavoratori: 1, attivo: false }
  ];
}

function seedWorkers(): DemoWorker[] {
  return [
    { id: 'l1', user: 'cucina-1', tenant: 'Pub del Centro' },
    { id: 'l2', user: 'cucina-2', tenant: 'Pub del Centro' },
    { id: 'l3', user: 'bar-1', tenant: 'Street Burger Co' }
  ];
}

export function orderTotal(o: { items: DemoOrderItem[] }): number {
  return o.items.reduce((s, i) => s + i.price * i.qty, 0);
}

export class DemoStore {
  tenant = $state<{ name: string; logoUrl: string | null }>({
    name: 'Pub del Centro',
    logoUrl: null
  });
  menu = $state<DemoMenuItem[]>(seedMenu());
  orders = $state<DemoOrder[]>(seedOrders());
  counter = $state(42); // next daily order number, assigned on confirm
  tenants = $state<DemoTenant[]>(seedTenants());
  lavoratori = $state<DemoWorker[]>(seedWorkers());
  log = $state<DemoLogEntry[]>([]); // recent activity feed, newest first

  readonly sources = DEMO_SOURCES;

  private pushLog(msg: string) {
    this.log = [{ t: nowHM(), msg }, ...this.log].slice(0, 20);
  }

  // Replace one order with a patched copy and stamp flashAt (drives the pulse).
  private patch(id: string, patch: Partial<DemoOrder>) {
    this.orders = this.orders.map((o) =>
      o.id === id ? { ...o, ...patch, flashAt: Date.now() } : o
    );
  }

  // customer "Invia ordine" → new IN_ATTESA order; returns its track token.
  place = (nickname: string, source: string, items: DemoOrderItem[]): string => {
    const tk = token();
    const order: DemoOrder = {
      id: uid('o'),
      trackToken: tk,
      number: null,
      nickname,
      source,
      status: 'IN_ATTESA',
      items,
      createdAt: nowHM(),
      flashAt: Date.now()
    };
    this.orders = [order, ...this.orders];
    this.pushLog(`Nuova comanda da ${nickname} (${source})`);
    return tk;
  };

  // manager "Conferma" → assign next N° (daily counter) and move to CONFERMATA.
  confirm = (id: string) => {
    const n = this.counter;
    this.counter = n + 1;
    this.patch(id, { status: 'CONFERMATA', number: n });
    this.pushLog(`Comanda N° ${n} confermata`);
  };

  reject = (id: string, nickname?: string) => {
    this.patch(id, { status: 'RIFIUTATA' });
    this.pushLog(`Comanda di ${nickname ?? ''} rifiutata`);
  };

  // customer "Annulla comanda" — only meaningful while IN_ATTESA.
  cancel = (id: string) => {
    this.patch(id, { status: 'ANNULLATA' });
    this.pushLog('Comanda annullata dal cliente');
  };

  take = (id: string) => this.patch(id, { status: 'IN_PREPARAZIONE' });

  ready = (id: string, number: number | null) => {
    this.patch(id, { status: 'PRONTA' });
    this.pushLog(`Comanda N° ${number ?? '—'} pronta`);
  };

  deliver = (id: string) => this.patch(id, { status: 'CONSEGNATA' });

  toggleItem = (id: string) => {
    this.menu = this.menu.map((m) => (m.id === id ? { ...m, available: !m.available } : m));
  };

  addItem = (item: Omit<DemoMenuItem, 'id' | 'available'>) => {
    this.menu = [...this.menu, { id: uid('m'), available: true, ...item }];
  };

  setTenantName = (name: string) => {
    this.tenant = { ...this.tenant, name };
  };

  addTenant = (name: string, gestore = '—') => {
    this.tenants = [...this.tenants, { id: uid('t'), name, gestore, lavoratori: 0, attivo: true }];
  };

  addGestore = (user: string, tenant: string) => {
    this.tenants = this.tenants.map((t) => (t.name === tenant ? { ...t, gestore: user } : t));
  };

  addLavoratore = (user: string, tenant: string) => {
    this.lavoratori = [...this.lavoratori, { id: uid('l'), user, tenant }];
    this.tenants = this.tenants.map((t) =>
      t.name === tenant ? { ...t, lavoratori: t.lavoratori + 1 } : t
    );
  };

  reset = () => {
    this.tenant = { name: 'Pub del Centro', logoUrl: null };
    this.menu = seedMenu();
    this.orders = seedOrders();
    this.counter = 42;
    this.tenants = seedTenants();
    this.lavoratori = seedWorkers();
    this.log = [];
  };

  // One hands-free progression step for the auto-pilot: push the most-advanced
  // pending order one stage forward (deliver > ready > take > confirm).
  autoStep = () => {
    const pronta = this.orders.find((o) => o.status === 'PRONTA');
    if (pronta) return this.deliver(pronta.id);
    const prep = this.orders.find((o) => o.status === 'IN_PREPARAZIONE');
    if (prep) return this.ready(prep.id, prep.number);
    const conf = this.orders.find((o) => o.status === 'CONFERMATA');
    if (conf) return this.take(conf.id);
    const att = this.orders.find((o) => o.status === 'IN_ATTESA');
    if (att) return this.confirm(att.id);
  };
}

const DEMO_KEY = Symbol('dd-demo-store');

/** Create the shared demo store and expose it via context. Call in the page. */
export function provideDemoStore(): DemoStore {
  const store = new DemoStore();
  setContext(DEMO_KEY, store);
  return store;
}

/** Read the shared demo store from context (any descendant of the demo page). */
export function getDemoStore(): DemoStore {
  return getContext(DEMO_KEY) as DemoStore;
}
