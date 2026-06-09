// Deterministic synthetic monthly aggregate for the demo report (ported from
// `buildMonth` in the handoff's Gestore.jsx). Stable across renders so totals
// read sensibly. In the real app the monthly report is computed from delivered
// orders of the period — this is demo-only sample data.
import type { DemoMenuItem } from './store.svelte';

const GIORNI = ['dom', 'lun', 'mar', 'mer', 'gio', 'ven', 'sab'];

export interface MonthDay {
  d: number;
  wd: string;
  weekend: boolean;
  orders: number;
  revenue: number; // cents
}

export interface MonthAggregate {
  label: string;
  days: number;
  rows: MonthDay[];
  totalOrders: number;
  totalRevenue: number; // cents
  avgTicket: number; // cents
  best: MonthDay;
  maxRev: number;
  sellers: { name: string; price: number; qty: number }[];
  asporto: number;
  tavolo: number;
}

export function buildMonth(menu: DemoMenuItem[]): MonthAggregate {
  const YEAR = 2026;
  const MONTH = 4; // Maggio (May) 2026
  const days = 31;
  const rows: MonthDay[] = [];
  for (let d = 1; d <= days; d++) {
    const wd = new Date(YEAR, MONTH, d).getDay();
    const weekend = wd === 5 || wd === 6; // ven/sab busier
    const slow = wd === 1; // lunedì più calmo
    const jitter = ((d * 73) % 19) / 19; // 0..1, stable
    const n = Math.round((weekend ? 58 : slow ? 26 : 38) + jitter * 18);
    const avg = 1650 + Math.round(jitter * 520); // scontrino medio in cents
    rows.push({ d, wd: GIORNI[wd], weekend, orders: n, revenue: n * avg });
  }
  const totalOrders = rows.reduce((s, r) => s + r.orders, 0);
  const totalRevenue = rows.reduce((s, r) => s + r.revenue, 0);
  const avgTicket = Math.round(totalRevenue / totalOrders);
  const best = rows.reduce((a, b) => (b.revenue > a.revenue ? b : a), rows[0]);
  const maxRev = Math.max(...rows.map((r) => r.revenue));

  // best sellers: weight each menu item, derive a monthly quantity
  const weights = [22, 18, 14, 20, 9, 16, 12, 6];
  const wsum = weights.reduce((a, b) => a + b, 0);
  const sellers = menu
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
