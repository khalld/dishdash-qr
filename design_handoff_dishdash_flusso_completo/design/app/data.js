// Shared demo data for the DishDash QR — Full Flow prototype.
// Extends the UI-kit seed (scripts/seed.mjs from khalld/dishdash-qr).
window.DD = (function () {
  const tenant = { name: 'Pub del Centro', logoUrl: null };

  // QR sources for this tenant (each QR is tied to a table or pickup point)
  const sources = ['Tavolo 1', 'Tavolo 2', 'Tavolo 3', 'Tavolo 4', 'Tavolo 5', 'Asporto'];

  // prices in integer cents — never floats (CLAUDE.md §6)
  const menu = [
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

  // Status → italian label + Bootstrap contextual class
  const STATUS = {
    CARRELLO: { label: 'Carrello', cls: 'text-bg-secondary' },
    IN_ATTESA: { label: 'In attesa di conferma', cls: 'text-bg-warning' },
    CONFERMATA: { label: 'Confermata', cls: 'text-bg-info' },
    IN_PREPARAZIONE: { label: 'In preparazione', cls: 'text-bg-info' },
    PRONTA: { label: 'Pronta', cls: 'text-bg-success' },
    CONSEGNATA: { label: 'Consegnata', cls: 'text-bg-success' },
    RIFIUTATA: { label: 'Rifiutata', cls: 'text-bg-danger' },
    ANNULLATA: { label: 'Annullata', cls: 'text-bg-danger' }
  };

  // Short customer-facing labels for the tracking stepper
  const STEP_LABEL = {
    IN_ATTESA: 'In attesa',
    CONFERMATA: 'Confermata',
    IN_PREPARAZIONE: 'In preparazione',
    PRONTA: 'Pronta',
    CONSEGNATA: 'Consegnata'
  };

  // Seed orders already in the queues when the demo loads
  const seedOrders = [
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

  const tenants = [
    { id: 't1', name: 'Pub del Centro', gestore: 'gestore', lavoratori: 2, attivo: true },
    { id: 't2', name: 'Street Burger Co', gestore: 'marco.b', lavoratori: 3, attivo: true },
    { id: 't3', name: 'Birrificio Etna', gestore: 'andrea.r', lavoratori: 1, attivo: false }
  ];

  const lavoratori = [
    { id: 'l1', user: 'cucina-1', tenant: 'Pub del Centro' },
    { id: 'l2', user: 'cucina-2', tenant: 'Pub del Centro' },
    { id: 'l3', user: 'bar-1', tenant: 'Street Burger Co' }
  ];

  function euros(cents) {
    return (cents / 100).toFixed(2).replace('.', ',') + ' €';
  }
  function orderTotal(o) {
    return o.items.reduce((s, i) => s + i.price * i.qty, 0);
  }
  function nowHM() {
    const d = new Date();
    return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  }

  return {
    tenant,
    sources,
    menu,
    STATUS,
    STEP_LABEL,
    seedOrders,
    tenants,
    lavoratori,
    euros,
    orderTotal,
    nowHM
  };
})();
